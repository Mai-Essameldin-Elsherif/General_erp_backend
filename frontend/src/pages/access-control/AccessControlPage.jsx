import { useState, useEffect, useMemo } from 'react';
import {
  Lock, Plus, Search, Key,
  AlertCircle, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { accessControlService } from '../../services/accessControlService';

export default function AccessControlPage() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accessControlService.getAll();
      setPermissions(data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError('Unable to load permissions from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const showSuccessToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const filtered = useMemo(() => {
    return permissions.filter((p) => {
      const q = search.toLowerCase();
      return (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    });
  }, [permissions, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      await accessControlService.create(form);
      showSuccessToast(`Permission "${form.name}" registered successfully.`);
      setModalOpen(false);
      setForm({ name: '', description: '' });
      await fetchPermissions();
    } catch (err) {
      console.error('Permission create error:', err);
      const msg = err.response?.data?.message || 'Failed to create permission.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">Access Control & Permissions</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Granular resource authorization and permission registry</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPermissions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-800/80 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => { setForm({ name: '', description: '' }); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 hover:from-brand-500 hover:to-brand-400 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Permission
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

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active Permissions</p>
          <p className="text-xl font-bold mt-1 text-brand-400">{permissions.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Security Level</p>
          <p className="text-xl font-bold mt-1 text-emerald-400">Strict RBAC</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Scope</p>
          <p className="text-xl font-bold mt-1 text-cyan-400">System Wide</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions by name or scope..."
          className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Permission Key</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">UUID Identifier</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      <p className="text-xs">Loading permissions...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No permissions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'System';
                  return (
                    <tr key={p.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Key className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-white bg-surface-900/90 px-2 py-1 rounded-md border border-white/[0.06]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300 max-w-sm">{p.description || 'System operational permission'}</td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">{p.id ? String(p.id).slice(0, 13) + '...' : '—'}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{dateStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Permission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-surface-800 shadow-2xl shadow-black/50 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15">
                  <Lock className="h-4 w-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">Create Permission</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Permission Name (e.g. read:orders)</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="scope:resource"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Explain what access this permission authorizes..."
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.03] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 hover:from-brand-500 hover:to-brand-400 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Register Permission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
