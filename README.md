# OrbitGuard — AI Space Debris Tracker

> **AI-powered space situational awareness dashboard** with real-time 3D orbit visualization, collision prediction, and risk scoring using NASA/Space-Track APIs and Claude AI.

---

## Features

| Feature | Tech |
|---|---|
| Live 3D Earth + orbital debris | Three.js + OrbitControls |
| Real orbital elements (TLEs) | NASA Space-Track.org API |
| AI risk scoring (multi-factor) | Custom CARA-class model |
| Collision probability (Pc) | Gaussian miss-distance model |
| Natural-language analysis | Anthropic Claude API |
| Conjunction alerts (real-time) | Server-Sent Events |
| Space weather context | NASA DONKI API |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/your-username/orbitguard.git
cd orbitguard

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (see below)
```

### 3. Get API keys

| Service | URL | Cost |
|---|---|---|
| NASA Space-Track | https://www.space-track.org/auth/createAccount | Free |
| Anthropic Claude | https://console.anthropic.com | Pay-per-use |
| NASA APIs (DONKI) | https://api.nasa.gov | Free |

### 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Architecture

```
orbitguard/
├── frontend/               # React + Vite + Three.js
│   └── src/
│       ├── App.jsx                    # Root component
│       ├── components/
│       │   ├── GlobeViewer.jsx        # Three.js 3D Earth
│       │   ├── DebrisSidebar.jsx      # Object list + AI panel
│       │   ├── Header.jsx             # Stats header
│       │   └── AlertsBar.jsx          # Bottom alerts ticker
│       ├── hooks/
│       │   └── useDebrisData.js       # Data fetching + caching hook
│       └── utils/
│           └── riskEngine.js          # AI risk scoring engine
│
└── backend/                # Node.js + Express
    ├── server.js                      # Main entry point
    ├── services/
    │   └── spaceTrack.js              # Space-Track API client
    └── routes/
        ├── debris.js                  # /api/debris/* (catalog, CDMs)
        ├── ai.js                      # /api/ai/* (Claude analysis)
        └── alerts.js                  # /api/alerts/* (SSE stream)
```

---

## Risk Scoring Model

The AI risk engine (`riskEngine.js`) implements a weighted multi-factor model:

```
Risk Score = Σ(factor × weight)

Factors:
  Altitude bias    (30%) — lower LEO = higher atmospheric uncertainty
  Radar cross-section (22%) — proxy for mass and fragment potential
  Object type      (15%) — debris vs rocket body vs defunct satellite
  Inclination      (13%) — polar/retrograde orbits cross more lanes
  Local density    (12%) — objects in same ±50km shell
  Activity         (8%)  — recent maneuver history
```

Collision probability (Pc) uses a Gaussian miss-distance approximation:

```
Pc ≈ (π × HBR²) / (√(2π) × σ) × exp(−d² / 2σ²)

  HBR = combined hard-body radius (default 10m)
  σ   = 1-σ position uncertainty (default 200m)
  d   = TCA miss distance
```

---

## NASA APIs Used

### Space-Track.org (primary data)
- `GET /basicspacedata/query/class/TLE_LATEST` — current TLEs
- `GET /basicspacedata/query/class/satcat`      — satellite catalog
- `GET /basicspacedata/query/class/cdm_public`  — conjunction data messages

### NASA DONKI (space weather context)
- Solar flare events (affect atmospheric drag → orbit decay uncertainty)
- Geomagnetic storm data

### Anthropic Claude (AI analysis)
- Natural-language conjunction assessment
- Risk trend summarisation
- Operator recommendations

---

## Internship Project Highlights

- **Built an AI-powered system** to monitor satellites and space debris using real-time orbital TLE datasets from NASA Space-Track.org
- **Developed collision prediction** using Gaussian Pc model and multi-factor risk-scoring inspired by NASA CARA methodology
- **Created 3D visualization dashboard** using Three.js with interactive orbit tracking, raycaster-based object selection, and real-time mesh animation
- **Integrated NASA/space-data APIs** — Space-Track, DONKI — and Claude AI for automated situational awareness analysis
- **Implemented real-time alerts** via Server-Sent Events for conjunction warnings pushed to all connected clients

---

## License

MIT — built for educational and research purposes.

Data sourced from NASA Space-Track.org and NASA public APIs.
