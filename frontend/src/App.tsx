import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { ProcurementPage } from './pages/ProcurementPage';
import {
  FolderTree,
  Package,
  Warehouse,
  ShoppingCart,
  Boxes,
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

type AssignedPageTab = 'categories' | 'products' | 'warehouses' | 'procurement';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<AssignedPageTab>('products');

  const navItems: {
    id: AssignedPageTab;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'categories',
      label: 'Categories',
      description: 'Taxonomy & hierarchy',
      icon: <FolderTree className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: 'Products',
      description: 'SKUs, pricing & alerts',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'warehouses',
      label: 'Warehouses & Stock',
      description: 'Balances & transfers',
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      id: 'procurement',
      label: 'Procurement',
      description: 'Vendors & purchase orders',
      icon: <ShoppingCart className="w-4 h-4" />,
    },
  ];

  const currentNav =
    navItems.find((item) => item.id === activePage) || navItems[0];

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex bg-[#0b0f19] text-slate-100">
        {/* Left Enterprise Sidebar */}
        <aside className="w-60 shrink-0 bg-[#0f172a] border-r border-slate-800 flex flex-col justify-between select-none">
          <div>
            {/* Brand Header */}
            <div className="h-14 px-4 flex items-center space-x-2.5 border-b border-slate-800">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm text-slate-100 tracking-tight block leading-none">
                  General ERP
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Inventory & Supply
                </span>
              </div>
            </div>

            {/* Module Navigation */}
            <div className="p-3">
              <p className="px-2.5 mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Modules
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePage(item.id)}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-slate-100 border border-slate-700/80'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <span
                        className={
                          isActive ? 'text-indigo-400' : 'text-slate-400'
                        }
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Subtle API Environment Footer */}
          <div className="p-3 m-3 rounded-md bg-[#0b0f19] border border-slate-800/90">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium text-slate-300">
                API Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1 truncate">
              localhost:3000/api/v1
            </p>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Breadcrumb Bar */}
          <header className="h-14 px-6 bg-[#0f172a]/90 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Inventory & Procurement</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200 font-medium">
                {currentNav.label}
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/70 text-slate-300">
                Main Distribution Branch
              </span>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {activePage === 'categories' && <CategoriesPage />}
            {activePage === 'products' && <ProductsPage />}
            {activePage === 'warehouses' && <WarehousesPage />}
            {activePage === 'procurement' && <ProcurementPage />}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;
