import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  getRedirectResult,
} from 'firebase/auth';
import { useToast } from './ToastContext';
import { auth } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { success, error: toastError } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: if onAuthStateChanged never fires, stop showing the spinner.
    const timeout = setTimeout(() => setLoading(false), 3000);

    // Handle the result of a Google sign-in redirect. If the user just came
    // back from Google's auth page, this returns the credential (or an error).
    // CRITICAL: must be called on every app load — Firebase doesn't push this
    // result through onAuthStateChanged.
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          success(`Signed in as ${result.user.displayName || result.user.email} ✅`);
        }
      })
      .catch((err) => {
        console.error('getRedirectResult error:', err);
        const msg = friendlyAuthError(err);
        toastError(msg);
      });

    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      setCurrentUser(user);
      setLoading(false);
    }, (err) => {
      clearTimeout(timeout);
      console.error('onAuthStateChanged error:', err);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [success, toastError]);

  const signup = useCallback(async (email, password, displayName) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
      success('Account created — welcome to Dukan 🎉');
      return cred.user;
    } catch (e) {
      console.error('signup error:', e);
      const msg = friendlyAuthError(e);
      toastError(msg);
      throw e;
    }
  }, [success, toastError]);

  const login = useCallback(async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      success(`Welcome back, ${cred.user.displayName || cred.user.email} 👋`);
      return cred.user;
    } catch (e) {
      console.error('login error:', e);
      const msg = friendlyAuthError(e);
      toastError(msg);
      throw e;
    }
  }, [success, toastError]);

  const loginWithGoogle = useCallback(async () => {
    try {
      // signInWithRedirect (not signInWithPopup) is the correct call on
      // mobile browsers — popups get silently blocked on Android Chrome.
      // The page navigates to Google, then back to /, where getRedirectResult
      // (in the useEffect above) picks up the credential.
      const provider = new GoogleAuthProvider();
      // Set custom parameters to always show account chooser, even if the
      // user has a default Google account on the device.
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (e) {
      console.error('Google sign-in error:', e);
      const msg = friendlyAuthError(e);
      toastError(msg);
      throw e;
    }
  }, [toastError]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      success('Signed out');
    } catch (e) {
      console.error('logout error:', e);
      toastError('Failed to sign out');
    }
  }, [success, toastError]);

  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      success('Password reset email sent — check your inbox');
    } catch (e) {
      console.error('resetPassword error:', e);
      const msg = friendlyAuthError(e);
      toastError(msg);
      throw e;
    }
  }, [success, toastError]);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Map Firebase auth error codes to human messages.
function friendlyAuthError(e) {
  const code = e?.code || '';
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with that email already exists.';
    case 'auth/invalid-email': return 'That email address is invalid.';
    case 'auth/operation-not-allowed': return 'Sign-in method is disabled. Enable it in Firebase Console.';
    case 'auth/weak-password': return 'Password is too weak — use at least 6 characters.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/user-not-found': return 'No account with that email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    case 'auth/popup-closed-by-user': return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked': return 'Popup was blocked by the browser.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return e?.message || 'Authentication failed.';
  }
}
