'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          onDismiss();
        }, 200);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`px-4 py-2.5 rounded-xl bg-card border border-border shadow-2xl text-sm text-text-primary ${
          exiting ? 'animate-toast-out' : 'animate-toast-in'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
