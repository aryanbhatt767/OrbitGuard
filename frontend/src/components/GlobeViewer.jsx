import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getRiskColor } from '../utils/riskEngine';

/**
 * GlobeViewer — Three.js 3D Earth with real-time debris orbits.
 *
 * Props:
 *   debris      – array of scored debris objects
 *   selectedId  – currently selected object id
 *   onSelect    – callback(id) when user clicks a debris mesh
 */
export default function GlobeViewer({ debris, selectedId, onSelect }) {
  const mountRef = useRef(null);
  const stateRef = useRef({}); // renderer, scene, camera, meshMap, etc.

  // ---------- initialise Three.js once ----------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 12;

    // Lighting
    scene.add(new THREE.AmbientLight(0x223366, 0.7));
    const sun = new THREE.DirectionalLight(0x88aaff, 1.4);
    sun.position.set(6, 4, 6);
    scene.add(sun);

    // Earth
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x0a2a6e,
      emissive: 0x061428,
      emissiveIntensity: 0.4,
      shininess: 40,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Atmosphere glow
    const atmMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0x004488,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
      })
    );
    scene.add(atmMesh);

    // Lat/lon grid lines
    const gridMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.005, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x0055bb,
        wireframe: true,
        transparent: true,
        opacity: 0.07,
      })
    );
    scene.add(gridMesh);

    // Orbit shell rings (LEO, MEO, GEO indicators)
    const shellRadii = [
      { r: 1.18, color: 0x00d4ff, opacity: 0.12, label: 'LEO' },
      { r: 1.55, color: 0xffaa00, opacity: 0.08, label: 'MEO' },
      { r: 2.2,  color: 0xff44aa, opacity: 0.06, label: 'GEO' },
    ];
    shellRadii.forEach(({ r, color, opacity }) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.002, 8, 120),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
      );
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });

    // Starfield
    const starVerts = [];
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(Math.random() * 2 - 1);
      const r     = 60 + Math.random() * 80;
      starVerts.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.25, transparent: true, opacity: 0.6 })
      )
    );

    // Raycaster for click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const meshMap = {}; // norad id → mesh

    const onClick = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(meshMap));
      if (hits.length > 0) {
        onSelect(hits[0].object.userData.id);
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // Resize handler
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earth.rotation.y += 0.0008;
      controls.update();

      // Orbit debris meshes
      Object.values(meshMap).forEach(mesh => {
        const { r, phi, speed } = mesh.userData;
        mesh.userData.theta += speed;
        const θ = mesh.userData.theta;
        mesh.position.set(
          r * Math.cos(phi) * Math.cos(θ),
          r * Math.sin(phi),
          r * Math.cos(phi) * Math.sin(θ)
        );
      });

      renderer.render(scene, camera);
    };
    animate();

    // Store refs for updates
    stateRef.current = { renderer, scene, camera, controls, meshMap, earth };

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- sync debris meshes when data changes ----------
  useEffect(() => {
    const { scene, meshMap } = stateRef.current;
    if (!scene) return;

    // Remove old meshes no longer in data
    const incomingIds = new Set(debris.map(d => d.id));
    Object.keys(meshMap).forEach(id => {
      if (!incomingIds.has(id)) {
        scene.remove(meshMap[id]);
        meshMap[id].geometry.dispose();
        meshMap[id].material.dispose();
        delete meshMap[id];
      }
    });

    // Add or update meshes
    const EARTH_R = 1;
    debris.forEach(obj => {
      const color = new THREE.Color(getRiskColor(obj.riskScore));
      const normAlt = Math.min((obj.altitude - 160) / (2000 - 160), 1);
      const r = EARTH_R + 0.15 + normAlt * 0.9;
      const size = obj.rcs > 5 ? 0.028 : obj.rcs > 1 ? 0.018 : 0.012;

      if (meshMap[obj.id]) {
        // Update color (risk may have changed)
        meshMap[obj.id].material.color.set(color);
      } else {
        // Create new mesh
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 7, 7),
          new THREE.MeshBasicMaterial({ color })
        );
        const theta = Math.random() * Math.PI * 2;
        const phi   = (Math.random() - 0.5) * Math.PI;
        mesh.userData = {
          id:    obj.id,
          r,
          phi,
          theta,
          speed: (360 / obj.period) * 0.00008 * (Math.random() > 0.5 ? 1 : -1),
        };
        scene.add(mesh);
        meshMap[obj.id] = mesh;
      }
    });
  }, [debris]);

  // ---------- highlight selected ----------
  useEffect(() => {
    const { meshMap } = stateRef.current;
    if (!meshMap) return;
    Object.entries(meshMap).forEach(([id, mesh]) => {
      const obj = debris.find(d => d.id === id);
      if (!obj) return;
      const base = getRiskColor(obj.riskScore);
      mesh.material.color.set(id === selectedId ? 0xffffff : base);
      mesh.scale.setScalar(id === selectedId ? 2.5 : 1);
    });
  }, [selectedId, debris]);

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', background: '#030810', cursor: 'grab' }}
    />
  );
}
