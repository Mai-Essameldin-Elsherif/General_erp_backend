import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Search, Edit3, Trash2, X, MoreVertical,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { departmentsService } from '../../services/departmentsService';

const PER_PAGE = 6;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [dropdown, setDropdown] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', branchId: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await departmentsService.getAll();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setError('Unable to load departments from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showSuccessToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      const q = search.toLowerCase();
      return (d.name || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
    });
  }, [departments, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditingDept(null);
    setForm({ name: '', description: '', branchId: '' });
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditingDept(d);
    setForm({
      name: d.name || '',
      description: d.description || '',
      branchId: d.branchId || d.branch_id || '',
    });
    setModalOpen(true);
    setDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        description: form.description,
        ...(form.branchId ? { branchId: parseInt(form.branchId, 10) } : {}),
      };

      if (editingDept) {
        await departmentsService.update(editingDept.id, payload);
        showSuccessToast(`Department "${form.name}" updated successfully.`);
      } else {
        await departmentsService.create(payload);
        showSuccessToast(`Department "${form.name}" created successfully.`);
      }
      setModalOpen(false);
      await fetchDepartments();
    } catch (err) {
      console.error('Department save error:', err);
      const msg = err.response?.data?.message || 'Failed to save department.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteDept = async (d) => {
    setDropdown(null);
    if (!window.confirm(`Are you sure you want to delete "${d.name}"?`)) return;

    try {
      await departmentsService.remove(d.id);
      showSuccessToast(`Department deleted successfully.`);
      await fetchDepartments();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">Departments</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage operational business units and branch affiliations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDepartments}
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
            <Plus className="h-4 w-4" /> Add Department
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
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Departments</p>
          <p className="text-xl font-bold mt-1 text-brand-400">{departments.length}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Branch Assigned</p>
          <p className="text-xl font-bold mt-1 text-cyan-400">
            {departments.filter((d) => d.branchId || d.branch_id).length} Active
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Corporate Hub</p>
          <p className="text-xl font-bold mt-1 text-purple-400">HQ Centralized</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search departments..."
          className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dept ID</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Department Name</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Branch Ref</th>
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
                      <p className="text-xs">Loading departments...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm">No departments found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((d) => {
                  const bId = d.branchId || d.branch_id;
                  const dateStr = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Initial';
                  return (
                    <tr key={d.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-500">#{d.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-white">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 max-w-xs truncate">{d.description || '—'}</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {bId ? `Branch #${bId}` : 'Main HQ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-5">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() => setDropdown(dropdown === d.id ? null : d.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {dropdown === d.id && (
                            <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-white/[0.08] bg-surface-700 shadow-2xl py-1 animate-scale-in origin-top-right">
                              <button
                                onClick={() => openEdit(d)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => deleteDept(d)}
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
                  <Building2 className="h-4 w-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">{editingDept ? 'Edit Department' : 'Add Department'}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Finance & Accounting"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Responsibilities and operational focus..."
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Branch ID (Optional)</label>
                <input
                  type="number"
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  placeholder="1"
                  className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
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
                  {actionLoading ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
