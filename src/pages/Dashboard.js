import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeInvoices, subscribeExpenses, getToday, formatCurrency, formatDate } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import {
  Banknote,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  ArrowRight,
  CalendarHeart,
} from '../components/icons';

const cardSpec = [
  { accent: 'saffron', label: 'Total Sales',    Icon: Banknote,   sub: 'Today' },
  { accent: 'crimson', label: 'Total Expenses', Icon: Receipt,    sub: 'Today' },
  { accent: 'teal',    label: 'Net Profit',     Icon: TrendingUp, sub: 'Today' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ totalSales: 0, totalExpenses: 0, netProfit: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubInvoices = subscribeInvoices(currentUser.uid, setAllInvoices);
    const unsubExpenses = subscribeExpenses(currentUser.uid, setAllExpenses);
    return () => { unsubInvoices(); unsubExpenses(); };
  }, [currentUser]);

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
      {/* Hero Header */}
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Today's overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {cardSpec.map((card, idx) => {
          const Icon = card.Icon;
          const value = statValues[idx];
          const isProfit = card.accent === 'teal';
          const TrendIcon = isProfit
            ? (value >= 0 ? TrendingUp : TrendingDown)
            : null;
          return (
            <div
              key={card.label}
              className="stat-card animate-lift-in"
              data-accent={card.accent}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="stat-card-icon">
                <Icon size={22} />
              </div>
              <p className="stat-card-label">{card.label}</p>
              <p className="stat-card-amount">{formatCurrency(value)}</p>
              <p className="stat-card-sub">
                {isProfit && TrendIcon ? (
                  <>
                    <TrendIcon size={12} />
                    <span>{value >= 0 ? 'In the green' : 'In the red'}</span>
                  </>
                ) : (
                  <span>{card.sub}</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      {/* Activity section: header + recent transactions */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Activity</h2>
          <p className="section-subtitle">Click an invoice to view in Sales Ledger</p>
        </div>
        <button
          className="btn-link"
          onClick={() => navigate('/expenses')}
        >
          <CalendarHeart size={14} />
          Monthly Report
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {recentTransactions.length === 0 ? (
          <div className="tx-empty">
            <div className="tx-empty-icon">
              <FileText size={28} />
            </div>
            <p className="tx-empty-title">No transactions yet</p>
            <p className="tx-empty-sub">Create an invoice from Cash Memo to get started</p>
          </div>
        ) : (
          recentTransactions.map((tx, idx) => {
            const isSale = tx.type === 'sale';
            const TxIcon = isSale ? ArrowUpRight : ArrowDownRight;
            return (
              <div
                key={idx}
                className="tx-row"
                onClick={() => { if (tx.invoiceNumber) navigate('/sales-ledger', { state: { highlightInvoice: tx.invoiceNumber } }); }}
              >
                <div className="tx-row-left">
                  <div className="tx-avatar" data-type={tx.type}>
                    <TxIcon size={18} />
                  </div>
                  <div className="tx-meta">
                    <p className="tx-desc">{tx.description}</p>
                    <p className="tx-date">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <span className="tx-amount" data-type={tx.type}>
                  {tx.amount >= 0 ? '+' : '−'}{formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
