import React, { useEffect, useMemo, useState } from 'react';
import './pages.css';
import heatmapImg from '../images/heatmap.jpeg';

type TrendPoint = { x: number; y: number };

const DashboardPage: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // 30-day CHI series only
  const chiSeries = useMemo<TrendPoint[]>(() => Array.from({ length: 30 }, (_, i) => ({ x: i + 1, y: 0.55 + Math.sin(i / 5) * 0.08 + (Math.random() - 0.5) * 0.04 })), []);
  const latestChi = chiSeries[chiSeries.length - 1]?.y ?? 0.6;
  const kpis = {
    chi: +(latestChi * 100).toFixed(1),
    npk: 'N:40 P:22 K:35 kg/ha',
    ph: 6.4,
    soilTemp: 23.8,
    moisture: 27,
    humidity: 61,
  };

  // Fake plot dropdown state
  const plots = ['Plot A', 'Plot B', 'Plot C', 'North Field', 'South Field'];
  const [selectedPlot, setSelectedPlot] = useState<string>(plots[0]);
  const [plotMenuOpen, setPlotMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectPlot = (p: string) => {
    setPlotMenuOpen(false);
    if (p === selectedPlot) return;
    setSelectedPlot(p);
    setIsLoading(true);
    // Simulate data fetch latency for plot change
    window.setTimeout(() => setIsLoading(false), 900);
  };

  return (
    <div className="dash-wrap">
      <header className="dash-header">
        <div className="dash-title">
          <span className="logo">🌱</span>
          <div className="t">
            <h1>AgriLens Dashboard</h1>
            <p>{now.toLocaleDateString()} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="dash-actions">
          <button className="btn ghost">Add Plot</button>
          <button className="btn primary">New Report</button>
        </div>
      </header>

      <main className="dash-grid" aria-busy={isLoading}>
        <section className="card map" aria-label="Field heatmap">
          <div className="map-head">
            <div className="map-title">Selected: {selectedPlot}</div>
            <div className="dropdown" onClick={() => setPlotMenuOpen(v => !v)} role="button" aria-haspopup="listbox" aria-expanded={plotMenuOpen}>
              <span>{selectedPlot}</span>
              <span className="caret">▾</span>
              {plotMenuOpen && (
                <ul className="dropdown-menu" role="listbox">
                  {plots.map(p => (
                    <li key={p} role="option" aria-selected={p === selectedPlot} onClick={() => handleSelectPlot(p)}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className={`map-image ${isLoading ? 'skeleton' : ''}`} style={!isLoading ? { backgroundImage: `url(${heatmapImg})` } : undefined} />
          <div className="legend">
            <span>Low</span>
            <div className="legend-bar" />
            <span>High</span>
          </div>
        </section>

        <section className="card chatbot" aria-label="Assistant chatbot">
          <div className="chatbot-head">
            <h3>AgriLens Assistant</h3>
            <span className="status online">Online</span>
          </div>
          <div className="chatbot-messages" role="log" aria-live="polite">
            <div className="msg bot">
              <span className="avatar" aria-hidden>🤖</span>
              <div className="bubble">Hi! Ask me anything about your fields, CHI, or irrigation.</div>
            </div>
          </div>
          <form className="chatbot-input" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Type a message..." aria-label="Message input" />
            <button className="btn primary" type="submit">Send</button>
          </form>
        </section>

        <section className="card hero">
          <div className="hero-left">
            <h2>Field Health Overview</h2>
            <p>Live satellite indices, sensor vitals, and yield outlook at a glance.</p>
            <div className="hero-kpis">
              <div className="metric">
                <span className="label">CHI</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '60%' }} /> : <span className="value green">{kpis.chi}%</span>}
              </div>
              <div className="metric">
                <span className="label">NPK</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '80%' }} /> : <span className="value purple">{kpis.npk}</span>}
              </div>
              <div className="metric">
                <span className="label">pH</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '40%' }} /> : <span className="value purple">{kpis.ph}</span>}
              </div>
              <div className="metric">
                <span className="label">Soil Temp</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '50%' }} /> : <span className="value orange">{kpis.soilTemp}°C</span>}
              </div>
              <div className="metric">
                <span className="label">Moisture</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '55%' }} /> : <span className="value blue">{kpis.moisture}%</span>}
              </div>
              <div className="metric">
                <span className="label">Humidity</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '55%' }} /> : <span className="value blue">{kpis.humidity}%</span>}
              </div>
            </div>
          </div>
          <div className="hero-right chart-paper">
            <div className={`graph-surface ${isLoading ? 'skeleton-rect' : ''}`}>
              {!isLoading && (
              <svg width="100%" height="260" viewBox="0 0 700 260" preserveAspectRatio="none" aria-label="CHI 30-day chart">
                <defs>
                  <linearGradient id="chiStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="chiFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.28)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                  </linearGradient>
                </defs>
                {/* Axes */}
                <line x1="40" y1="10" x2="40" y2="220" stroke="#94a3b8" strokeWidth="1" />
                <line x1="40" y1="220" x2="680" y2="220" stroke="#94a3b8" strokeWidth="1" />
                {/* Y ticks */}
                {Array.from({ length: 5 }, (_, i) => 0 + i).map(i => {
                  const y = 220 - (i / 4) * 180;
                  const label = (i / 4).toFixed(1);
                  return (
                    <g key={i}>
                      <line x1="40" y1={y} x2="680" y2={y} stroke="#e2e8f0" strokeWidth="1" />
                      <text x="10" y={y + 4} fill="#64748b" fontSize="10">{label}</text>
                    </g>
                  );
                })}
                {/* X ticks every 5 days */}
                {Array.from({ length: 6 }, (_, i) => i * 5).map((d, idx) => {
                  const x = 40 + (d / 30) * 640;
                  return (
                    <g key={idx}>
                      <line x1={x} y1="220" x2={x} y2="224" stroke="#94a3b8" />
                      <text x={x - 6} y="238" fill="#64748b" fontSize="10">{d}</text>
                    </g>
                  );
                })}
                {/* Path and fill (scaled into inner area 40..680 x 40..220) */}
                {(() => {
                  const minY = Math.min(...chiSeries.map(p => p.y));
                  const maxY = Math.max(...chiSeries.map(p => p.y));
                  const scaleX = (x: number) => 40 + ((x - 1) / 29) * 640;
                  const scaleY = (y: number) => 220 - ((y - minY) / (maxY - minY || 1)) * 180;
                  const d = chiSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');
                  const area = `${d} L 680 220 L 40 220 Z`;
                  return (
                    <g>
                      <path d={area} fill="url(#chiFill)" />
                      <path d={d} fill="none" stroke="url(#chiStroke)" strokeWidth="3" />
                    </g>
                  );
                })()}
              </svg>
              )}
            </div>
            <div className="chart-caption">CHI over last 30 days</div>
          </div>
        </section>

        <section className="card future">
          <div className="future-head">
            <h3>Future Yields & Risks</h3>
            <span className="badge up">Projected +12.4%</span>
          </div>
          <div className="future-grid">
            <div className="fy-card high">
              <div className="fy-icon" aria-hidden>🐛</div>
              <div className="fy-body">
                <div className="fy-title">Aphid risk spike</div>
                <div className="fy-meta">Cause: Warm, humid nights with leaf chlorosis pattern</div>
                <div className="fy-solution">Solution: Scout rows 5–8 and apply biocontrol if confirmed</div>
              </div>
              <span className="fy-badge high">High</span>
            </div>
            <div className="fy-card medium">
              <div className="fy-icon" aria-hidden>💧</div>
              <div className="fy-body">
                <div className="fy-title">Soil moisture deficit</div>
                <div className="fy-meta">Cause: VWC under 20% in Zone B for 3h</div>
                <div className="fy-solution">Solution: 20‑min drip cycle this evening; monitor overnight</div>
              </div>
              <span className="fy-badge medium">Medium</span>
            </div>
            <div className="fy-card low">
              <div className="fy-icon" aria-hidden>🌧️</div>
              <div className="fy-body">
                <div className="fy-title">Rain window in 48h</div>
                <div className="fy-meta">Cause: Incoming front; elevated precip probability</div>
                <div className="fy-solution">Solution: Hold irrigation; schedule N split after rainfall</div>
              </div>
              <span className="fy-badge low">Info</span>
            </div>
            <div className="fy-card medium">
              <div className="fy-icon" aria-hidden>🌡️</div>
              <div className="fy-body">
                <div className="fy-title">Heat stress pockets</div>
                <div className="fy-meta">Cause: Afternoon canopy temps &gt; 32°C, low wind</div>
                <div className="fy-solution">Solution: Stagger irrigation earlier; add shade nets if possible</div>
              </div>
              <span className="fy-badge medium">Medium</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;


