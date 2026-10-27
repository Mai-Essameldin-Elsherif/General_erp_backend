import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shield,
  Lock,
  Building2,
  GitBranch,
  Briefcase,
  ClipboardList,
  Package,
  Tags,
  Warehouse,
  ShoppingCart,
  Truck,
  Receipt,
  CreditCard,
  Calculator,
  Handshake,
  Heart,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Hexagon,
} from 'lucide-react';

const navSections = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', path: '/users', icon: Users, roles: ['admin'] },
      { label: 'Roles', path: '/roles', icon: Shield, roles: ['admin'] },
      { label: 'Access Control', path: '/access-control', icon: Lock, roles: ['admin'] },
      { label: 'Departments', path: '/departments', icon: Building2, roles: ['admin', 'manager'] },
      { label: 'Branches', path: '/branches', icon: GitBranch, roles: ['admin', 'manager'] },
      { label: 'Organization', path: '/organization', icon: Briefcase, roles: ['admin', 'manager'] },
      { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList, roles: ['admin'] },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
      { label: 'Categories', path: '/categories', icon: Tags, roles: ['admin', 'manager', 'staff'] },
      { label: 'Warehouses', path: '/warehouses', icon: Warehouse, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Sales Orders', path: '/sales', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
      { label: 'Procurement', path: '/procurement', icon: Truck, roles: ['admin', 'manager'] },
      { label: 'Invoices', path: '/billing', icon: Receipt, roles: ['admin', 'manager', 'staff'] },
      { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'manager', 'staff'] },
    ],
  },
  {
    title: 'Finance & CRM',
    items: [
      { label: 'Accounting', path: '/accounting', icon: Calculator, roles: ['admin', 'manager'] },
      { label: 'CRM & Clients', path: '/crm', icon: Handshake, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'Catalog Features',
    items: [
      { label: 'Wishlist', path: '/wishlist', icon: Heart, roles: ['admin', 'manager', 'staff'] },
      { label: 'Reviews', path: '/reviews', icon: Star, roles: ['admin', 'manager', 'staff'] },
    ],
  },
];

const USER_MODULE_PATHS = [
  '/dashboard',
  '/users',
  '/roles',
  '/access-control',
  '/departments',
  '/branches',
  '/organization',
  '/audit-logs',
  '/wishlist',
  '/reviews',
  '/products',
  '/categories',
  '/warehouses',
  '/procurement',
  '/sales',
  '/billing',
  '/accounting',
  '/crm',
  '/customers',
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        const uRole = user?.role?.toLowerCase() || 'staff';
        return item.roles.map((r) => r.toLowerCase()).includes(uRole);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* ─── Logo ─── */}
      <div className={`flex items-center gap-3 border-b border-white/[0.04] px-4 h-16 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-neon-purple shadow-lg shadow-brand-500/20">
          <Hexagon className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-[13px] font-bold text-white tracking-tight">General ERP</h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Enterprise System</p>
          </div>
        )}
        <button onClick={onMobileClose} className="ml-auto lg:hidden text-slate-500 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {filteredSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-300 transition-colors"
              >
                <span>{section.title}</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expandedSections[section.title] === false ? '-rotate-90' : ''}`} />
              </button>
            )}

            {(collapsed || expandedSections[section.title] !== false) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isUserModule = USER_MODULE_PATHS.includes(item.path);
                  const isActive = isUserModule && (location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)));

                  if (!isUserModule) {
                    return (
                      <NavLink
                        key={item.path}
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        title={collapsed ? `${item.label} (Under Development)` : undefined}
                        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 cursor-default opacity-50 hover:opacity-75 text-slate-500 hover:text-slate-400 select-none
                          ${collapsed ? 'justify-center' : ''}
                        `}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0 text-slate-600 group-hover:text-slate-500 transition-colors" />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 font-mono">
                              Soon
                            </span>
                          </>
                        )}
                      </NavLink>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200
                        ${collapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-brand-600/[0.12] text-brand-400 font-semibold'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                      <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ─── Collapse toggle ─── */}
      <div className="hidden lg:flex border-t border-white/[0.04] px-3 py-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 transition-all"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-sidebar-bg border-r border-white/[0.04] transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 bg-sidebar-bg border-r border-white/[0.04] transition-all duration-300 ease-in-out ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
