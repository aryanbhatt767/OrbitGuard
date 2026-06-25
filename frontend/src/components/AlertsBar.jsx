import React from 'react';

export default function AlertsBar({ debris }) {
  const critical = debris.filter(d => d.riskScore >= 0.7);
  return (
    <div style={{ padding: '8px 16px', background: '#0a1628', borderTop: '1px solid #1a3a5c', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}>LIVE — NASA Space-Track</span>
      </div>
      {[['#ff2d55','Critical (≥0.7)'],['#ff8c00','High (0.5–0.7)'],['#ffc800','Medium (0.3–0.5)'],['#00ff88','Low (<0.3)']].map(([c,l]) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#4a6fa5' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
        </div>
      ))}
      <div style={{ marginLeft: 'auto', fontSize: 10, color: '#1a3a5c', fontFamily: 'monospace' }}>
        {critical.length > 0 ? `⚠ ${critical.length} CRITICAL OBJECTS` : 'Nominal'}
      </div>
    </div>
  );
}