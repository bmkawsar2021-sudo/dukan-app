import React from 'react';

export default function Dues() {
  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Due Tracker</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Track pending payments and dues</p>
      </div>
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>💸</p>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Due Tracker</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Coming soon — Track customer dues, overdue alerts, and payment history.</p>
      </div>
    </div>
  );
}
