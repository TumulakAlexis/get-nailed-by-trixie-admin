import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { format } from 'date-fns';
import './transactionspage.css';

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("Supplies");

  const transactions = useQuery(api.admin.getAllTransactions) ?? [];
  const expenses = useQuery(api.admin.getAllExpenses) ?? [];
  
  const addExpense = useMutation(api.admin.addExpense);
  const deleteExpense = useMutation(api.admin.deleteExpense);
  const deleteTransaction = useMutation(api.admin.deleteTransaction);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handlePrint = () => {
    window.print();
  };

  const stats = useMemo(() => {
    const totalRev = transactions.reduce((acc, t) => acc + (Number(t.totalFee) || 0), 0);
    const totalExp = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const todayRev = transactions
      .filter(t => t.date === todayStr)
      .reduce((acc, t) => acc + (Number(t.totalFee) || 0), 0);

    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netIncome: totalRev - totalExp,
      todayRevenue: todayRev,
    };
  }, [transactions, expenses, todayStr]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    try {
      await addExpense({
        description: expDesc,
        amount: parseFloat(expAmount),
        category: expCat,
        date: todayStr,
      });
      setExpDesc("");
      setExpAmount("");
    } catch (err) { console.error(err); }
  };

  const filteredTransactions = transactions.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="transactions-container">
      {/* Top Header Cards */}
      <div className="trans-header">
        <div className="summary-card dark">
          <span>Net Profit</span>
          <h1>₱{stats.netIncome.toLocaleString()}</h1>
        </div>
        <div className="summary-card light">
          <span>Today's Revenue</span>
          <h1>₱{stats.todayRevenue.toLocaleString()}</h1>
        </div>
      </div>

      <div className="trans-content-vertical">
        {/* TOP SECTION: LOGGING & TRANSACTIONS */}
        <div className="main-log-section">
          <div className="expense-form-container">
            <h3>Log New Expense</h3>
            <form onSubmit={handleAddExpense} className="expense-form">
              <input 
                type="text" placeholder="Item/Description" 
                value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required
              />
              <input 
                type="number" placeholder="Amount" 
                value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required
              />
              <select value={expCat} onChange={(e) => setExpCat(e.target.value)}>
                <option value="Supplies">Supplies</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
              <button type="submit">Add to Expenses</button>
            </form>
          </div>

          <div className="log-header">
            <h2>Transaction Log</h2>
            <input 
              type="text" placeholder="Search customer..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="trans-search"
            />
          </div>

          <div className="trans-list">
            {filteredTransactions.map((t) => (
              <div key={t._id} className="trans-item">
                <div className="trans-details">
                  <h3>{t.services?.join(", ")}</h3>
                  <p>{t.name} • {t.date || "No Date"}</p>
                </div>
                <div className="trans-actions-right">
                  <span className="trans-amount positive">
                    + ₱{(Number(t.totalFee) || 0).toLocaleString()}
                  </span>
                  <button className="delete-btn-small" onClick={() => deleteTransaction({ id: t._id })}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM SECTION: INCOME STATEMENT */}
        <div className="bottom-report-section printable-report">
          <div className="report-card full-width">
            <h2>Income Statement</h2>
            
            <div className="report-grid">
              {/* Revenue Column */}
              <div className="report-col">
                <div className="report-row header">
                  <span>Total Revenue</span>
                  <span className="val-pos">₱{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <p className="sub-text">Total earnings from all completed bookings.</p>
              </div>

              {/* Expenses Column */}
              <div className="report-col">
                <div className="report-row header">
                  <span>Operating Expenses</span>
                  <span className="val-neg">- ₱{stats.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="expense-breakdown">
                  {expenses.map((e) => (
                    <div key={e._id} className="expense-line-item">
                      <span className="exp-desc">{e.description} ({e.category})</span>
                      <div className="exp-val-group">
                        <span className="exp-amt">₱{e.amount.toLocaleString()}</span>
                        <button className="del-exp" onClick={() => deleteExpense({ id: e._id })}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="report-divider"></div>
            
            <div className="report-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="report-row total" style={{ flex: 1 }}>
                <span>NET PROFIT</span>
                <span className="val-highlight">₱{stats.netIncome.toLocaleString()}</span>
              </div>
              
              {/* SMALLER PRINT BUTTON AT THE BOTTOM */}
              <button 
                onClick={handlePrint}
                className="delete-btn-small" 
                style={{ 
                  width: 'auto', 
                  padding: '5px 12px', 
                  fontSize: '11px', 
                  marginLeft: '20px',
                  borderRadius: '4px',
                  backgroundColor: '#f4f4f4',
                  color: '#666',
                  border: '1px solid #ddd'
                }}
              >
                Print Statement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;