import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth,
  isSameDay,
  addMonths, // Added
  subMonths  // Added
} from 'date-fns';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Added
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'; // Added
import './calendarview.css';

// Added setCurrentMonth to props
const CalendarView = ({ currentMonth = new Date(), setCurrentMonth, onDateClick }) => {
  const allBookings = useQuery(api.bookings.getAllBookings) || [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'];

  // Handlers for changing months
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getActiveDayBookings = (day) => {
    const dayString = format(day, 'yyyy-MM-dd');
    return allBookings.filter(b => 
      b.date === dayString && 
      (b.status === "active" || !b.status)
    );
  };

  const getDayStatus = (activeBookings) => {
    if (activeBookings.length === 0) return 'vacant'; 
    if (activeBookings.length > 0 && activeBookings.length < 3) return 'busy'; 
    return 'occupied'; 
  };

  return (
    <div className="calendar-container">
      {/* --- ADDED NAVIGATION HEADER --- */}
      <div className="calendar-nav-header">
        <button className="nav-btn" onClick={handlePrevMonth}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h2 className="calendar-month-title">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button className="nav-btn" onClick={handleNextMonth}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      {/* ------------------------------ */}

      <div className="calendar-header-grid">
        {weekDays.map(day => (
          <div key={day} className="weekday-label">{day}</div>
        ))}
      </div>

      <div className="calendar-days-grid">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const dateString = format(day, 'yyyy-MM-dd');
          
          const dayBookings = getActiveDayBookings(day);
          const status = getDayStatus(dayBookings);

          return (
            <div 
              key={index} 
              className={`calendar-day 
                ${!isCurrentMonth ? 'disabled' : 'clickable'} 
                ${isToday ? 'today' : ''}`
              }
              onClick={() => isCurrentMonth && onDateClick(dateString)}
            >
              <div className="day-content">
                <div className="day-number-row">
                  <span className="day-number">{format(day, 'd')}</span>
                  {isCurrentMonth && (
                    <span className={`status-dot ${status}`}></span>
                  )}
                </div>
                
                <div className="calendar-name-container">
                  {isCurrentMonth && dayBookings.map((b, i) => (
                    <div key={i} className="calendar-name-tag">
                      {b.name === "Occupied" ? "Blocked" : b.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;