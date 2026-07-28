import React, { useState, useEffect } from 'react';
import { Cloud, CloudLightning, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SyncStatusCard() {
  const [statusInfo, setStatusInfo] = useState({
    status: 'Success',
    pending: 0,
    last_sync_time: '',
    last_successful_sync: '',
    error_message: '',
    next_sync_time: '',
  });
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState(null); // { type: 'success'|'partial'|'failed', msg }

  const fetchSyncStatus = async () => {
    if (typeof window === 'undefined' || !window.pharmaAPI) return;
    try {
      const res = await window.pharmaAPI.sync.getStatus();
      if (res) setStatusInfo(res);
    } catch (err) {
      console.error('Failed to load sync status', err);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 5000);
    if (window.pharmaAPI && window.pharmaAPI.sync.onSyncComplete) {
      window.pharmaAPI.sync.onSyncComplete(() => fetchSyncStatus());
    }
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    if (syncing || typeof window === 'undefined' || !window.pharmaAPI) return;
    setSyncing(true);
    setFlash(null);
    setStatusInfo(prev => ({ ...prev, status: 'Syncing...' }));
    try {
      const res = await window.pharmaAPI.sync.push();
      if (res && res.ok) {
        if ((res.failed || 0) > 0) setFlash({ type: 'partial', msg: `Partial — ${res.failed} failed` });
        else if ((res.success || 0) > 0) setFlash({ type: 'success', msg: `Synced — ${res.success} uploaded` });
        else setFlash({ type: 'success', msg: 'Up to date' });
      } else {
        setFlash({ type: 'failed', msg: 'Sync failed' });
      }
    } catch (err) {
      console.error('Manual sync push failed', err);
      setFlash({ type: 'failed', msg: 'Sync failed' });
    } finally {
      await fetchSyncStatus();
      setSyncing(false);
      setTimeout(() => setFlash(null), 3500);
    }
  };

  const isSyncing = statusInfo.status === 'Syncing...' || syncing;
  const isFailed = statusInfo.status === 'Failed';
  const isPartial = statusInfo.status === 'Partial';

  // Theme per state
  const theme = isFailed
    ? { accent: '#DC2626', bg: '#FEF2F2', border: '#FECACA', text: '#7F1D1D', dot: '#EF4444' }
    : isPartial
    ? { accent: '#B45309', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' }
    : isSyncing
    ? { accent: '#B45309', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' }
    : { accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#2563EB' };

  const statusLabel = isFailed ? 'Failed' : isPartial ? 'Partial' : isSyncing ? 'Syncing…' : 'Synced';

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', marginTop: 4 };
  const muted = { color: theme.text, opacity: 0.75 };

  return (
    <div style={{
      padding: '0.75rem',
      borderRadius: 12,
      border: `1px solid ${theme.border}`,
      background: theme.bg,
      color: theme.text,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isFailed ? <CloudOff size={16} color={theme.accent} />
            : isSyncing ? <CloudLightning size={16} color={theme.accent} />
            : <Cloud size={16} color={theme.accent} />}
          <span style={{ fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Cloud Sync
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.dot, display: 'inline-block' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{statusLabel}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 6 }}>
        <div style={row}>
          <span style={muted}>Pending changes:</span>
          <span style={{ fontWeight: 700, color: statusInfo.pending > 0 ? '#B45309' : theme.text }}>
            {statusInfo.pending ?? 0}
          </span>
        </div>

        {isFailed ? (
          <>
            <div style={row}>
              <span style={muted}>Last success:</span>
              <span style={{ fontWeight: 600 }}>{statusInfo.last_successful_sync || 'Never'}</span>
            </div>
            {statusInfo.error_message && (
              <div style={{
                marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#FEE2E2',
                fontSize: '0.68rem', display: 'flex', alignItems: 'flex-start', gap: 5, wordBreak: 'break-word',
              }}>
                <AlertCircle size={13} color={theme.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{statusInfo.error_message}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={row}>
              <span style={muted}>Last backup:</span>
              <span style={{ fontWeight: 600 }}>{statusInfo.last_sync_time || (statusInfo.pending > 0 ? '—' : 'Just now')}</span>
            </div>
            <div style={{ ...row, opacity: 0.7 }}>
              <span>Next check:</span>
              <span>{isSyncing ? 'In progress…' : (statusInfo.next_sync_time || '—')}</span>
            </div>
          </>
        )}
      </div>

      {/* Transient confirmation after a manual sync */}
      {flash && (
        <div style={{
          marginTop: 10, padding: '6px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          background: flash.type === 'success' ? '#DBEAFE' : flash.type === 'partial' ? '#FEF3C7' : '#FEE2E2',
          color: flash.type === 'success' ? '#1E40AF' : flash.type === 'partial' ? '#92400E' : '#991B1B',
        }}>
          {flash.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {flash.type === 'success' ? `✓ ${flash.msg}` : flash.msg}
        </div>
      )}

      {/* Sync Now button */}
      <button
        onClick={handleSyncNow}
        disabled={isSyncing}
        style={{
          width: '100%', marginTop: 10, padding: '7px 12px', borderRadius: 8, border: 'none',
          fontSize: '0.72rem', fontWeight: 700, cursor: isSyncing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: isFailed ? '#DC2626' : isSyncing ? '#FDE68A' : theme.accent,
          color: isSyncing ? '#92400E' : '#fff',
        }}
      >
        <RefreshCw size={13} style={isSyncing ? { animation: 'spin 1s linear infinite' } : undefined} />
        {isSyncing ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  );
}
