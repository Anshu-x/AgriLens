import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }
    }
    
    // Demo authentication & persistence
    const existing = localStorage.getItem('agl_user');
    if (!existing && !isLogin) {
      // Treat as signup: save user profile details
      const newUser = {
        name: formData.name || 'Farmer',
        email: formData.email,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('agl_user', JSON.stringify(newUser));
    } else if (!existing && isLogin) {
      // If first time login without signup, create a minimal user
      const tempUser = { name: 'Farmer', email: formData.email, createdAt: new Date().toISOString() };
      localStorage.setItem('agl_user', JSON.stringify(tempUser));
    } else if (existing) {
      // On login, update email if changed
      try {
        const parsed = JSON.parse(existing);
        const updated = { ...parsed, email: formData.email || parsed.email };
        localStorage.setItem('agl_user', JSON.stringify(updated));
      } catch {}
    }

    // Navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-layout">
        {/* Left Side - Hero Image */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-logo">
              <div className="logo-icon">🌱</div>
              <h1>AgriLens</h1>
            </div>
            <h2>AI-Powered Crop Health Monitoring</h2>
            <p>Transform your farming with intelligent crop monitoring, predictive analytics, and real-time insights powered by satellite imagery and IoT sensors.</p>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Real-time Crop Analysis</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌡️</span>
                <span>Soil Health Monitoring</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🐛</span>
                <span>Pest & Disease Detection</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Mobile Alerts & Insights</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-placeholder">
              <div className="crop-icon">🌾</div>
              <div className="satellite-icon">🛰️</div>
              <div className="sensor-icon">📡</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="form-section">
          <div className="form-card">
            <div className="form-header">
              <h3>Welcome Back</h3>
              <p>Sign in to your AgriLens account</p>
            </div>

            <div className="form-tabs">
              <button 
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button 
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Enter your full name"
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                />
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              <button type="submit" className="submit-btn">
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="demo-note">
              <p>This is a demo version. Any credentials will work to access the dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

