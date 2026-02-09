import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Sidebar from './components/sidebar';
import StatCards from './components/statcards';
import CalendarView from './components/calendarview';
import BookingModal from './components/bookingmodal';
import ClosedDay from './closedday';
import TransactionsPage from './transactionspage'; 
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // --- DATA FETCHING ---
  const statsData = useQuery(api.admin.getStats);
  const bookings = useQuery(api.bookings.getAllBookings) || [];

  const getBookingsForDate = (date) => bookings.filter(b => b.date === date);

  // --- TAB RENDERING LOGIC ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="content-header">
              <StatCards
                total={statsData?.total}
                pending={statsData?.pending}
                completed={statsData?.completed}
                canceled={statsData?.canceled}
              />
            </div>
            <div className="calendar-wrapper">
              <CalendarView
                currentMonth={currentMonthDate}
                setCurrentMonth={setCurrentMonthDate}
                onDateClick={(date) => setSelectedDate(date)}
              />
            </div>
          </>
        );

      case 'transactions':
        return <TransactionsPage />;

      case 'closed-days': // Updated to match Sidebar key
        return <ClosedDay />;

      default:
        return (
          <div className="error-view">
            <p>Page not found.</p>
            <button onClick={() => setActiveTab('dashboard')}>Return to Dashboard</button>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="admin-content">
        {renderContent()}
      </main>

      {/* Booking Detail/Slot Modal Overlay */}
      {selectedDate && (
        <BookingModal
          date={selectedDate}
          dayBookings={getBookingsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;