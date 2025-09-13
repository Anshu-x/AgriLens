import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './pages.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('agl_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('agl_user');
    navigate('/');
  };

  return (
    <div className="page-grid">
      <div className="panel profile-card">
        <div className="panel-title">Your Profile</div>
        <div className="profile-row">
          <div className="avatar">👤</div>
          <div className="info">
            <div className="name">{user?.name || 'Farmer'}</div>
            <div className="email">{user?.email || 'unknown@example.com'}</div>
            <div className="meta">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'today'}</div>
          </div>
          <div className="actions">
            <button className="btn danger" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-field"><span>Farm name</span><strong>{user?.farmName || '—'}</strong></div>
          <div className="profile-field"><span>Location</span><strong>{user?.location || '—'}</strong></div>
          <div className="profile-field"><span>Phone</span><strong>{user?.phone || '—'}</strong></div>
          <div className="profile-field"><span>Preferred crop</span><strong>{user?.crop || '—'}</strong></div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


