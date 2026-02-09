import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { format } from 'date-fns';
import './transactionspage.css';

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const transactions = useQuery(api.admin.getAllTransactions) || [];

  // Logic for the Summary Header
  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalFee, 0);
  const todayRevenue = transactions
    .filter(t => t.date === format(new Date(), 'yyyy-MM-dd'))
    .reduce((sum, t) => sum + t.totalFee, 0);

  const filteredTransactions = transactions.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="transactions-container">
      {/* Header Summary Cards (Reference: Image top row) */}
      <div className="trans-header">
        <div className="summary-card dark">
          <span>Total Revenue</span>
          <h1>₱{totalRevenue.toLocaleString()}</h1>
        </div>
        <div className="summary-card light">
          <span>Today's Sales</span>
          <h1>₱{todayRevenue.toLocaleString()}</h1>
        </div>
      </div>

      <div className="trans-content-layout">
        <div className="main-log-section">
          <div className="log-header">
            <h2>Recent Transactions</h2>
            <input 
              type="text" 
              placeholder="Search by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="trans-search"
            />
          </div>

          <div className="trans-list">
            {filteredTransactions.map((t) => (
              <div key={t._id} className="trans-item">
                <div className="trans-icon-block"></div>
                <div className="trans-details">
                  <h3>{t.services.join(", ")}</h3>
                  <p>{t.name} • {t.date}</p>
                </div>
                <div className="trans-amount positive">
                  + ₱{t.totalFee.toLocaleString()}
                </div>
              </div>
            ))}
            <div className="nothing-follows">
              <span>Nothing Follows</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TransactionsPage;