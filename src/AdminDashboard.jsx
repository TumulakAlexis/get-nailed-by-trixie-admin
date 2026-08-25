import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Sidebar from './components/sidebar';
import StatCards from './components/statcards';
import CalendarView from './components/calendarview';
import BookingModal from './components/bookingmodal';
import ClosedDay from './closedday';
import TransactionsPage from './transactionspage'; 
import ServicesPage from './servicespage'; 
import AdminReviews from './adminreviews';
import AdminPromoManager from './adminpromomanager';
import './admindashboard.css';

const AdminDashboard = ({ onLogout }) => { 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // --- DATA FETCHING ---
  const statsData = useQuery(api.admin.getStats);
  const bookings = useQuery(api.bookings.getAllBookings) || [];

  const getBookingsForDate = (date) => bookings.filter(b => b.date === date);

  // --- DERIVED DATA ---
  const pendingBookings = bookings.filter(
    (b) => (b.status === 'active' || b.status === 'pending') && b.name !== 'Occupied'
  );
  
  const recentTransactions = bookings
    .filter((b) => b.status === 'completed' || b.status === 'canceled')
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  // --- TAB RENDERING LOGIC ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="admin-dashboard-content-header">
              <StatCards
                total={statsData?.total}
                pending={statsData?.pending}
                completed={statsData?.completed}
                canceled={statsData?.canceled}
              />
            </div>

            <div className="admin-dashboard-grid">
              {/* Main Calendar View */}
              <div className="admin-dashboard-calendar-wrapper">
                <CalendarView
                  currentMonth={currentMonthDate}
                  setCurrentMonth={setCurrentMonthDate}
                  onDateClick={(date) => setSelectedDate(date)}
                />
              </div>

              {/* Side Panels */}
              <div className="admin-dashboard-panels-wrapper">
                {/* Pending Clients */}
                <div className="admin-panel pending-panel">
                  <div className="panel-header">
                    <h3>Pending Clients ({pendingBookings.length})</h3>
                  </div>
                  <div className="panel-list">
                    {pendingBookings.length === 0 ? (
                      <p className="empty-msg">No pending client requests.</p>
                    ) : (
                      pendingBookings.map((booking) => (
                        <div 
                          key={booking._id} 
                          className="pending-item"
                          onClick={() => setSelectedBookingDetail(booking)}
                        >
                          <div className="pending-info">
                            <span className="client-name">{booking.name}</span>
                            <span className="client-meta">{booking.date} • {booking.slot}</span>
                          </div>
                          <button className="view-btn">View Details</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent History */}
                <div className="admin-panel history-panel">
                  <div className="panel-header">
                    <h3>Recent History</h3>
                  </div>
                  <div className="panel-list">
                    {recentTransactions.length === 0 ? (
                      <p className="empty-msg">No recent activity.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx._id} className="history-item">
                          <div className="history-info">
                            <span className="client-name">{tx.name}</span>
                            <span className="client-meta">{tx.date} • ₱{tx.totalFee || 0}</span>
                          </div>
                          <span className={`status-badge status-${tx.status}`}>
                            {tx.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'transactions':
        return <TransactionsPage />;

      case 'closed-days':
        return <ClosedDay />;

      case 'services-management': 
        return <ServicesPage />;

      case 'reviews-management':
        return <AdminReviews />;

      case 'promo-manager':
        return <AdminPromoManager />;

      default:
        return (
          <div className="admin-dashboard-error-view">
            <p>Page not found.</p>
            <button onClick={() => setActiveTab('dashboard')}>Return to Dashboard</button>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />

      <main className="admin-dashboard-content">
        <div className="admin-dashboard-content-inner">
          {renderContent()}
        </div>
      </main>

      {/* Calendar Slot Modal */}
      {selectedDate && (
        <BookingModal
          date={selectedDate}
          dayBookings={getBookingsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Modernized Client Detail Modal */}
      {selectedBookingDetail && (
        <div className="modern-modal-overlay" onClick={() => setSelectedBookingDetail(null)}>
          <div className="modern-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-header">
              <div>
                <span className="modal-category-tag">Client Booking</span>
                <h2 className="modal-title">Booking Details</h2>
              </div>
              <button 
                className="icon-close-btn" 
                onClick={() => setSelectedBookingDetail(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="modern-modal-body">
              {/* Profile Card */}
              <div className="client-profile-card">
                <div className="client-avatar">
                  {selectedBookingDetail.name ? selectedBookingDetail.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="client-main-info">
                  <h3 className="client-name-title">{selectedBookingDetail.name}</h3>
                  <span className={`badge-pill badge-${selectedBookingDetail.status || 'active'}`}>
                    {selectedBookingDetail.status || 'active'}
                  </span>
                </div>
              </div>

              {/* Info Cards Grid */}
              <div className="info-cards-grid">
                <div className="detail-card">
                  <span className="detail-card-header">Facebook</span>
                  <p className="detail-primary-text">{selectedBookingDetail.facebookName || 'N/A'}</p>
                </div>
                <div className="detail-card">
                  <span className="detail-card-header">Phone</span>
                  <p className="detail-primary-text">{selectedBookingDetail.phone || 'N/A'}</p>
                </div>
                <div className="detail-card">
                  <span className="detail-card-header">Email</span>
                  <p className="detail-primary-text">{selectedBookingDetail.email || 'N/A'}</p>
                </div>
                <div className="detail-card">
                  <span className="detail-card-header">Schedule</span>
                  <p className="detail-primary-text">{selectedBookingDetail.date}</p>
                  <p className="detail-secondary-text">{selectedBookingDetail.slot}</p>
                </div>
              </div>

              {/* Requested Services */}
              <div className="services-card-wrapper">
                <div className="services-card-header">
                  <h4>Requested Services</h4>
                  <span className="services-count-badge">
                    {selectedBookingDetail.services?.length || 0} items
                  </span>
                </div>
                <div className="services-list-container">
                  {selectedBookingDetail.services?.length > 0 ? (
                    selectedBookingDetail.services.map((svc, idx) => (
                      <div className="service-item-row" key={idx}>
                        <span className="service-item-name">{svc.name}</span>
                        <span className="service-item-price">₱{svc.price}</span>
                      </div>
                    ))
                  ) : (
                    <div className="service-item-row empty">
                      <span>No specific services listed</span>
                    </div>
                  )}
                </div>
                <div className="total-fee-banner">
                  <span className="total-fee-label">Total Fee</span>
                  <span className="total-fee-amount">₱{selectedBookingDetail.totalFee || 0}</span>
                </div>
              </div>
            </div>

            <div className="modern-modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedBookingDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;