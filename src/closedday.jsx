import React, { useState } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCalendarDay, faCalendarDays, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './closedday.css';

const TIME_SLOTS = ["9:00 AM", "1:00 PM", "4:00 PM"];

const ClosedDay = () => {
  const [dateList, setDateList] = useState([]);
  const [isMonthMode, setIsMonthMode] = useState(false);
  
  const manualOccupy = useMutation(api.admin.manualOccupy);
  const massUnblock = useMutation(api.admin.massUnblock);
  
  const existingBookings = useQuery(api.admin.checkExistingBookings, { dates: dateList });
  const hasConflict = existingBookings && existingBookings.length > 0;

  const handleDateSelect = (e) => {
    const date = e.target.value;
    if (!date) return;

    if (isMonthMode) {
      const [year, month] = date.split('-');
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(start);
      const days = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
      const uniqueDays = Array.from(new Set([...dateList, ...days]));
      setDateList(uniqueDays);
    } else {
      if (!dateList.includes(date)) {
        setDateList([...dateList, date]);
      }
    }
    e.target.value = "";
  };

  const removeDate = (dateToRemove) => {
    setDateList(dateList.filter(date => date !== dateToRemove));
  };

  const handleCloseDays = async () => {
    if (dateList.length === 0) return alert("Please select a date or month");

    if (hasConflict) {
      const conflictDates = [...new Set(existingBookings.map(b => b.date))].join(", ");
      return alert(`Action Blocked: The following dates have client bookings: ${conflictDates}. You must cancel or reschedule them first.`);
    }

    const confirmClose = window.confirm(`This will block all slots for ${dateList.length} days. Continue?`);
    if (confirmClose) {
      try {
        for (const date of dateList) {
          for (const slot of TIME_SLOTS) {
            await manualOccupy({ date, slot, name: "Occupied" });
          }
        }
        alert("Schedule successfully blocked!");
        setDateList([]);
      } catch (err) {
        alert("Error blocking days.");
      }
    }
  };

  const handleUnblockDays = async () => {
    if (dateList.length === 0) return alert("Please select dates to unblock");
    const confirm = window.confirm(`This will delete all "Occupied" blocks for ${dateList.length} days. Continue?`);
    if (confirm) {
      try {
        await massUnblock({ dates: dateList });
        alert("Days have been opened up for booking!");
        setDateList([]);
      } catch (err) {
        alert("Failed to unblock days.");
      }
    }
  };

  return (
    <div className="closeddash-container">
      <header className="closeddash-header">
        <h1>Set Closed Days</h1>
        <p>Manage calendar availability, block out holidays, or open up dates for client reservations.</p>
      </header>
      
      <div className="closeddash-setup-box">
        <div className="closeddash-mode-toggle">
          <button className={`closeddash-toggle-btn ${!isMonthMode ? 'active' : ''}`} onClick={() => setIsMonthMode(false)}>
            <FontAwesomeIcon icon={faCalendarDay} style={{marginRight: '8px'}} /> Single Days
          </button>
          <button className={`closeddash-toggle-btn ${isMonthMode ? 'active' : ''}`} onClick={() => setIsMonthMode(true)}>
            <FontAwesomeIcon icon={faCalendarDays} style={{marginRight: '8px'}} /> Whole Month
          </button>
        </div>

        <div className="closeddash-date-input-wrapper">
          <label>Select {isMonthMode ? "Month" : "Date"}</label>
          <input type={isMonthMode ? "month" : "date"} className="closeddash-date-picker-input" onChange={handleDateSelect} />
        </div>

        {dateList.length > 0 && (
          <div className="closeddash-selected-dates-wrapper">
            <div className="closeddash-list-header">
              <span>{dateList.length} days selected</span>
              <button className="closeddash-clear-all" onClick={() => setDateList([])}>Clear All</button>
            </div>
            <div className="closeddash-tags-container">
              {dateList.sort().map(date => (
                <div key={date} className="closeddash-date-tag">
                  {format(new Date(date), 'MMM dd, yyyy')}
                  <button onClick={() => removeDate(date)} className="closeddash-remove-tag-btn">
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="closeddash-button-group">
          <button 
            className={`closeddash-btn closeddash-btn-confirm ${hasConflict ? 'closeddash-btn-conflict' : ''}`} 
            onClick={handleCloseDays}
            disabled={dateList.length === 0}
          >
            {hasConflict ? (
              <><FontAwesomeIcon icon={faExclamationTriangle} /> Booking Conflict</>
            ) : "Block Schedule"}
          </button>

          <button className="closeddash-btn closeddash-btn-unblock" onClick={handleUnblockDays} disabled={dateList.length === 0}>
            Unblock / Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClosedDay;