import React, { useState, useEffect } from 'react';
import GlobeViewer from './components/GlobeViewer';
import DebrisSidebar from './components/DebrisSidebar';
import Header from './components/Header';
import AlertsBar from './components/AlertsBar';
import useDebrisData from './hooks/useDebrisData';
import './App.css';

export default function App() {
  const { debris, stats, loading, error, lastUpdate, refetch } = useDebrisData();
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('objects');

  const selectedObject = debris.find(d => d.id === selectedId) || null;

  useEffect(() => {
    const interval = setInterval(refetch, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="app">
      <Header stats={stats} lastUpdate={lastUpdate} />

      {error && (
        <div className="error-banner">
          ⚠ API Error: {error} — showing cached data
        </div>
      )}

      <div className="main-layout">
        <div className="globe-panel">
          {loading ? (
            <div className="loading-screen">
              <div className="loading-ring" />
              <p>Fetching orbital catalog…</p>
            </div>
          ) : (
            <GlobeViewer
              debris={debris}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        <DebrisSidebar
          debris={debris}
          selected={selectedObject}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelect={setSelectedId}
          stats={stats}
        />
      </div>

      <AlertsBar debris={debris} />
    </div>
  );
}
