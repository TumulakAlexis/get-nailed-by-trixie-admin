import React, { useState } from 'react';
import AdminLogin from './adminlogin'
import AdminDashboard from './admindashboard';
import './App.css';

function App() {
  // Initialize state based on localStorage string comparison
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isTrixieLoggedIn') === 'true';
  });

  // Called when loginAction returns true
  const handleLoginSuccess = (status) => {
    if (status) {
      setIsAuthenticated(true);
      localStorage.setItem('isTrixieLoggedIn', 'true');
    }
  };

  // Called from the Sidebar logout button
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isTrixieLoggedIn');
    // React automatically re-renders and shows the Login component
  };

  return (
    <div className="admin-app-container">
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLoginSuccess} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;