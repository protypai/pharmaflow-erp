import React, { useState, useEffect } from 'react';
import { Cloud, CloudLightning, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SyncStatusCard() {
  const [statusInfo, setStatusInfo] = useState({
    status: 'Success',
    pending: 0,
    last_sync_time: '',
    last_successful_sync: '',
    error_message: '',
    next_sync_time: ''
  });
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState(null); // { type: 'success'|'partial'|'failed', msg }

  const fetchSyncStatus = async () => {
    if (typeof window === 'undefined' || !window.pharmaAPI) return;
    try {
      const res = await window.pharmaAPI.sync.getStatus();
      if (res) {
        setStatusInfo(res);
      }
    } catch (err) {
      console.error('Failed to load sync status', err);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    // Poll sync status every 5 seconds for UI updates
    const interval = setInterval(fetchSyncStatus, 5000);
    
    // Listen for sync completion event
    if (window.pharmaAPI && window.pharmaAPI.sync.onSyncComplete) {
      window.pharmaAPI.sync.onSyncComplete(() => {
        fetchSyncStatus();
      });
    }

    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    if (syncing || typeof window === 'undefined' || !window.pharmaAPI) return;
    setSyncing(true);
    setFlash(null);
    // Instantly set state to Syncing... for immediate feedback
    setStatusInfo(prev => ({ ...prev, status: 'Syncing...' }));
    try {
      const res = await window.pharmaAPI.sync.push();
      if (res && res.ok) {
        if ((res.failed || 0) > 0) {
          setFlash({ type: 'partial', msg: `Partial — ${res.failed} failed` });
        } else if ((res.success || 0) > 0) {
          setFlash({ type: 'success', msg: `Synced — ${res.success} uploaded` });
        } else {
          setFlash({ type: 'success', msg: 'Up to date' });
        }
      } else {
        setFlash({ type: 'failed', msg: res && res.error ? 'Sync failed' : 'Sync failed' });
      }
    } catch (err) {
      console.error('Manual sync push failed', err);
      setFlash({ type: 'failed', msg: 'Sync failed' });
    } finally {
      await fetchSyncStatus();
      setSyncing(false);
      // Auto-clear the confirmation after a few seconds.
      setTimeout(() => setFlash(null), 3500);
    }
  };

  // Card styles depending on state
  const isSyncing = statusInfo.status === 'Syncing...' || syncing;
  const isFailed = statusInfo.status === 'Failed';
  const isSuccess = statusInfo.status === 'Success';

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${
      isFailed 
        ? 'bg-red-50 border-red-200 text-red-900 shadow-sm' 
        : isSyncing 
        ? 'bg-amber-50 border-amber-200 text-amber-900' 
        : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isFailed ? (
            <CloudOff className="h-5 w-5 text-red-500 animate-bounce" />
          ) : isSyncing ? (
            <CloudLightning className="h-5 w-5 text-amber-500 animate-pulse" />
          ) : (
            <Cloud className="h-5 w-5 text-emerald-500" />
          )}
          <span className="font-semibold text-sm tracking-wide uppercase">
            Cloud Sync
          </span>
        </div>
        
        {/* Status Dot Indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${
            isFailed ? 'bg-red-500 animate-ping' : isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
          }`} />
          <span className="text-xs font-medium">
            {isFailed ? 'Failed' : isSyncing ? 'Syncing...' : 'Synced'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="opacity-75">Pending changes:</span>
          <span className={`font-semibold ${statusInfo.pending > 0 ? 'text-amber-600 font-bold' : ''}`}>
            {statusInfo.pending}
          </span>
        </div>

        {isFailed ? (
          <>
            <div className="flex justify-between text-red-700">
              <span className="opacity-75">Last Success:</span>
              <span className="font-medium">{statusInfo.last_successful_sync || 'Never'}</span>
            </div>
            <div className="mt-2 p-2 bg-red-100/50 rounded text-[11px] font-mono break-all flex items-start gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
              <span>{statusInfo.error_message || 'Connection timeout'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="opacity-75">Last backup:</span>
              <span className="font-medium">{statusInfo.last_sync_time || 'Just now'}</span>
            </div>
            <div className="flex justify-between text-[11px] opacity-70">
              <span>Next check:</span>
              <span>{isSyncing ? 'In progress...' : statusInfo.next_sync_time || 'Calculating...'}</span>
            </div>
          </>
        )}
      </div>

      {/* Transient confirmation after a manual sync */}
      {flash && (
        <div
          className={`mt-3 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
            flash.type === 'success'
              ? 'bg-emerald-100 text-emerald-800'
              : flash.type === 'partial'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {flash.type === 'success'
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <AlertCircle className="h-3.5 w-3.5" />}
          {flash.type === 'success' ? `✓ ${flash.msg}` : flash.msg}
        </div>
      )}

      {/* Sync Button */}
      <button
        onClick={handleSyncNow}
        disabled={isSyncing}
        className={`w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
          isFailed 
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm' 
            : isSyncing 
            ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
            : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
        }`}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
