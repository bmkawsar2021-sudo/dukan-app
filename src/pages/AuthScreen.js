import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, Sun, Moon } from '../components/icons';
import useDarkMode from '../hooks/useDarkMode';

export default function AuthScreen() {
  const { signup, login, loginWithGoogle, resetPassword } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch {
      /* error already toasted by AuthContext */
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try { await loginWithGoogle(); } catch { /* toasted */ }
    setGoogleBusy(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try { await resetPassword(email.trim()); setForgotMode(false); }
    catch { /* toasted */ }
  };

  const DarkIcon = dark ? Sun : Moon;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: 'var(--bg)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Dark mode toggle — top right corner */}
      <button
        onClick={toggle}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'fixed', top: 16, right: 16,
          background: 'var(--card)', border: '1px solid var(--border)',
          color: 'var(--text)', width: 40, height: 40, borderRadius: 10,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <DarkIcon size={18} />
      </button>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg)',
        width: '100%', maxWidth: 440,
        padding: 32,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <Receipt size={28} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
            margin: 0, color: 'var(--ink)', letterSpacing: '-0.025em',
          }}>
            Dukan
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '4px 0 0' }}>
            {forgotMode
              ? 'Reset your password'
              : isSignup ? 'Create your account' : 'Sign in to your shop'}
          </p>
        </div>

        {/* Forgot password mode */}
        {forgotMode ? (
          <form onSubmit={handleReset}>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <button type="submit" style={{ ...btnPrimary, marginTop: 16 }}>
              Send reset link
            </button>
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              style={{ ...btnGhost, marginTop: 12, width: '100%' }}
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <>
            {/* Sign in / Sign up tab toggle */}
            <div style={{
              display: 'flex', gap: 4, padding: 4, marginBottom: 20,
              background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)',
            }}>
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{
                  flex: 1, padding: '10px 12px', border: 'none', borderRadius: 10,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  background: !isSignup ? 'var(--card)' : 'transparent',
                  color: !isSignup ? 'var(--text)' : 'var(--text-secondary)',
                  boxShadow: !isSignup ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  flex: 1, padding: '10px 12px', border: 'none', borderRadius: 10,
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  background: isSignup ? 'var(--card)' : 'transparent',
                  color: isSignup ? 'var(--text)' : 'var(--text-secondary)',
                  boxShadow: isSignup ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <>
                  <label style={labelStyle}>Display name</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name (shown on the sidebar)"
                    autoComplete="name"
                  />
                </>
              )}

              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus={!isSignup}
              />

              <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />

              {!isSignup && (
                <div style={{ textAlign: 'right', marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ ...btnPrimary, marginTop: 20, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting
                  ? <span className="spinner" style={{ borderTopColor: 'white' }} />
                  : (isSignup ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
              color: 'var(--text-secondary)', fontSize: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              OR
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleBusy}
              style={{
                width: '100%', padding: '12px 16px',
                background: 'var(--card)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: 12,
                fontWeight: 600, fontSize: 14, cursor: googleBusy ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: 'var(--shadow-sm)',
                opacity: googleBusy ? 0.7 : 1,
              }}
            >
              <GoogleGIcon />
              {googleBusy ? 'Opening…' : 'Continue with Google'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, marginTop: 18 }}>
              {isSignup ? 'Already have an account? ' : 'New to Dukan? '}
              <button
                type="button"
                onClick={() => setMode(isSignup ? 'signin' : 'signup')}
                style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0,
                }}
              >
                {isSignup ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6, marginTop: 14,
};
const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid var(--border)', borderRadius: 12,
  background: 'var(--input-bg)', color: 'var(--text)',
  // fontSize MUST be >= 16px on mobile or Chrome will auto-zoom on focus.
  fontSize: 16, fontFamily: 'var(--font-body)', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};
const btnPrimary = {
  width: '100%', padding: '12px 20px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: 'white', border: 'none', borderRadius: 12,
  fontWeight: 700, fontSize: 14, cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};
const btnGhost = {
  width: '100%', padding: '10px 20px',
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', borderRadius: 12,
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
  fontFamily: 'var(--font-body)',
};

// Inline Google "G" logo as SVG (no external CDN dependency)
function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
