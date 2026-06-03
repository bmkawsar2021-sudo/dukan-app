import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '🏠' },
  { path: '/cash-memo', label: 'Cash Memo', icon: '🧾' },
  { path: '/sales-ledger', label: 'Sales Ledger', icon: '📋' },
  { path: '/expenses', label: 'Expenses', icon: '💰' },
  { path: '/stock', label: 'Stock', icon: '📦' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/dues', label: 'Due Tracker', icon: '💸' },
  { path: '/events', label: 'Events', icon: '🎉' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ isOpen, onClose, dark, toggleDark }) {
  const { shops, currentShop, switchShop } = useShop();
  const [showShopDropdown, setShowShopDropdown] = useState(false);

  const sidebarBg = dark
    ? 'linear-gradient(180deg, #0f172a, #1e293b)'
    : 'linear-gradient(180deg, #1e1b4b, #312e81)';

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
          boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
        }}
        className="sidebar-desktop"
      >
        {/* Header */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Dukan</div>
            <button
              onClick={toggleDark}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10,
                width: 38, height: 38, cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              {dark ? '☀️' : '🌙'}
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
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
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
                      background: shop.id === currentShop?.id ? 'rgba(99,102,241,0.1)' : 'transparent',
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
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                fontSize: 14, fontWeight: isActive ? 600 : 400, marginBottom: 4,
                transition: 'all 0.2s', cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('gradient')) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, opacity: 0.4, textAlign: 'center' }}>
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
