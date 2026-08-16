import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartSimple, 
  faCalendarXmark, 
  faReceipt, 
  faList,
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons'; 
import './sidebar.css';
import Logo from '../assets/logo.png';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="admin-sidebar" aria-label="Admin Navigation">
      <div className="sidebar-top-section">
        <div className="sidebar-logo-section">
          <div className="sidebar-logo-wrapper">
            <img src={Logo} alt="Get Nailed Logo" className="sidebar-logo" />
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* DASHBOARD TAB */}
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
          >
            <FontAwesomeIcon icon={faChartSimple} className="nav-icon" />
            <span className="nav-text">Dashboard</span>
          </button>

          {/* TRANSACTIONS TAB */}
          <button 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            title="Transactions"
          >
            <FontAwesomeIcon icon={faReceipt} className="nav-icon" />
            <span className="nav-text">Transactions</span>
          </button>

          {/* SERVICES TAB */}
          <button 
            className={`nav-item ${activeTab === 'services-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('services-management')}
            title="Services Menu"
          >
            <FontAwesomeIcon icon={faList} className="nav-icon" />
            <span className="nav-text">Services</span>
          </button>

          {/* CLOSED DAYS TAB */}
          <button 
            className={`nav-item ${activeTab === 'closed-days' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed-days')}
            title="Set Closed Day"
          >
            <FontAwesomeIcon icon={faCalendarXmark} className="nav-icon" />
            <span className="nav-text">Closed Days</span>
          </button>
        </nav>
      </div>

      {/* LOGOUT SECTION (Pinned to bottom) */}
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={onLogout} title="Logout">
          <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;