import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Filter, MoreVertical, Edit3, Trash2, X,
  UserPlus, Shield, Mail, Eye, EyeOff, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { usersService } from '../../services/usersService';

const ROLE_CFG = {
  admin:   { label: 'Admin',   bg: 'bg-red-500/10',    text: 'text-red-400',    dot: 'bg-red-400',    avatarGrad: 'from-red-500 to-pink-600' },
  manager: { label: 'Manager', bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-400',  avatarGrad: 'from-amber-400 to-orange-600' },
  staff:   { label: 'Staff',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   dot: 'bg-cyan-400',   avatarGrad: 'from-cyan-400 to-blue-600' },
};

const PER_PAGE = 6;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [dropdown, setDropdown] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
  const [showPwd, setShowPwd] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Unable to load users from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showSuccessToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role?.toLowerCase() === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditingUser(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'staff' });
    setShowPwd(false);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', password: '', role: u.role || 'staff' });
    setShowPwd(false);
    setModalOpen(true);
    setDropdown(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    try {
      if (editingUser) {
        const updatePayload = {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
        };
        await usersService.update(editingUser.id, updatePayload);
        showSuccessToast(`User ${form.firstName} ${form.lastName} updated successfully.`);
      } else {
        await usersService.create(form);
        showSuccessToast(`User ${form.firstName} ${form.lastName} created successfully.`);
      }
      setModalOpen(false);
      await fetchUsers();
    } catch (err) {
      console.error('User save error:', err);
      const msg = err.response?.data?.message || 'Failed to save user. Please verify input.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActive = async (u) => {
    setDropdown(null);
    try {
      await usersService.update(u.id, { isActive: !u.isActive });
      showSuccessToast(`User status updated.`);
      await fetchUsers();
    } catch (err) {
      console.error('Status toggle error:', err);
      setError('Failed to update user active status.');
    }
  };

  const deleteUser = async (u) => {
    setDropdown(null);
    if (!window.confirm(`Are you sure you want to delete ${u.firstName} ${u.lastName}?`)) return;

    try {
      await usersService.remove(u.id);
      showSuccessToast(`User deleted successfully.`);
      await fetchUsers();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete user.');
    }
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role?.toLowerCase() === 'admin').length,
    manager: users.filter((u) => u.role?.toLowerCase() === 'manager').length,
    staff: users.filter((u) => u.role?.toLowerCase() === 'staff').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-[22px] font-bold text-white">User Management</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Manage accounts, roles & permissions in PostgreSQL</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
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
            <Plus className="h-4 w-4" /> Add User
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
        {[
          { label: 'Total Users', count: stats.total, color: 'text-brand-400' },
          { label: 'Admins', count: stats.admin, color: 'text-red-400' },
          { label: 'Managers', count: stats.manager, color: 'text-amber-400' },
          { label: 'Staff', count: stats.staff, color: 'text-cyan-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm px-4 py-3.5">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-white/[0.04] bg-surface-800/60 pl-10 pr-8 py-2.5 text-sm text-slate-300 outline-none cursor-pointer focus:border-brand-500/30 focus:ring-1 focus:ring-brand-500/15"
          >
            <option value="all" className="bg-surface-800 text-white">All Roles</option>
            <option value="admin" className="bg-surface-800 text-white">Admin</option>
            <option value="manager" className="bg-surface-800 text-white">Manager</option>
            <option value="staff" className="bg-surface-800 text-white">Staff</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-3.5 px-5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
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
                      <p className="text-xs">Fetching users from PostgreSQL...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Search className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((u) => {
                  const r = ROLE_CFG[u.role?.toLowerCase()] || ROLE_CFG.staff;
                  const initials = `${u.firstName?.charAt(0) || 'U'}${u.lastName?.charAt(0) || ''}`.toUpperCase();
                  const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent';

                  return (
                    <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.015] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${r.avatarGrad} text-xs font-bold text-white shadow-md`}>
                            {initials}
                          </div>
                          <span className="font-medium text-white">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono text-xs">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${r.bg} ${r.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />{r.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive !== false ? 'text-neon-green' : 'text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.isActive !== false ? 'bg-neon-green shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`} />
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-5">
                        <div className="relative flex justify-center">
                          <button
                            onClick={() => setDropdown(dropdown === u.id ? null : u.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {dropdown === u.id && (
                            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-white/[0.08] bg-surface-700 shadow-2xl py-1 animate-scale-in origin-top-right">
                              <button
                                onClick={() => openEdit(u)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                              </button>
                              <button
                                onClick={() => toggleActive(u)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors"
                              >
                                <Shield className="h-3.5 w-3.5" /> {u.isActive !== false ? 'Deactivate' : 'Activate'}
                              </button>
                              <hr className="my-1 border-white/[0.04]" />
                              <button
                                onClick={() => deleteUser(u)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/[0.08] transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete User
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

      {/* ─── Add / Edit Modal ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-surface-800 shadow-2xl shadow-black/50 animate-scale-in">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/[0.04] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/15">
                  <UserPlus className="h-4 w-4 text-brand-400" />
                </div>
                <h2 className="text-base font-semibold text-white">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="First"
                    className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Last"
                    className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@erp.com"
                    className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password (Min 6 chars)</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/[0.06] bg-surface-900/80 px-3 pr-10 py-2.5 text-sm text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/15 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(ROLE_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: key }))}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                        form.role === key ? `${cfg.bg} ${cfg.text} border-current` : 'border-white/[0.06] text-slate-500 hover:border-white/[0.12] hover:text-slate-300'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${form.role === key ? cfg.dot : 'bg-slate-700'}`} />{cfg.label}
                    </button>
                  ))}
                </div>
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
                  {actionLoading ? 'Saving...' : editingUser ? 'Save Changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
