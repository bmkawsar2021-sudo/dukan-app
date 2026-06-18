import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Download, X, CheckCircle2 } from './icons';

// Visible, explicit "Install App" button. Shows only when:
//   - the browser fired beforeinstallprompt (i.e. PWA is installable)
//   - the app is NOT already installed (display-mode !== standalone)
//   - the user hasn't dismissed it in this session
//
// When the user taps the install button, we call the stored event's
// prompt() method, which opens the native Android install dialog. The
// result is reported via the small "Installed!" confirmation, and the
// button is hidden after accept/dismiss (the prompt can only be used
// once).
export default function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  // Session-only persistence: hide if the user dismissed in this tab.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('installDismissed') === '1') setDismissed(true);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (dismissed) sessionStorage.setItem('installDismissed', '1');
    } catch {}
  }, [dismissed]);

  if (isInstalled || dismissed || !canInstall) return null;

  const handleInstall = async () => {
    if (busy) return;
    setBusy(true);
    const choice = await promptInstall();
    setBusy(false);
    if (choice && choice.outcome === 'accepted') {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 6000);
    }
  };

  if (justInstalled) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          ...bannerStyle,
          background: 'var(--teal-soft)',
          borderColor: 'var(--teal)',
          color: 'var(--teal)',
        }}
      >
        <CheckCircle2 size={18} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
          Dukan installed! You can find it on your home screen.
        </span>
      </div>
    );
  }

  return (
    <div style={bannerStyle} role="region" aria-label="Install Dukan">
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'var(--saffron-soft)', color: 'var(--saffron)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Download size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          Install Dukan
        </p>
        <p style={{
          fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0',
        }}>
          Add to your home screen for quick access — works offline.
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        disabled={busy}
        style={{
          background: 'var(--saffron)', color: 'white',
          border: 'none', borderRadius: 10,
          padding: '8px 14px', fontWeight: 700, fontSize: 13,
          fontFamily: 'var(--font-body)', cursor: busy ? 'wait' : 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(194, 65, 12, 0.25)',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px)'}
        onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        {busy ? 'Opening…' : 'Install'}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install banner"
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer', padding: 4,
          borderRadius: 6, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

const bannerStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', maxWidth: 440,
  background: 'var(--cream)',
  border: '1px solid var(--cream-border)',
  borderLeft: '3px solid var(--saffron)',
  borderRadius: 14,
  padding: '12px 14px',
  margin: '0 auto 16px',
  boxShadow: 'var(--shadow-sm)',
  boxSizing: 'border-box',
};
