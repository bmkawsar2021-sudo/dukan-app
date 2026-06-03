import React, { useState, useEffect } from 'react';
import { subscribeExpenses, addExpense, deleteExpense, getToday, formatCurrency, formatDate } from '../utils/storage';

const CATEGORIES = ['rent', 'salary', 'utilities', 'purchase', 'other'];
const CATEGORY_LABELS = {
  rent: 'Rent',
  salary: 'Salary',
  utilities: 'Utilities',
  purchase: 'Purchase',
  other: 'Other',
};

const st = {
  card: { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', overflow: 'hidden' },
  cardBody: { padding: 24 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10, background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid #475569', borderRadius: 10, background: '#0f172a', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  btnDanger: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  btnGhost: { background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', background: '#0f172a', borderBottom: '2px solid #334155' },
  thRight: { textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', background: '#0f172a', borderBottom: '2px solid #334155' },
  td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0' },
  tdRight: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid #1e293b', color: '#e2e8f0', textAlign: 'right' },
  headerBar: { padding: '14px 20px', borderBottom: '1px solid #334155' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: '#0f172a', color: '#94a3b8', border: '1px solid #334155' },
};

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(getToday());
  const [category, setCategory] = useState('purchase');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = subscribeExpenses(setExpenses);
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!amount || Number(amount) <= 0) return;
    await addExpense({ date, category, description, amount: Number(amount) });
    setDescription('');
    setAmount('');
    setSuccessMsg('Expense added!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
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
        <div style={{ background: '#312e81', border: '1px solid #6366f1', color: '#a5b4fc', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>{successMsg}</div>
      )}

      {/* Add Expense Form */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={st.cardBody}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Add New Expense</h3>
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
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Total: </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#f87171' }}>{formatCurrency(totalFiltered)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
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
                <tr><td colSpan="5" style={{ ...st.td, textAlign: 'center', padding: 32, color: '#64748b' }}>No expenses recorded yet.</td></tr>
              ) : (
                [...filtered].reverse().map((exp, idx) => (
                  <tr key={exp.id} style={{ background: idx % 2 === 0 ? '#1e293b' : '#172033' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#1e293b' : '#172033'}
                  >
                    <td style={st.td}>{formatDate(exp.date)}</td>
                    <td style={st.td}>
                      <span style={st.badge}>{CATEGORY_LABELS[exp.category] || exp.category}</span>
                    </td>
                    <td style={st.td}>{exp.description || '-'}</td>
                    <td style={{ ...st.tdRight, fontWeight: 700, color: '#f87171' }}>{formatCurrency(exp.amount)}</td>
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
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>Monthly Summary</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Month</th>
                {CATEGORIES.map((cat) => <th key={cat} style={st.thRight}>{CATEGORY_LABELS[cat]}</th>)}
                <th style={st.thRight}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(monthlySummary).sort().reverse().map((month, idx) => (
                <tr key={month} style={{ background: idx % 2 === 0 ? '#1e293b' : '#172033' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#1e293b' : '#172033'}
                >
                  <td style={{ ...st.td, fontWeight: 600 }}>{new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</td>
                  {CATEGORIES.map((cat) => (
                    <td key={cat} style={{ ...st.tdRight, color: monthlySummary[month].byCategory[cat] ? '#94a3b8' : '#334155' }}>
                      {monthlySummary[month].byCategory[cat] ? formatCurrency(monthlySummary[month].byCategory[cat]) : '-'}
                    </td>
                  ))}
                  <td style={{ ...st.tdRight, fontWeight: 700, color: '#f87171' }}>{formatCurrency(monthlySummary[month].total)}</td>
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
