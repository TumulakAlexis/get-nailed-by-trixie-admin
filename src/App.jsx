import React, { useState, useEffect } from 'react';
import AdminLogin from './adminlogin'
import AdminDashboard from './admindashboard';
import './App.css';

function App() {
  // Check localStorage on load so Trixie stays logged in if she refreshes
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isTrixieLoggedIn') === 'true';
  });

  // Function to handle successful login
  const handleLoginSuccess = (status) => {
    setIsAuthenticated(status);
    localStorage.setItem('isTrixieLoggedIn', status);
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isTrixieLoggedIn');
  };

  return (
    <div className="admin-app-container">
      {!isAuthenticated ? (
        // Show the login page if not authenticated
        <AdminLogin onLogin={handleLoginSuccess} />
      ) : (
        // Show the dashboard once logged in
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;