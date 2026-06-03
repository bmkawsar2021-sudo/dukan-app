import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ShopProvider } from './context/ShopContext';
import useDarkMode from './hooks/useDarkMode';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CashMemo from './pages/CashMemo';
import SalesLedger from './pages/SalesLedger';
import ExpenseTracker from './pages/ExpenseTracker';
import StockRegister from './pages/StockRegister';
import Customers from './pages/Customers';
import DueTracker from './pages/DueTracker';
import EventAccounts from './pages/EventAccounts';
import Settings from './pages/Settings';
import './styles/theme.css';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 20 }}>{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BackupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem('lastBackupDate');
    if (!last) {
      setShow(true);
    } else {
      const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e',
      padding: '10px 16px', borderRadius: 8, marginBottom: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, fontWeight: 600,
    }}>
      <span>Backup recommended! Go to Settings to download backup.</span>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontSize: 18 }}>✕</button>
    </div>
  );
}

function App() {
  const { dark, toggle } = useDarkMode();

  // Global crash handler - prevent blank screen
  useEffect(() => {
    const handler = (e) => {
      console.error('Uncaught error:', e.error || e.message);
      e.preventDefault();
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', handler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler);
    };
  }, []);

  return (
    <ErrorBoundary>
    <ToastProvider>
      <ShopProvider>
        <Router>
          <Layout dark={dark} toggleDark={toggle}>
            <BackupBanner />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cash-memo" element={<CashMemo />} />
              <Route path="/sales-ledger" element={<SalesLedger />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/stock" element={<StockRegister />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/dues" element={<DueTracker />} />
              <Route path="/events" element={<EventAccounts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ShopProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
