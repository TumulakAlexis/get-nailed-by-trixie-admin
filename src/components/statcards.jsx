import React from 'react';
import './statcards.css';

const StatCards = ({ total, pending, completed, canceled }) => {
  const stats = [
    { label: 'Total Bookings', value: total ?? 99, type: 'total' },
    { label: 'Pending', value: pending ?? 0, type: 'pending' },
    { label: 'Completed', value: completed ?? 0, type: 'completed' },
    { label: 'Canceled', value: canceled ?? 0, type: 'canceled' },
  ];

  // If total is undefined, the Convex query is still loading
  const isLoading = total === undefined;

  return (
    <div className="stats-container">
      {stats.map((stat, index) => (
        <div key={index} className={`stat-card ${stat.type}`}>
          <span className="stat-label">{stat.label}</span>
          <h2 className="stat-value">
            {isLoading ? "..." : stat.value}
          </h2>
        </div>
      ))}
    </div>
  );
};

export default StatCards;