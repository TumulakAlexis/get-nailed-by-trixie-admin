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
  addMonths, 
  subMonths  
} from 'date-fns';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'; 
import './calendarview.css';

const MAX_DAILY_CAPACITY = 3; // Adjust this if your max daily slots differ

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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    if (activeBookings.length >= MAX_DAILY_CAPACITY) return 'occupied'; 
    return 'busy'; 
  };

  return (
    <div className="calendar-container">
      {/* Navigation Header */}
      <div className="calendar-nav-header">
        <h2 className="calendar-month-title">
          {format(currentMonth, 'MMMM')} <span>{format(currentMonth, 'yyyy')}</span>
        </h2>
        <div className="nav-actions">
          <button className="nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="nav-btn" onClick={handleNextMonth} aria-label="Next month">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="calendar-grid-wrapper">
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
            const vacantCount = MAX_DAILY_CAPACITY - dayBookings.length;

            return (
              <div 
                key={index} 
                className={`calendar-day 
                  ${!isCurrentMonth ? 'disabled' : 'clickable'} 
                  ${isToday ? 'is-today-cell' : ''}`
                }
                onClick={() => isCurrentMonth && onDateClick(dateString)}
              >
                <div className="day-number-row">
                  <span className={`day-number ${isToday ? 'today-highlight' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && (
                    <span className={`status-dot ${status}`} title={`Status: ${status}`}></span>
                  )}
                </div>
                
                <div className="calendar-name-container">
                  {isCurrentMonth && (
                    <>
                      {/* CONDITIONAL ROLLUP logic */}
                      {dayBookings.length >= MAX_DAILY_CAPACITY ? (
                        <div className="calendar-name-tag tag-fully-occupied">
                          Day Occupied
                        </div>
                      ) : (
                        <>
                          {/* List active bookings */}
                          {dayBookings.map((b, i) => {
                            const isBlocked = b.name === "Occupied";
                            return (
                              <div 
                                key={i} 
                                className={`calendar-name-tag ${isBlocked ? 'tag-blocked' : 'tag-active'}`}
                              >
                                {isBlocked ? "Blocked" : b.name}
                              </div>
                            );
                          })}

                          {/* Indicate vacant remaining spots */}
                          {vacantCount > 0 && (
                            <div className="calendar-name-tag tag-vacant-info">
                              {vacantCount === MAX_DAILY_CAPACITY 
                                ? "Vacant" 
                                : `${vacantCount} ${vacantCount === 1 ? 'spot' : 'spots'} left`}
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;