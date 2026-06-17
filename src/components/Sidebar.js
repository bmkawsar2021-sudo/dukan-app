import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  Wallet,
  Package,
  Users,
  HandCoins,
  CalendarHeart,
  Settings,
  Sun,
  Moon,
} from './icons';

const navItems = [
  { path: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { path: '/cash-memo', label: 'Cash Memo', Icon: Receipt },
  { path: '/sales-ledger', label: 'Sales Ledger', Icon: BookOpen },
  { path: '/expenses', label: 'Expenses', Icon: Wallet },
  { path: '/stock', label: 'Stock', Icon: Package },
  { path: '/customers', label: 'Customers', Icon: Users },
  { path: '/dues', label: 'Due Tracker', Icon: HandCoins },
  { path: '/events', label: 'Events', Icon: CalendarHeart },
  { path: '/settings', label: 'Settings', Icon: Settings },
];

export default function Sidebar({ isOpen, onClose, dark, toggleDark }) {
  const { shops, currentShop, switchShop } = useShop();
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const sidebarBg = dark
    ? 'linear-gradient(180deg, #0A1023 0%, #131A33 100%)'
    : 'linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)';

  const DarkToggleIcon = dark ? Sun : Moon;

  return (
    <>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }} onClick={onClose} />
      )}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, height: '100%', width: 260,
          background: sidebarBg, color: 'white', zIndex: 30,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          boxShadow: '4px 0 20px rgba(0,0,0,0.10)',
        }}
        className="sidebar-desktop"
      >
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div
              style={{
                fontFamily: "'Bricolage Grotesque', 'Inter', sans-serif",
                fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
              }}
            >
              Dukan
            </div>
            <button
              onClick={toggleDark}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'rgba(255,255,255,0.10)', border: 'none', borderRadius: 10,
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.20)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            >
              <DarkToggleIcon size={18} />
            </button>
          </div>

          {/* Shop name */}
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 12, marginTop: 2 }}>Shop Management</div>

          {/* Shop switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShopDropdown(!showShopDropdown)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentShop?.name || 'Select Shop'}
              </span>
              <span style={{ fontSize: 10, marginLeft: 8 }}>▼</span>
            </button>
            {showShopDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--card)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                overflow: 'hidden', zIndex: 40,
              }}>
                {shops.map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => { switchShop(shop.id); setShowShopDropdown(false); }}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none', cursor: 'pointer',
                      background: shop.id === currentShop?.id ? 'rgba(99,102,241,0.10)' : 'transparent',
                      color: shop.id === currentShop?.id ? '#6366f1' : 'var(--text)',
                      fontSize: 13, fontWeight: shop.id === currentShop?.id ? 700 : 400,
                      textAlign: 'left', display: 'block',
                    }}
                  >
                    {shop.name}
                  </button>
                ))}
                <NavLink
                  to="/settings"
                  onClick={() => setShowShopDropdown(false)}
                  style={{
                    display: 'block', width: '100%', padding: '10px 12px', border: 'none',
                    cursor: 'pointer', background: 'rgba(99,102,241,0.05)',
                    color: '#6366f1', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', borderTop: '1px solid var(--border)',
                  }}
                >
                  + New Shop
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 10px' }}>
          {navItems.map(({ path, label, Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 14px', borderRadius: 12, textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.70)',
                background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                fontSize: 14, fontWeight: isActive ? 600 : 500, marginBottom: 4,
                transition: 'all 0.2s', cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.30)' : 'none',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.10)', fontSize: 11, opacity: 0.4, textAlign: 'center' }}>
          Dukan v2.0
        </div>
      </aside>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-desktop { transform: translateX(0) !important; }
        }
      `}</style>
    </>
  );
}
