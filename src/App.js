import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import AuthScreen from './pages/AuthScreen';
import FirstLoginSetup from './pages/FirstLoginSetup';
import { ShieldAlert, ArrowRight, Receipt } from './components/icons';
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
  const [daysSince, setDaysSince] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const last = localStorage.getItem('lastBackupDate');
    if (!last) {
      setShow(true);
      setDaysSince(null);
    } else {
      const d = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
      setDaysSince(Math.floor(d));
      if (d > 7) setShow(true);
    }
  }, []);

  if (!show) return null;

  const subText = daysSince === null
    ? 'You haven’t backed up your shop data yet'
    : `Your last backup was ${daysSince} day${daysSince === 1 ? '' : 's'} ago`;

  return (
    <div className="backup-banner">
      <div className="backup-banner-icon">
        <ShieldAlert size={18} />
      </div>
      <div className="backup-banner-body">
        <p className="backup-banner-title">Time to back up your data</p>
        <p className="backup-banner-sub">{subText}</p>
      </div>
      <button
        className="backup-banner-cta"
        onClick={() => navigate('/settings')}
      >
        Back up now
        <ArrowRight size={12} />
      </button>
      <button
        className="backup-banner-dismiss"
        onClick={() => setShow(false)}
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

// Pulled in below; declared here to avoid an extra import.
import { useNavigate } from 'react-router-dom';

function AppShell({ dark, toggle }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ShopProvider>
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
        </ShopProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AuthGate() {
  const { currentUser, loading } = useAuth();
  const { dark, toggle } = useDarkMode();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }}>
          <Receipt size={24} />
        </div>
        <div className="spinner" style={{ borderTopColor: 'var(--primary)' }} />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  // First-login claim flow: shown above the main app if there's un-owned data.
  return (
    <Router>
      <FirstLoginSetup uid={currentUser.uid} email={currentUser.email}>
        <AppShell dark={dark} toggle={toggle} />
      </FirstLoginSetup>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
