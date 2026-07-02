import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartSimple, 
  faCalendarXmark, 
  faReceipt, 
  faList,
  faSignOutAlt // Added for Logout
} from '@fortawesome/free-solid-svg-icons'; 
import './sidebar.css';
import Logo from '../assets/logo.png';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-top-section">
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

          {/* TRANSACTIONS TAB */}
          <button 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
            <span className="nav-text">Transactions</span>
          </button>

          {/* SERVICES TAB */}
          <button 
            className={`nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services-management')}
          >
            <FontAwesomeIcon icon={faList} className="nav-icon" />
            <span className="nav-text">Services Menu</span>
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

      {/* LOGOUT SECTION (Pinned to bottom) */}
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={onLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;