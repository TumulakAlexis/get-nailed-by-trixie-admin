import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { format } from 'date-fns';
import './transactionspage.css';

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(20); // Track how many items to show
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

  // --- CORPORATE FINANCIAL METRICS COMPUTATION ---
  const stats = useMemo(() => {
    const totalRev = transactions.reduce((acc, t) => acc + (Number(t.totalFee) || 0), 0);
    const totalExp = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const netInc = totalRev - totalExp;
    const profitMargin = totalRev > 0 ? ((netInc / totalRev) * 100).toFixed(1) : 0;
    
    const todayRev = transactions
      .filter(t => t.date === todayStr)
      .reduce((acc, t) => acc + (Number(t.totalFee) || 0), 0);

    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {});

    return {
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      netIncome: netInc,
      profitMargin: Number(profitMargin),
      todayRevenue: todayRev,
      expensesByCategory,
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

  // --- FILTER & PAGINATION LOGIC ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setVisibleCount(20); // Reset pagination index on search change
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20); // Load 20 more items
  };

  return (
    <div className="transdash-container">
      {/* Print-Only Executive Header */}
      <div className="transdash-print-header" style={{ display: 'none' }}>
        <h1>Corporate Executive Financial Report</h1>
        <p>Generated on: {format(new Date(), 'PPPP p')}</p>
        <hr />
      </div>

      {/* Top Executive KPI Grid */}
      <div className="transdash-kpi-grid">
        <div className="transdash-kpi-card transdash-dark">
          <div className="transdash-kpi-header-row">
            <span>Net Profit (YTD)</span>
            <span className="transdash-badge">Active</span>
          </div>
          <h2>₱{stats.netIncome.toLocaleString()}</h2>
          <p className="transdash-kpi-sub">Margin: {stats.profitMargin}%</p>
        </div>

        <div className="transdash-kpi-card">
          <span>Gross Revenue</span>
          <h2>₱{stats.totalRevenue.toLocaleString()}</h2>
          <p className="transdash-kpi-sub positive">Lifetime collections</p>
        </div>

        <div className="transdash-kpi-card">
          <span>Operating Expenses</span>
          <h2>₱{stats.totalExpenses.toLocaleString()}</h2>
          <p className="transdash-kpi-sub negative">Total overhead</p>
        </div>

        <div className="transdash-kpi-card">
          <span>Today's Revenue</span>
          <h2>₱{stats.todayRevenue.toLocaleString()}</h2>
          <p className="transdash-kpi-sub">Real-time daily flow</p>
        </div>
      </div>

      {/* Main Corporate Workspace Grid */}
      <div className="transdash-workspace">
        
        {/* LEFT COLUMN: Transaction Ledger & Expense Form */}
        <div className="transdash-column">
          
          {/* Expense Logger Module */}
          <div className="transdash-panel">
            <h3>Log Operational Expense</h3>
            <form onSubmit={handleAddExpense} className="transdash-expense-form">
              <input
                type="text" placeholder="Expense description..."
                value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required
              />
              <input
                type="number" placeholder="Amount (₱)"
                value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required
              />
              <select value={expCat} onChange={(e) => setExpCat(e.target.value)}>
                <option value="Supplies">Supplies</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
              <button type="submit">Record Expense</button>
            </form>
          </div>

          {/* Transaction Ledger */}
          <div className="transdash-panel">
            <div className="transdash-panel-header">
              <h3>Transaction Ledger</h3>
              <input
                type="text" placeholder="Filter customer..."
                value={searchTerm} onChange={handleSearchChange}
                className="transdash-search"
              />
            </div>

            <div className="transdash-list">
              {displayedTransactions.length === 0 ? (
                <p className="transdash-empty-text">No transactions found.</p>
              ) : (
                <>
                  {displayedTransactions.map((t) => (
                    <div key={t._id} className="transdash-item">
                      <div className="transdash-details">
                        <h4>{t.services?.map(s => typeof s === 'object' ? s.name : s).join(", ")}</h4>
                        <p>{t.name} &bull; {t.date || "No Date"}</p>
                      </div>
                      <div className="transdash-actions">
                        <span className="transdash-amount">
                          + ₱{(Number(t.totalFee) || 0).toLocaleString()}
                        </span>
                        <button className="transdash-del-btn" onClick={() => deleteTransaction({ id: t._id })}>×</button>
                      </div>
                    </div>
                  ))}

                  {/* Load More Trigger */}
                  {visibleCount < filteredTransactions.length && (
                    <button className="transdash-load-more-btn" onClick={handleLoadMore}>
                      Load More ({filteredTransactions.length - visibleCount} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Corporate Income Statement & Analytical Breakdown */}
        <div className="transdash-column printable-report">
          <div className="transdash-panel corporate-statement">
            <div className="statement-header-row">
              <h3>Income Statement & Breakdown</h3>
              <button onClick={handlePrint} className="transdash-print-btn">Print Report</button>
            </div>

            <div className="transdash-statement-grid">
              {/* Revenue Line */}
              <div className="statement-row header-row">
                <span>Total Gross Revenue</span>
                <span className="val-pos">₱{stats.totalRevenue.toLocaleString()}</span>
              </div>
              <p className="statement-sub">Consolidated income from all service bookings.</p>

              <div className="transdash-divider"></div>

              {/* Expense Line & Categorized Overhead */}
              <div className="statement-row header-row">
                <span>Operating Overhead</span>
                <span className="val-neg">- ₱{stats.totalExpenses.toLocaleString()}</span>
              </div>
              
              <div className="transdash-expense-breakdown">
                {Object.keys(stats.expensesByCategory).length === 0 ? (
                  <p className="transdash-empty-text">No expenses recorded.</p>
                ) : (
                  Object.entries(stats.expensesByCategory).map(([cat, amt]) => (
                    <div key={cat} className="transdash-cat-row">
                      <span className="cat-name">{cat}</span>
                      <span className="cat-amt">₱{amt.toLocaleString()}</span>
                    </div>
                  ))
                )}

                <div className="transdash-expense-list-scroll">
                  {expenses.map((e) => (
                    <div key={e._id} className="transdash-expense-item">
                      <div>
                        <span className="exp-title">{e.description}</span>
                        <span className="exp-category-tag">{e.category}</span>
                      </div>
                      <div className="exp-right">
                        <span>₱{e.amount.toLocaleString()}</span>
                        <button className="transdash-del-exp" onClick={() => deleteExpense({ id: e._id })}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="transdash-divider"></div>

            {/* Bottom Net Summary */}
            <div className="transdash-net-box">
              <div>
                <span className="net-label">NET CORPORATE PROFIT</span>
                <p className="net-sub">Operating Margin: {stats.profitMargin}%</p>
              </div>
              <span className="net-value">₱{stats.netIncome.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionsPage;