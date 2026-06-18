import { useState, useEffect } from 'react';

// Captures the browser's `beforeinstallprompt` event so the app can show its
// own "Install" button. The browser fires this event only when ALL PWA
// install criteria are met (HTTPS, manifest with required fields, registered
// service worker with a fetch handler, user engagement, etc.).
//
// Returns:
//   canInstall     - true when the browser has an install prompt ready
//   isInstalled    - true when running as an installed PWA (display-mode: standalone
//                    or iOS navigator.standalone)
//   promptInstall  - async () => { outcome: 'accepted' | 'dismissed', platform }
//                    After calling, canInstall returns to false (the prompt
//                    can only be used once).
export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
    const iosStandalone = window.navigator?.standalone === true;
    return !!(standalone || iosStandalone);
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      // Prevent the browser's default mini-infobar so we can show our own button.
      e.preventDefault();
      setInstallEvent(e);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return null;
    installEvent.prompt();
    // userChoice is a Promise that resolves to { outcome, platform }.
    let choice = null;
    try {
      choice = await installEvent.userChoice;
    } catch (e) {
      // Some browsers (older Safari, in-app browsers) may not implement
      // userChoice. Treat as a dismiss.
      console.warn('userChoice error', e);
    }
    // The prompt can only be used once; clear it regardless of outcome.
    setInstallEvent(null);
    return choice;
  };

  return {
    canInstall: !!installEvent,
    isInstalled,
    promptInstall,
  };
}
