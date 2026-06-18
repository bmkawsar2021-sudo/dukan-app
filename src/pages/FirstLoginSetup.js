import React, { useState, useEffect } from 'react';
import { hasLegacyDataBeenClaimed, hasUnownedData, claimLegacyData } from '../utils/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../context/ToastContext';

// Runs once on every login. If this looks like the first time ANY user is
// signing in AND there are docs without an owner, prompt the user to claim
// them. Otherwise, just show the children immediately.
export default function FirstLoginSetup({ uid, email, children }) {
  const { success, error } = useToast();
  const [checking, setChecking] = useState(true);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!uid) { setChecking(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const alreadyClaimed = await hasLegacyDataBeenClaimed();
        if (alreadyClaimed) {
          if (!cancelled) { setNeedsClaim(false); setChecking(false); }
          return;
        }
        const unowned = await hasUnownedData();
        if (!cancelled) { setNeedsClaim(unowned); setChecking(false); }
      } catch (e) {
        console.error('FirstLoginSetup check error:', e);
        if (!cancelled) { setNeedsClaim(false); setChecking(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const n = await claimLegacyData(uid);
      success(`Claimed ${n} document${n === 1 ? '' : 's'} as ${email || 'your account'} ✅`);
      setNeedsClaim(false);
    } catch (e) {
      console.error('claim error:', e);
      error('Failed to claim data — try again or contact support.');
    }
    setClaiming(false);
  };

  const handleSkip = async () => {
    setClaiming(true);
    try {
      await setDoc(doc(db, 'app', 'meta'), {
        firstUserClaimed: true,
        firstUserClaimedBy: uid,
        firstUserClaimedAt: serverTimestamp(),
        legacySkipped: true,
      }, { merge: true });
      success('Starting fresh. Old data has been left untouched.');
      setNeedsClaim(false);
    } catch (e) {
      console.error('skip error:', e);
      error('Could not record choice — try again.');
    }
    setClaiming(false);
  };

  return (
    <>
      {children}
      {needsClaim && !checking && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={iconBubbleStyle}>!</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
                Claim existing data?
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
              We found existing data in the database (sales, expenses, customers, etc.) with
              no owner. This likely means the app was used before accounts were introduced.
              <br /><br />
              You can <strong style={{ color: 'var(--text)' }}>claim it</strong> as{' '}
              <strong style={{ color: 'var(--primary)' }}>{email || 'your account'}</strong>, or
              <strong style={{ color: 'var(--text)' }}> start fresh</strong> (the old data stays in the
              database but no one will see it).
              <br /><br />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                This prompt only appears once.
              </span>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleClaim}
                disabled={claiming}
                style={{ ...btnPrimary, flex: 1, opacity: claiming ? 0.7 : 1 }}
              >
                {claiming ? <span className="spinner" style={{ borderTopColor: 'white' }} /> : 'Claim existing data'}
              </button>
              <button
                onClick={handleSkip}
                disabled={claiming}
                style={{ ...btnGhost, flex: 1 }}
              >
                Start fresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(15, 23, 42, 0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
};

const modalStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  padding: 28,
  maxWidth: 480, width: '100%',
  boxShadow: 'var(--shadow-lg)',
};

const iconBubbleStyle = {
  width: 36, height: 36, borderRadius: 10,
  background: 'var(--saffron-soft)', color: 'var(--saffron)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 18,
};

const btnPrimary = {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: 'white', border: 'none', borderRadius: 12,
  padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
};

const btnGhost = {
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', borderRadius: 12,
  padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
  fontFamily: 'var(--font-body)',
};
