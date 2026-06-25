import React from 'react';

export default function DebrisSidebar({ debris, selected, activeTab, onTabChange, onSelect, stats }) {
  const riskColor = (score) => {
    if (score >= 0.7) return '#ff2d55';
    if (score >= 0.5) return '#ff8c00';
    if (score >= 0.3) return '#ffc800';
    return '#00ff88';
  };
  const riskLabel = (score) => {
    if (score >= 0.7) return 'CRITICAL';
    if (score >= 0.5) return 'HIGH';
    if (score >= 0.3) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div style={{ width: 280, background: '#0a1628', borderLeft: '1px solid #1a3a5c', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #1a3a5c' }}>
        {['objects','ai','alerts'].map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{
            flex: 1, padding: '10px 4px', fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.5px', cursor: 'pointer', border: 'none',
            background: activeTab === tab ? 'rgba(0,212,255,0.05)' : 'transparent',
            color: activeTab === tab ? '#00d4ff' : '#4a6fa5',
            borderBottom: activeTab === tab ? '2px solid #00d4ff' : '2px solid transparent'
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'objects' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: 14, borderBottom: '1px solid #1a3a5c' }}>
            <div style={{ fontSize: 10, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Overall Risk Index</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#ff8c00', fontFamily: 'monospace' }}>
              {stats.avgRisk ? (stats.avgRisk * 100).toFixed(1) + '%' : '--'}
            </div>
          </div>
          {selected && (
            <div style={{ padding: 12, borderBottom: '1px solid #1a3a5c', background: 'rgba(0,212,255,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#00d4ff', marginBottom: 8, fontFamily: 'monospace' }}>{selected.name}</div>
              {[['NORAD', selected.norad], ['Altitude', selected.altitude + ' km'], ['Inclination', selected.inclination?.toFixed(1) + '°'], ['Risk', (selected.riskScore * 100).toFixed(1) + '%']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#4a6fa5' }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', color: k === 'Risk' ? riskColor(selected.riskScore) : '#e8f4ff' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
          {debris.map(obj => (
            <div key={obj.id} onClick={() => onSelect(obj.id)} style={{
              padding: '10px 14px', borderBottom: '1px solid #1a3a5c', cursor: 'pointer',
              background: selected?.id === obj.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              borderLeft: selected?.id === obj.id ? '2px solid #00d4ff' : '2px solid transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: '#e8f4ff' }}>{obj.name}</span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, fontWeight: 600, background: riskColor(obj.riskScore) + '33', color: riskColor(obj.riskScore), border: `1px solid ${riskColor(obj.riskScore)}66` }}>{riskLabel(obj.riskScore)}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#4a6fa5' }}>
                <span>Alt: {obj.altitude}km</span>
                <span>Risk: {(obj.riskScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ai' && (
        <div style={{ padding: 14, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>AI Risk Assessment</div>
          {[
            { title: '🤖 Model Status', body: `Monitoring ${stats.total || 0} objects. ${stats.critical || 0} critical alerts detected.` },
            { title: '🛰 LEO Shell', body: 'LEO (160–2000km) is the highest-risk zone. Kessler cascade risk elevated at current debris density.' },
            { title: '📡 Conjunctions', body: `${stats.conjunctions || 0} conjunction events predicted in next 24h. ${stats.critical || 0} require operator action.` },
          ].map(card => (
            <div key={card.title} style={{ background: '#0f1e35', border: '1px solid #1a3a5c', borderRadius: 6, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#00d4ff', marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 11, color: '#8ab3d4', lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ padding: 14, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Active Alerts</div>
          {debris.filter(d => d.riskScore >= 0.5).map(obj => (
            <div key={obj.id} style={{ background: '#0f1e35', borderLeft: `3px solid ${riskColor(obj.riskScore)}`, borderRadius: 6, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: riskColor(obj.riskScore), marginBottom: 4 }}>⚠ {riskLabel(obj.riskScore)} — {obj.name}</div>
              <div style={{ fontSize: 11, color: '#8ab3d4' }}>Alt: {obj.altitude}km · Risk: {(obj.riskScore * 100).toFixed(1)}% · NORAD {obj.norad}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}