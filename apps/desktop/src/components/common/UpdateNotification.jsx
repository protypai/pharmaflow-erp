import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

// Non-intrusive auto-update prompt. Shows "downloading" while an update is being
// fetched, then a persistent "Restart to update" banner once it's ready — so users
// never have to manually run an installer while the app is still open (which is
// what causes the "please close the app and retry" file-lock message).
export default function UpdateNotification() {
  const [phase, setPhase] = useState(null); // 'available' | 'ready'
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.pharmaAPI?.update) return;
    const u = window.pharmaAPI.update;
    u.onAvailable && u.onAvailable(() => { setPhase('available'); setDismissed(false); });
    u.onDownloaded && u.onDownloaded(() => { setPhase('ready'); setDismissed(false); });
    // Nudge a check (the main process also checks on startup).
    u.check && u.check().catch(() => {});
  }, []);

  if (!phase || dismissed) return null;
  const ready = phase === 'ready';

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      width: 320, padding: '0.9rem 1rem', borderRadius: 12,
      background: '#fff', border: '1px solid #BFDBFE',
      boxShadow: '0 10px 30px rgba(37,99,235,0.18)',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: '#EFF6FF', color: '#2563EB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ready ? <RefreshCw size={17} /> : <Download size={17} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E3A8A' }}>
          {ready ? 'Update ready' : 'Downloading update…'}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 2 }}>
          {ready
            ? 'A new version has been downloaded. Restart to apply it.'
            : 'A new version is downloading in the background.'}
        </div>
        {ready && (
          <button
            onClick={() => window.pharmaAPI.update.quitAndInstall()}
            style={{
              marginTop: 8, padding: '6px 12px', borderRadius: 8, border: 'none',
              background: '#2563EB', color: '#fff', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw size={13} /> Restart &amp; Update
          </button>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        title="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, lineHeight: 0 }}
      >
        <X size={15} />
      </button>
    </div>
  );
}
