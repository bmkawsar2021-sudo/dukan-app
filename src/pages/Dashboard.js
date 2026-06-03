import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeInvoices, subscribeExpenses, getToday, formatCurrency, formatDate } from '../utils/storage';

const cardColors = [
  { bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)', icon: '💰', label: 'Total Sales' },
  { bg: 'linear-gradient(135deg, #ef4444, #f97316)', icon: '💸', label: 'Total Expenses' },
  { bg: 'linear-gradient(135deg, #10b981, #059669)', icon: '📈', label: 'Net Profit' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSales: 0, totalExpenses: 0, netProfit: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    const unsubInvoices = subscribeInvoices(setAllInvoices);
    const unsubExpenses = subscribeExpenses(setAllExpenses);
    return () => { unsubInvoices(); unsubExpenses(); };
  }, []);

  useEffect(() => {
    const today = getToday();
    const todayInvoices = allInvoices.filter(inv => inv.date === today);
    const todayExpenses = allExpenses.filter(exp => exp.date === today);
    const totalSales = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalExpenses = todayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    setStats({ totalSales, totalExpenses, netProfit: totalSales - totalExpenses });

    const recent = [
      ...allInvoices.slice(-10).map(inv => ({
        type: 'sale', date: inv.date,
        description: `Invoice ${inv.invoiceNumber} - ${inv.customerName || 'Walk-in'}`,
        amount: inv.grandTotal, invoiceNumber: inv.invoiceNumber,
      })),
      ...allExpenses.slice(-10).map(exp => ({
        type: 'expense', date: exp.date,
        description: `${exp.category}: ${exp.description || '-'}`,
        amount: -(exp.amount || 0), invoiceNumber: null,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    setRecentTransactions(recent);
  }, [allInvoices, allExpenses]);

  const statValues = [stats.totalSales, stats.totalExpenses, stats.netProfit];

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Today's Overview</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>
        {cardColors.map((card, idx) => (
          <div key={idx} style={{
            background: card.bg, color: 'white', borderRadius: 16, padding: '28px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>{card.icon}</div>
            <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, marginBottom: 8 }}>{card.label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>{formatCurrency(statValues[idx])}</p>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Today</p>
          </div>
        ))}
      </div>

      {/* Monthly Report Button */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate('/expenses')}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          📊 Monthly Report
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Recent Transactions</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Click an invoice to view in Sales Ledger</p>
        </div>
        <div>
          {recentTransactions.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 40, marginBottom: 8 }}>📋</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No transactions yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create an invoice from Cash Memo!</p>
            </div>
          ) : recentTransactions.map((tx, idx) => (
            <div
              key={idx}
              onClick={() => { if (tx.invoiceNumber) navigate('/sales-ledger', { state: { highlightInvoice: tx.invoiceNumber } }); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px',
                borderBottom: '1px solid var(--border)', cursor: tx.invoiceNumber ? 'pointer' : 'default',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => { if (tx.invoiceNumber) e.currentTarget.style.background = 'rgba(99,102,241,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  background: tx.type === 'sale' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: tx.type === 'sale' ? '#10b981' : '#ef4444',
                }}>
                  {tx.type === 'sale' ? 'S' : 'E'}
                </span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{tx.description}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(tx.date)}</p>
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
