import { useState, useEffect, useMemo } from 'react';
import {
  Shield, Plus, Search, Edit3, Trash2, X, MoreVertical,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { rolesService } from '../../services/rolesService';

const PER_PAGE = 6;

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [dropdown, setDropdown] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Unable to load roles from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const showSuccessToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const filtered = useMemo(() => {
    return roles.filter((r) => {
      const q = search.toLowerCase();
      return (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);
    });
  }, [roles, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditingRole(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingRole(r);
    setForm({ name: r.name || '', description: r.description || '' });
    setModalOpen(true);
    setDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (editingRole) {
        await rolesService.update(editingRole.id, form);
        showSuccessToast(`Role "${form.name}" updated successfully.`);
      } else {
        await rolesService.create(form);
        showSuccessToast(`Role "${form.name}" created successfully.`);
      }
      setModalOpen(false);
      await fetchRoles();
    } catch (err) {
      console.error('Role save error:', err);
      const msg = err.response?.data?.message || 'Failed to save role.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteRole = async (r) => {
    setDropdown(null);
    if (!window.confirm(`Are you sure you want to delete the role "${r.name}"?`)) return;

    try {
      await rolesService.remove(r.id);
      showSuccessToast(`Role deleted successfully.`);
      await fetchRoles();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete role.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">Roles Management</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Define system security roles and access privileges</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRoles}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-800/80 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.04] transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 hover:from-brand-500 hover:to-brand-400 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Role
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
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Roles</p>
          <p className="text-xl font-bold mt-1 text-brand-400">{roles.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Standard Roles</p>
          <p className="text-xl font-bold mt-1 text-cyan-400">{roles.length > 2 ? roles.length - 2 : roles.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">System Level</p>
          <p className="text-xl font-bold mt-1 text-purple-400">2 Protected</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search roles..."
          className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Role ID</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Role Name</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-center py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      <p className="text-xs">Loading roles...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No roles found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Initial';
                  return (
                    <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">#{r.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            <Shield className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-white">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 max-w-xs truncate">{r.description || '—'}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-5">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() => setDropdown(dropdown === r.id ? null : r.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {dropdown === r.id && (
                            <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-white/[0.08] bg-surface-700 shadow-2xl py-1 animate-scale-in origin-top-right">
                              <button
                                onClick={() => openEdit(r)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => deleteRole(r)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/[0.08] transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          )}
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-surface-800 shadow-2xl shadow-black/50 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15">
                  <Shield className="h-4 w-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">{editingRole ? 'Edit Role' : 'Add New Role'}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Compliance Auditor"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe permissions and duties..."
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
                  {actionLoading ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
