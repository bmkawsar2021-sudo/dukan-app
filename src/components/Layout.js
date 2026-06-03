import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children, dark, toggleDark }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        dark={dark}
        toggleDark={toggleDark}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Mobile Header */}
        <header
          className="no-print"
          style={{
            display: 'none',
            padding: '12px 16px',
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 24,
              color: 'var(--text)',
              padding: 4,
            }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>🏪 Dukan</span>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          header { display: flex !important; }
          main { padding: 16px !important; }
        }
        @media (min-width: 1024px) {
          main { margin-left: 256px !important; max-width: none; }
        }
      `}</style>
    </div>
  );
}
