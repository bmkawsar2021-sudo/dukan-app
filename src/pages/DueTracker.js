import React, { useState, useEffect } from 'react';
import { subscribeDues, markDuePaid, formatCurrency, formatDate } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const getOverdueDays = (dateStr) => {
  if (!dateStr) return 0;
  const due = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const TABS = [
  { key: 'all', label: 'সব বাকি' },
  { key: 'overdue', label: 'অতিবাহিত (>7 দিন)' },
  { key: 'paid', label: 'পরিশোধিত' },
];

export default function DueTracker() {
  const { success, error } = useToast();
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    const unsub = subscribeDues((data) => {
      setDues(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const activeDues = dues.filter(d => d.status === 'due');
  const totalDue = activeDues.reduce((sum, d) => sum + (d.amount || 0), 0);

  const filtered = dues.filter(d => {
    if (tab === 'all') return d.status === 'due';
    if (tab === 'overdue') return d.status === 'due' && getOverdueDays(d.date) > 7;
    if (tab === 'paid') return d.status === 'paid';
    return true;
  });

  const handleMarkPaid = async (due) => {
    if (!window.confirm(`"${due.customerName}" এর বাকি পরিশোধ হিসেবে চিহ্নিত করবেন?`)) return;
    try {
      await markDuePaid(due.id);
      success('বাকি পরিশোধ হিসেবে চিহ্নিত হয়েছে ✅');
    } catch (e) {
      console.error('Mark paid error:', e);
      error('সমস্যা হয়েছে ❌');
    }
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #ef4444, #f97316, #f59e0b)', color: 'white', padding: '2rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>বাকি হিসাব / Due Tracker</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Track pending payments and dues</p>
      </div>

      {/* Summary card */}
      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>মোট বাকি / Total Due</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>{formatCurrency(totalDue)}</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>বাকি সংখ্যা / Pending Count</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)' }}>{activeDues.length}</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>অতিবাহিত / Overdue (&gt;7 days)</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b' }}>{dues.filter(d => d.status === 'due' && getOverdueDays(d.date) > 7).length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              background: tab === t.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--card)',
              color: tab === t.key ? 'white' : 'var(--text-secondary)',
              border: tab === t.key ? 'none' : '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: '#ef4444', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>লোড হচ্ছে...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>💸</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {tab === 'paid' ? 'কোনো পরিশোধিত বাকি নেই' : 'কোনো বাকি নেই!'}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {tab === 'paid' ? 'পরিশোধিত বাকি এখানে দেখাবে' : 'সব বাকি পরিশোধ হয়ে গেছে! 🎉'}
          </p>
        </div>
      )}

      {/* Dues list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(d => {
            const overdueDays = getOverdueDays(d.date);
            const isOverdue = overdueDays > 7 && d.status === 'due';
            const isWarning = overdueDays >= 1 && overdueDays <= 7 && d.status === 'due';

            return (
              <div
                key={d.id}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: `4px solid ${d.status === 'paid' ? '#10b981' : isOverdue ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--border)'}`,
                  background: isOverdue ? 'rgba(239,68,68,0.03)' : isWarning ? 'rgba(245,158,11,0.03)' : 'var(--card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{d.customerName}</p>
                      {d.status === 'paid' && <span className="badge badge-success">পরিশোধিত</span>}
                      {isOverdue && <span className="badge badge-danger">⚠️ অতিবাহিত</span>}
                      {isWarning && <span className="badge badge-warning">শীঘ্রই বাকি</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📞 {d.customerPhone || 'N/A'}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📋 Invoice: {d.invoiceNumber || 'N/A'} &middot; {formatDate(d.date)}</p>
                    {d.status === 'due' && (
                      <p style={{ fontSize: 12, color: isOverdue ? '#ef4444' : 'var(--text-secondary)', marginTop: 4 }}>
                        {overdueDays === 0 ? 'আজকে' : `${overdueDays} দিন আগে`}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 24, fontWeight: 800, color: d.status === 'paid' ? '#10b981' : '#ef4444' }}>{formatCurrency(d.amount)}</p>
                    {d.status === 'due' && (
                      <button
                        onClick={() => handleMarkPaid(d)}
                        className="btn btn-success"
                        style={{ marginTop: 8, fontSize: 13 }}
                      >
                        ✅ পরিশোধ করুন
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
