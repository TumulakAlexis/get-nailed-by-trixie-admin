import React, { useState } from 'react';
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api"; 
import './AdminLogin.css';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginAction = useAction(api.admin.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setIsSubmitting(true);

    try {
      // Calls Convex to compare input with the stored Bcrypt hash
      const isMatch = await loginAction({ password });

      if (isMatch) {
        // This triggers handleLoginSuccess in App.jsx
        onLogin(true);
      } else {
        setError(true);
        setPassword('');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card-container">
        <header className="login-header">
          <div className="logo-wrapper">
            <img src="/logo.png" alt="Get Nailed Logo" className="login-logo" />
          </div>
          <h1 className="login-brand">GET NAILED</h1>
          <p className="login-subtitle">by Trixie</p>
          <span className="login-est">EST. 2022</span>
        </header>

        <main className="login-content">
          <h2 className="welcome-msg">Welcome back, Trixie</h2>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  required
                  disabled={isSubmitting}
                  className={error ? 'error-input' : ''}
                />
                {error && (
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              {error && <p className="error-text">Incorrect password. Please try again.</p>}
            </div>

            <button 
              type="submit" 
              className={`login-submit-btn ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner-container">
                  <span className="btn-spinner"></span>
                  Verifying...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AdminLogin;