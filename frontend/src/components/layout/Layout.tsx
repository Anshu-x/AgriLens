import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout: React.FC = () => {
  const [activeDrawerTab, setActiveDrawerTab] = useState<'nav' | 'notif'>('nav');
  const navigate = useNavigate();
  const location = useLocation();

  const notifications = useMemo(
    () => [
      { id: 'n1', icon: '🛰️', title: 'NDVI drop detected', time: '2m ago', severity: 'high', desc: 'Satellite pass shows a sharp decline in NDVI over the north quadrant. Investigate irrigation and leaf discoloration.' },
      { id: 'n2', icon: '💧', title: 'Soil moisture low – Plot A', time: '15m ago', severity: 'medium', desc: 'Sensor S-14 reports 14% VWC for 3 hours. Consider drip cycle of 20 minutes this evening.' },
      { id: 'n3', icon: '🐛', title: 'Pest risk increased (aphids)', time: '1h ago', severity: 'high', desc: 'Weather + chlorosis pattern suggests aphid activity. Scout rows 5–8; apply biocontrol if confirmed.' },
      { id: 'n4', icon: '🌿', title: 'Fertilizer recommendation ready', time: '3h ago', severity: 'low', desc: 'NPK model recommends 40kg/ha Nitrogen split in two doses over next 7 days.' }
    ],
    []
  );

  const hasNew = notifications.some(n => n.severity === 'high');

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="agl-app">
      <header className="agl-navbar">
        <div className="agl-navbar-inner">
          <Link to="/dashboard" className="agl-brand" aria-label="AgriLens Home">
            <span className="agl-brand-icon">🌱</span>
            <span className="agl-brand-text">AgriLens</span>
          </Link>

          {/* Navigation buttons removed as per request; navigation lives in drawer */}

          <button className="agl-profile" onClick={handleProfileClick} aria-label="Profile">
            <span className="agl-avatar">👤</span>
          </button>
        </div>
      </header>

      <div className="agl-layout">
        <main className="agl-content" aria-live="polite">
          <Outlet />
        </main>

        <aside className="agl-drawer" aria-label="Side drawer">
          <div className="agl-drawer-tabs">
            <button
              className={`agl-drawer-tab ${activeDrawerTab === 'nav' ? 'active' : ''}`}
              onClick={() => setActiveDrawerTab('nav')}
              title="Navigation"
            >
              🧭 Navigation
            </button>
            <button
              className={`agl-drawer-tab ${activeDrawerTab === 'notif' ? 'active' : ''}`}
              onClick={() => setActiveDrawerTab('notif')}
              title="Notifications"
            >
              🔔 Notifications {hasNew && <span className="agl-badge" aria-label="new notifications" />}
            </button>
          </div>

          {activeDrawerTab === 'nav' ? (
            <div className="agl-drawer-section">
              <div className="agl-drawer-group">
                <p className="agl-drawer-title">Pages</p>
                <ul className="agl-drawer-list">
                  <li><NavLink to="/dashboard" className={({ isActive }) => `agl-drawer-link ${isActive ? 'current' : ''}`}>Dashboard</NavLink></li>
                  <li><NavLink to="/add-plot" className={({ isActive }) => `agl-drawer-link ${isActive ? 'current' : ''}`}>Add Plot</NavLink></li>
                  <li><NavLink to="/reports" className={({ isActive }) => `agl-drawer-link ${isActive ? 'current' : ''}`}>Reports</NavLink></li>
                  <li><NavLink to="/profile" className={({ isActive }) => `agl-drawer-link ${isActive ? 'current' : ''}`}>Profile</NavLink></li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="agl-drawer-section">
              <div className="agl-drawer-group">
                <p className="agl-drawer-title">Notifications</p>
                <ul className="agl-notif-list">
                  {notifications.map(n => (
                    <li key={n.id} className={`agl-notif ${n.severity}`}>
                      <span className="icon" aria-hidden>{n.icon}</span>
                      <div className="text">
                        <span className="title">{n.title}</span>
                        <span className="desc">{n.desc}</span>
                        <span className="time">{n.time}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="agl-drawer-footer">
            <span className="muted">{location.pathname}</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;


