import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // This pulls from your .env.local file
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === ADMIN_PASSWORD) {
      onLogin(true);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="admin-login-page">
      {/* Left Side: Hero Image */}
      <div className="login-hero">
        <div className="hero-overlay">
          <h1 className="hero-title">GET NAILED</h1>
          <p className="hero-subtitle">by Trixie</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="login-form-container">
        <div className="login-content">
          <div className="login-header">
             {/* Replace with your actual logo path */}
            <img src="/logo.png" alt="Get Nailed Logo" className="login-logo" />
            <h2 className="login-brand">GET NAILED</h2>
            <p className="login-est">by Trixie | EST. 2022</p>
          </div>

          <h3 className="welcome-msg">Hello Trixie!</h3>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                required
                className={error ? 'error-input' : ''}
              />
              {error && <p className="error-text">Incorrect password. Please try again.</p>}
            </div>
            <button type="submit" className="login-submit-btn">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;