"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SyncStatusCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
function SyncStatusCard() {
    const [statusInfo, setStatusInfo] = (0, react_1.useState)({
        status: 'Success',
        pending: 0,
        last_sync_time: '',
        last_successful_sync: '',
        error_message: '',
        next_sync_time: ''
    });
    const [syncing, setSyncing] = (0, react_1.useState)(false);
    const fetchSyncStatus = async () => {
        if (typeof window === 'undefined' || !window.pharmaAPI)
            return;
        try {
            const res = await window.pharmaAPI.sync.getStatus();
            if (res) {
                setStatusInfo(res);
            }
        }
        catch (err) {
            console.error('Failed to load sync status', err);
        }
    };
    (0, react_1.useEffect)(() => {
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
        if (syncing || typeof window === 'undefined' || !window.pharmaAPI)
            return;
        setSyncing(true);
        // Instantly set state to Syncing... for immediate feedback
        setStatusInfo(prev => ({ ...prev, status: 'Syncing...' }));
        try {
            await window.pharmaAPI.sync.push();
        }
        catch (err) {
            console.error('Manual sync push failed', err);
        }
        finally {
            await fetchSyncStatus();
            setSyncing(false);
        }
    };
    // Card styles depending on state
    const isSyncing = statusInfo.status === 'Syncing...' || syncing;
    const isFailed = statusInfo.status === 'Failed';
    const isSuccess = statusInfo.status === 'Success';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-xl border transition-all duration-300 ${isFailed
            ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
            : isSyncing
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [isFailed ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CloudOff, { className: "h-5 w-5 text-red-500 animate-bounce" })) : isSyncing ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CloudLightning, { className: "h-5 w-5 text-amber-500 animate-pulse" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Cloud, { className: "h-5 w-5 text-emerald-500" })), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold text-sm tracking-wide uppercase", children: "Cloud Sync" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1.5", children: [(0, jsx_runtime_1.jsx)("span", { className: `h-2.5 w-2.5 rounded-full ${isFailed ? 'bg-red-500 animate-ping' : isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}` }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium", children: isFailed ? 'Failed' : isSyncing ? 'Syncing...' : 'Synced' })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5 text-xs", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "opacity-75", children: "Pending changes:" }), (0, jsx_runtime_1.jsx)("span", { className: `font-semibold ${statusInfo.pending > 0 ? 'text-amber-600 font-bold' : ''}`, children: statusInfo.pending })] }), isFailed ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-red-700", children: [(0, jsx_runtime_1.jsx)("span", { className: "opacity-75", children: "Last Success:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: statusInfo.last_successful_sync || 'Never' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 p-2 bg-red-100/50 rounded text-[11px] font-mono break-all flex items-start gap-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" }), (0, jsx_runtime_1.jsx)("span", { children: statusInfo.error_message || 'Connection timeout' })] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between", children: [(0, jsx_runtime_1.jsx)("span", { className: "opacity-75", children: "Last backup:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: statusInfo.last_sync_time || 'Just now' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-[11px] opacity-70", children: [(0, jsx_runtime_1.jsx)("span", { children: "Next check:" }), (0, jsx_runtime_1.jsx)("span", { children: isSyncing ? 'In progress...' : statusInfo.next_sync_time || 'Calculating...' })] })] }))] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSyncNow, disabled: isSyncing, className: `w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${isFailed
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                    : isSyncing
                        ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}` }), isSyncing ? 'Syncing...' : 'Sync Now'] })] }));
}
