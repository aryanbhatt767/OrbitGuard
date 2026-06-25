import React from 'react';

export default function Header({ stats, lastUpdate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#0a1628', borderBottom: '1px solid #1a3a5c', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: '#00d4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡</div>
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 600, color: '#00d4ff' }}>OrbitGuard</div>
          <div style={{ fontSize: 10, color: '#4a6fa5', letterSpacing: 1 }}>AI SPACE DEBRIS TRACKER</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          { val: stats.total ?? '--', label: 'Tracked Objects', color: '#00d4ff' },
          { val: stats.critical ?? '--', label: 'Critical Risk', color: '#ff2d55' },
          { val: stats.conjunctions ?? '--', label: 'Conjunctions/24h', color: '#ff8c00' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}