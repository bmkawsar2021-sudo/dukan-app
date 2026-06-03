import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning }}>
      {children}
      {/* Toast container */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              color: 'white',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              animation: 'slideRight 0.3s ease-out',
              background: toast.type === 'success' ? '#10b981'
                : toast.type === 'error' ? '#ef4444'
                : '#f59e0b',
              minWidth: 250,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '⚠'}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
