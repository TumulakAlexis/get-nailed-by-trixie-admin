import React, { useState } from 'react';
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api"; 
import logo from './assets/logo.png';
import './adminlogin.css';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flow modes: 'login', 'requestOtp', 'verifyOtp'
  const [mode, setMode] = useState('login'); 
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const loginAction = useAction(api.login.login);
  const requestOtpAction = useAction(api.login.requestPasswordReset);
  const verifyOtpAction = useAction(api.login.verifyOtpAndResetPassword);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(false);
    setIsSubmitting(true);

    try {
      const isMatch = await loginAction({ password });
      if (isMatch) {
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

  const handleRequestOtpSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await requestOtpAction({ email: emailInput });
      alert("OTP has been sent to your authorized email address!");
      setMode('verifyOtp');
    } catch (err) {
      alert(err.message || "Failed to send OTP. Make sure the email matches the authorized admin email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (newPasswordInput.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtpAction({ otp: otpInput, newPassword: newPasswordInput });
      alert("Password reset successful! You can now log in with your new password.");
      setMode('login');
      setEmailInput('');
      setOtpInput('');
      setNewPasswordInput('');
    } catch (err) {
      alert(err.message || "Invalid or expired OTP code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-card-container">
        <header className="login-header">
          <div className="logo-wrapper">
            <img src={logo} alt="Get Nailed Logo" className="login-logo" />
          </div>
          <h1 className="login-brand">GET NAILED</h1>
          <p className="login-subtitle">by Trixie</p>
          <span className="login-est">EST. 2022</span>
        </header>

        <main className="login-content">
          {mode === 'login' && (
            <>
              <h2 className="welcome-msg">Welcome back, Trixie</h2>
              <form onSubmit={handleLoginSubmit} className="login-form">
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

                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setMode('requestOtp')} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, fontSize: '0.85rem' }}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === 'requestOtp' && (
            <>
              <h2 className="welcome-msg">Reset Password</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.2rem' }}>
                Enter your authorized admin email address to receive a verification OTP.
              </p>
              <form onSubmit={handleRequestOtpSubmit} className="login-form">
                <div className="input-group">
                  <label>Admin Email</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="trixie@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === 'verifyOtp' && (
            <>
              <h2 className="welcome-msg">Enter OTP & New Password</h2>
              <form onSubmit={handleVerifyOtpSubmit} className="login-form">
                <div className="input-group">
                  <label>6-Digit OTP Code</label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="123456"
                    maxLength="6"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="input-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Reset Password'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setMode('login')} 
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLogin;