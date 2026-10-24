import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  ChevronDown
} from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [userDropdown, setUserDropdown] = useState(false);

  const roleBadgeStyle = {
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    staff: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }[user?.role?.toLowerCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  const initials = `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] bg-surface-900/80 px-4 backdrop-blur-md lg:px-6">
      {/* Left side: Mobile menu toggle + Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.04] hover:text-white lg:hidden"
          title="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block w-64 lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Quick search (Ctrl + K)..."
            className="w-full rounded-xl border border-white/[0.06] bg-surface-800/60 pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-all focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Right side: Notifications & Profile dropdown */}
      <div className="flex items-center gap-3">
        <button
          className="relative rounded-xl p-2 text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserDropdown((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-surface-800/50 p-1.5 pr-3 hover:border-white/[0.1] hover:bg-surface-800 transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-neon-purple text-xs font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Staff'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-0.5" />
          </button>

          {userDropdown && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/[0.08] bg-surface-800/95 p-2 shadow-2xl backdrop-blur-xl animate-scale-in">
              <div className="border-b border-white/[0.04] px-3 py-2.5">
                <p className="text-xs font-semibold text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${roleBadgeStyle}`}>
                    <Shield className="h-2.5 w-2.5" /> {user?.role || 'Staff'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserDropdown(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
