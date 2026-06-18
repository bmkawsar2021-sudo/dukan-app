import React, { useState, useEffect } from 'react';
import { subscribeExpenses, addExpense, deleteExpense, getToday, formatCurrency, formatDate } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['rent', 'salary', 'utilities', 'purchase', 'other'];
const CATEGORY_LABELS = {
  rent: 'Rent',
  salary: 'Salary',
  utilities: 'Utilities',
  purchase: 'Purchase',
  other: 'Other',
};

const st = {
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  cardBody: { padding: 24 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  btnDanger: { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  btnGhost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  thRight: { textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)' },
  tdRight: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'right' },
  headerBar: { padding: '14px 20px', borderBottom: '1px solid var(--border)' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
};

const ExpenseTracker = () => {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(getToday());
  const [category, setCategory] = useState('purchase');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeExpenses(currentUser.uid, setExpenses);
    return () => unsub();
  }, [currentUser]);

  const handleAdd = async () => {
    if (!amount || Number(amount) <= 0 || !currentUser) return;
    await addExpense(currentUser.uid, { date, category, description, amount: Number(amount) });
    setDescription('');
    setAmount('');
    setSuccessMsg('Expense added!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleDelete = async (id) => {
    if (!currentUser) return;
    await deleteExpense(currentUser.uid, id);
  };

  const filtered = filterMonth
    ? expenses.filter((e) => e.date && e.date.startsWith(filterMonth))
    : expenses;

  const monthlySummary = {};
  expenses.forEach((exp) => {
    if (!exp.date) return;
    const month = exp.date.substring(0, 7);
    if (!monthlySummary[month]) monthlySummary[month] = { total: 0, byCategory: {} };
    monthlySummary[month].total += exp.amount || 0;
    monthlySummary[month].byCategory[exp.category] = (monthlySummary[month].byCategory[exp.category] || 0) + (exp.amount || 0);
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Expense Tracker</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Track Your Expenses</p>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)', color: 'var(--saffron)', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{successMsg}</div>
      )}

      {/* Add Expense Form */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={st.cardBody}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Add New Expense</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <label style={st.label}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={st.input} />
            </div>
            <div>
              <label style={st.label}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={st.select}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={st.label}>Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this expense for?" style={st.input} />
            </div>
            <div>
              <label style={st.label}>Amount (Tk.)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="0" style={{ ...st.input, flex: 1 }} />
                <button onClick={handleAdd} style={st.btnPrimary}>Add</button>
              </div>
            </div>
            <div className="cols-2" style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={st.cardBody}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 16 }}>
            <div>
              <label style={st.label}>Filter by Month</label>
              <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={st.input} />
            </div>
            <button onClick={() => setFilterMonth('')} style={st.btnGhost}>Show All</button>
            <div style={{ marginLeft: 'auto' }}>
              <span className="desktop-only" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total: </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(totalFiltered)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Date</th>
                <th style={st.th}>Category</th>
                <th style={st.th}>Description</th>
                <th style={st.thRight}>Amount</th>
                <th style={{ ...st.th, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ ...st.td, textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No expenses recorded yet.</td></tr>
              ) : (
                [...filtered].reverse().map((exp) => (
                  <tr key={exp.id}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={st.td}>{formatDate(exp.date)}</td>
                    <td style={st.td}>
                      <span style={st.badge}>{CATEGORY_LABELS[exp.category] || exp.category}</span>
                    </td>
                    <td style={st.td}>{exp.description || '-'}</td>
                    <td style={{ ...st.tdRight, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                    <td style={st.td}>
                      <button onClick={() => handleDelete(exp.id)} style={st.btnDanger}>X</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div style={st.card}>
        <div style={st.headerBar}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Monthly Summary</h3>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Month</th>
                {CATEGORIES.map((cat) => <th key={cat} style={st.thRight}>{CATEGORY_LABELS[cat]}</th>)}
                <th style={st.thRight}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlySummary).sort().reverse().map((month) => (
                <tr key={month}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...st.td, fontWeight: 600 }}>{new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                  {CATEGORIES.map((cat) => (
                    <td key={cat} style={{ ...st.tdRight, color: monthlySummary[month].byCategory[cat] ? 'var(--text-secondary)' : 'var(--border)' }}>
                      {monthlySummary[month].byCategory[cat] ? formatCurrency(monthlySummary[month].byCategory[cat]) : '-'}
                    </td>
                  ))}
                  <td style={{ ...st.tdRight, fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(monthlySummary[month].total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
