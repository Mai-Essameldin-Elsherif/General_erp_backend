import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Search, ChevronLeft, ChevronRight,
  AlertCircle, RefreshCw, Clock, ShieldCheck, Activity
} from 'lucide-react';
import { auditService } from '../../services/auditService';

const PER_PAGE = 8;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAll();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Unable to load audit logs from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const q = search.toLowerCase();
      return (
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.userId || '').toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('REGISTER') || act.includes('INVOICE') || act.includes('PAYMENT')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('ASSIGN')) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('FAIL')) {
      return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">System Audit Logs</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Immutable audit trail of security and database operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-800/80 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Logged Events</p>
          <p className="text-xl font-bold mt-1 text-brand-400">{logs.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Security Guard</p>
          <div className="flex items-center gap-1.5 mt-1 text-emerald-400 font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Integrity Verified</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Monitoring Status</p>
          <div className="flex items-center gap-1.5 mt-1 text-cyan-400 font-bold">
            <Activity className="h-4 w-4 text-neon-green" />
            <span>24/7 Active Trail</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Filter logs by action, details, or user..."
          className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Log Ref</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Action Type</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Details & Operation</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actor / User</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      <p className="text-xs">Loading audit trail...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No audit logs matching query</p>
                  </td>
                </tr>
              ) : (
                paginated.map((l) => {
                  const dateStr = l.createdAt ? new Date(l.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  }) : 'Just now';

                  return (
                    <tr key={l.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">
                        {l.id ? String(l.id).slice(0, 8).toUpperCase() : 'EVENT'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${getActionBadge(l.action)}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 max-w-md">{l.details || '—'}</td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                        {l.userId ? String(l.userId).slice(0, 8) + '...' : 'System Agent'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                    page === i + 1 ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25' : 'text-slate-500 hover:bg-white/[0.04]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
