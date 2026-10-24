import { useState, useEffect, useMemo } from 'react';
import {
  GitBranch, Plus, Search, Edit3, Trash2, X, MoreVertical,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, RefreshCw, Filter, MapPin
} from 'lucide-react';
import { branchesService } from '../../services/branchesService';

const PER_PAGE = 6;

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [dropdown, setDropdown] = useState(null);
  const [form, setForm] = useState({ name: '', location: '', isActive: true });

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchesService.getAll();
      setBranches(data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      setError('Unable to load branches from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const showSuccessToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = (b.name || '').toLowerCase().includes(q) || (b.location || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && b.isActive !== false) ||
        (statusFilter === 'inactive' && b.isActive === false);
      return matchSearch && matchStatus;
    });
  }, [branches, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditingBranch(null);
    setForm({ name: '', location: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingBranch(b);
    setForm({
      name: b.name || '',
      location: b.location || '',
      isActive: b.isActive !== false,
    });
    setModalOpen(true);
    setDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (editingBranch) {
        await branchesService.update(editingBranch.id, form);
        showSuccessToast(`Branch "${form.name}" updated successfully.`);
      } else {
        await branchesService.create(form);
        showSuccessToast(`Branch "${form.name}" created successfully.`);
      }
      setModalOpen(false);
      await fetchBranches();
    } catch (err) {
      console.error('Branch save error:', err);
      const msg = err.response?.data?.message || 'Failed to save branch.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (b) => {
    setDropdown(null);
    try {
      await branchesService.update(b.id, { isActive: !b.isActive });
      showSuccessToast(`Branch status toggled.`);
      await fetchBranches();
    } catch (err) {
      console.error('Toggle status error:', err);
      setError('Failed to update branch status.');
    }
  };

  const deleteBranch = async (b) => {
    setDropdown(null);
    if (!window.confirm(`Are you sure you want to delete "${b.name}"?`)) return;

    try {
      await branchesService.remove(b.id);
      showSuccessToast(`Branch deleted successfully.`);
      await fetchBranches();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete branch.');
    }
  };

  const activeCount = branches.filter((b) => b.isActive !== false).length;
  const inactiveCount = branches.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">Branches & Hubs</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage regional offices, distribution centers, and hubs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBranches}
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
            <Plus className="h-4 w-4" /> Add Branch
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
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Branches</p>
          <p className="text-xl font-bold mt-1 text-brand-400">{branches.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Operational / Active</p>
          <p className="text-xl font-bold mt-1 text-emerald-400">{activeCount} Hubs</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Standby / Inactive</p>
          <p className="text-xl font-bold mt-1 text-amber-400">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search branches by name or city..."
            className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-8 py-2.5 text-sm text-slate-300 outline-none cursor-pointer focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
          >
            <option value="all" className="bg-surface-800 text-white">All Branches</option>
            <option value="active" className="bg-surface-800 text-white">Active Only</option>
            <option value="inactive" className="bg-surface-800 text-white">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Branch Name</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Location / Address</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-center py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      <p className="text-xs">Loading branches...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No branches found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => {
                  const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Initial';
                  return (
                    <tr key={b.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">#{b.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <GitBranch className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-white">{b.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-xs">{b.location || 'Central Location'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          b.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${b.isActive !== false ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`} />
                          {b.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-5">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() => setDropdown(dropdown === b.id ? null : b.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {dropdown === b.id && (
                            <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-white/[0.08] bg-surface-700 shadow-2xl py-1 animate-scale-in origin-top-right">
                              <button
                                onClick={() => openEdit(b)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => toggleStatus(b)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <GitBranch className="h-3.5 w-3.5" /> {b.isActive !== false ? 'Deactivate' : 'Activate'}
                              </button>
                              <hr className="my-1 border-white/[0.04]" />
                              <button
                                onClick={() => deleteBranch(b)}
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
                  <GitBranch className="h-4 w-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Branch Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Riyadh Logistics Gate"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Location / Address</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="City, Sector, Country"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-white/[0.1] bg-surface-900 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
                  Operational / Active status
                </label>
              </div>

              <div className="flex gap-3 pt-3">
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
                  {actionLoading ? 'Saving...' : editingBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
