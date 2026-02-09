import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Added faReceipt for the transactions icon
import { faChartSimple, faCalendarXmark, faReceipt } from '@fortawesome/free-solid-svg-icons'; 
import './sidebar.css';
import Logo from '../assets/logo.png';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo-section">
        <img src={Logo} alt="Logo" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        {/* DASHBOARD TAB */}
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FontAwesomeIcon icon={faChartSimple} className="nav-icon" />
          <span className="nav-text">Dashboard</span>
        </button>

        {/* TRANSACTIONS TAB (Added) */}
        <button 
          className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
          <span className="nav-text">Transactions</span>
        </button>

        {/* CLOSED DAYS TAB */}
        <button 
          className={`nav-item ${activeTab === 'closed-days' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed-days')}
        >
          <FontAwesomeIcon icon={faCalendarXmark} className="nav-icon" />
          <span className="nav-text">Set Closed Day</span>
        </button>

      </nav>
    </div>
  );
};

export default Sidebar;