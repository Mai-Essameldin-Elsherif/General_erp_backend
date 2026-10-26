import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type {
  Vendor,
  CreateVendorDto,
  PurchaseOrderStatus,
} from '../types/inventory';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import {
  ShoppingCart,
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  User,
  Edit2,
  Trash2,
  Eye,
  CheckCheck,
  FileText,
  DollarSign,
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'purchase-orders' | 'vendors'>(
    'purchase-orders',
  );
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [inspectPoId, setInspectPoId] = useState<string | null>(null);

  // Vendor Form State
  const [vendorForm, setVendorForm] = useState<CreateVendorDto>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
  });

  // Toast State
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. GET /procurement/vendors
  const {
    data: vendors = [],
    isLoading: isLoadingVendors,
    refetch: refetchVendors,
  } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => inventoryApi.getVendors(),
  });

  // 2. GET /procurement/purchase-orders
  const {
    data: poData,
    isLoading: isLoadingPOs,
    isError: isPoError,
    error: poError,
    refetch: refetchPOs,
  } = useQuery({
    queryKey: ['purchaseOrders', statusFilter],
    queryFn: () =>
      inventoryApi.getPurchaseOrders({
        status: (statusFilter as PurchaseOrderStatus) || undefined,
      }),
  });
  const purchaseOrders = poData?.items || [];

  // 3. GET /procurement/purchase-orders/:id (Inspect PO Details)
  const { data: inspectedPo, isLoading: isLoadingPoDetail } = useQuery({
    queryKey: ['purchaseOrderDetail', inspectPoId],
    queryFn: () => inventoryApi.getPurchaseOrderById(inspectPoId!),
    enabled: Boolean(inspectPoId),
  });

  // 4. GET /warehouses & GET /products (for Create PO Modal)
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', { limit: 200 }],
    queryFn: () => inventoryApi.getProducts({ limit: 200 }),
  });
  const products = productsData?.items || [];

  // 5. POST /procurement/vendors
  const createVendorMutation = useMutation({
    mutationFn: inventoryApi.createVendor,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsVendorModalOpen(false);
      showToast(
        'success',
        `Vendor "${created.company_name || created.name}" added.`,
      );
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create vendor.');
    },
  });

  // 6. PATCH /procurement/vendors/:id
  const updateVendorMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateVendorDto }) =>
      inventoryApi.updateVendor(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsVendorModalOpen(false);
      setEditingVendor(null);
      showToast(
        'success',
        `Vendor "${updated.company_name || updated.name}" updated.`,
      );
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update vendor.');
    },
  });

  // 7. DELETE /procurement/vendors/:id
  const deleteVendorMutation = useMutation({
    mutationFn: inventoryApi.deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      showToast('success', 'Vendor deleted.');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete vendor.');
    },
  });

  // 8. POST /procurement/purchase-orders
  const createPoMutation = useMutation({
    mutationFn: inventoryApi.createPurchaseOrder,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      showToast(
        'success',
        `Purchase Order ${created.po_number || created.poNumber} created ($${Number(created.total_cost).toFixed(2)}).`,
      );
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create Purchase Order.');
    },
  });

  // 9. PATCH /procurement/purchase-orders/:id/status
  const updatePoStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: PurchaseOrderStatus;
    }) => inventoryApi.updatePurchaseOrderStatus(id, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      if (inspectPoId === updated.id) {
        queryClient.invalidateQueries({
          queryKey: ['purchaseOrderDetail', updated.id],
        });
      }
      if (updated.status === 'COMPLETED' || updated.status === 'RECEIVED') {
        showToast(
          'success',
          `PO ${updated.po_number} marked as ${updated.status}. Warehouse stock incremented and PURCHASE_IN movement logged.`,
        );
      } else {
        showToast(
          'success',
          `PO ${updated.po_number} status updated to ${updated.status}.`,
        );
      }
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update PO status.');
    },
  });

  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
    });
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      company_name: vendor.company_name || vendor.name || '',
      contact_name: vendor.contact_name || vendor.contactName || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      taxNumber: vendor.taxNumber || '',
    });
    setIsVendorModalOpen(true);
  };

  const handleVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.company_name?.trim()) return;
    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, dto: vendorForm });
    } else {
      createVendorMutation.mutate(vendorForm);
    }
  };

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{status}</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>APPROVED</span>
          </span>
        );
      case 'PENDING':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{status}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const totalCommittedValue = purchaseOrders.reduce(
    (sum, po) => sum + Number(po.total_cost ?? po.totalCost ?? 0),
    0,
  );
  const completedCount = purchaseOrders.filter(
    (po) => po.status === 'COMPLETED' || po.status === 'RECEIVED',
  ).length;
  const openOrdersCount = purchaseOrders.filter(
    (po) =>
      po.status === 'DRAFT' ||
      po.status === 'PENDING' ||
      po.status === 'APPROVED',
  ).length;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-lg shadow-xl bg-[#1e293b] border border-slate-700 text-slate-100">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-200 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            Procurement & Vendors
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage supplier accounts, purchase order approvals, and automated warehouse stock receiving.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetchPOs();
              refetchVendors();
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0f172a] hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingPOs || isLoadingVendors
                  ? 'animate-spin text-slate-400'
                  : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddVendor}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPoModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Active Vendors
            </span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {vendors.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Registered supplier accounts
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Open Orders
            </span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {openOrdersCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Draft or approved awaiting receipt
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Completed Orders
            </span>
            <CheckCheck className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {completedCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Received into warehouse inventory
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total PO Volume
            </span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            $
            {totalCommittedValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Cumulative order commitment
          </p>
        </div>
      </div>

      {/* Error State */}
      {isPoError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {poError instanceof Error
                ? poError.message
                : 'Failed to load procurement data.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetchPOs()}
            className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Tabbed Container */}
      <div className="bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden">
        {/* Tabs & Filter Bar */}
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-1 bg-[#0b0f19] p-1 rounded-md border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('purchase-orders')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'purchase-orders'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Purchase Orders ({purchaseOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vendors')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'vendors'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendors ({vendors.length})</span>
            </button>
          </div>

          {activeTab === 'purchase-orders' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-[#0b0f19] border border-slate-800 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="APPROVED">APPROVED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: PURCHASE ORDERS */}
        {activeTab === 'purchase-orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Receiving Warehouse</th>
                  <th className="py-2.5 px-4 text-right">Line Items</th>
                  <th className="py-2.5 px-4 text-right">Total Cost</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {isLoadingPOs ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <tr key={n} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800 rounded w-24" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-36" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-28" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-3.5 bg-slate-800/70 rounded w-8 ml-auto" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-3.5 bg-slate-800/70 rounded w-16 ml-auto" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 bg-slate-800/70 rounded w-20" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-6 bg-slate-800/70 rounded w-28 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No purchase orders found. Click "New Purchase Order" to create one.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const isStockReceived =
                      po.status === 'COMPLETED' || po.status === 'RECEIVED';
                    const isCancelled = po.status === 'CANCELLED';

                    return (
                      <tr
                        key={po.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                          {po.po_number || po.poNumber}
                        </td>

                        <td className="py-2.5 px-4 font-medium text-slate-100">
                          {po.vendor?.company_name ||
                            po.vendor?.name ||
                            po.vendorId.slice(0, 8)}
                        </td>

                        <td className="py-2.5 px-4 text-slate-400">
                          {po.warehouse?.name || po.warehouseId.slice(0, 8)}
                        </td>

                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">
                          {(po.items || []).length}
                        </td>

                        <td className="py-2.5 px-4 text-right tabular-nums font-medium text-slate-100">
                          $
                          {Number(
                            po.total_cost ?? po.totalCost ?? 0,
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-2.5 px-4">
                          {renderStatusBadge(po.status)}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectPoId(po.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="View PO line items"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isStockReceived &&
                              !isCancelled &&
                              po.status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  disabled={updatePoStatusMutation.isPending}
                                  onClick={() =>
                                    updatePoStatusMutation.mutate({
                                      id: po.id,
                                      status: 'APPROVED',
                                    })
                                  }
                                  className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                                >
                                  Approve
                                </button>
                              )}

                            {!isStockReceived && !isCancelled ? (
                              <button
                                type="button"
                                disabled={updatePoStatusMutation.isPending}
                                onClick={() =>
                                  updatePoStatusMutation.mutate({
                                    id: po.id,
                                    status: 'COMPLETED',
                                  })
                                }
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors disabled:opacity-50"
                                title="Mark PO as COMPLETED and receive stock into warehouse"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Mark as Completed</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 px-1.5">
                                {isStockReceived ? 'Received' : 'Closed'}
                              </span>
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
        ) : (
          /* TAB 2: VENDORS DIRECTORY */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4">Company Name</th>
                  <th className="py-2.5 px-4">Contact Person</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {isLoadingVendors ? (
                  [1, 2, 3, 4].map((n) => (
                    <tr key={n} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800 rounded w-36" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-28" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-40" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-24" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-4 bg-slate-800/70 rounded w-14 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No vendors registered. Click "Add Vendor" to create a supplier record.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-100">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{v.company_name || v.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{v.contact_name || v.contactName || '—'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{v.email || '—'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-400 tabular-nums">
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{v.phone || '—'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVendor(v)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            title="Edit vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete vendor "${v.company_name || v.name}"?`,
                                )
                              ) {
                                deleteVendorMutation.mutate(v.id);
                              }
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Order Modal (POST /procurement/purchase-orders) */}
      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        vendors={vendors}
        warehouses={warehouses}
        products={products}
        onSubmit={async (dto) => {
          await createPoMutation.mutateAsync(dto);
        }}
      />

      {/* Inspect Purchase Order Details Modal (GET /procurement/purchase-orders/:id) */}
      {inspectPoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Purchase Order Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Line item breakdown and fulfillment status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectPoId(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingPoDetail ? (
                <div className="space-y-2 py-4">
                  <div className="h-12 bg-slate-800/70 rounded animate-pulse" />
                  <div className="h-28 bg-slate-800/50 rounded animate-pulse" />
                </div>
              ) : inspectedPo ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-md bg-[#0b0f19] border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block">PO Number</span>
                      <span className="font-mono font-medium text-slate-100 mt-0.5 block">
                        {inspectedPo.po_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Vendor</span>
                      <span className="font-medium text-slate-100 mt-0.5 block">
                        {inspectedPo.vendor?.company_name ||
                          inspectedPo.vendor?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Warehouse</span>
                      <span className="font-medium text-slate-100 mt-0.5 block">
                        {inspectedPo.warehouse?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status</span>
                      <div className="mt-1">
                        {renderStatusBadge(inspectedPo.status)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-md overflow-hidden bg-[#0b0f19]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 uppercase text-[11px]">
                          <th className="py-2 px-3.5 font-medium">Product</th>
                          <th className="py-2 px-3.5 font-medium text-right">
                            Qty
                          </th>
                          <th className="py-2 px-3.5 font-medium text-right">
                            Unit Cost
                          </th>
                          <th className="py-2 px-3.5 font-medium text-right">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {(inspectedPo.items || []).map((item, i) => (
                          <tr key={item.id || i}>
                            <td className="py-2.5 px-3.5 font-medium text-slate-200">
                              {item.product?.name || item.productId}
                            </td>
                            <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-300">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-400">
                              ${Number(item.unit_cost).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right tabular-nums font-medium text-slate-100">
                              $
                              {(
                                Number(item.quantity) * Number(item.unit_cost)
                              ).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-xs text-rose-400">
                  Could not load Purchase Order details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Vendor Modal (POST & PATCH /procurement/vendors) */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingVendor
                      ? 'Update supplier company or contact details'
                      : 'Register a supplier account for purchase orders'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVendorSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={vendorForm.company_name || ''}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      company_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Apex Industrial Supply Co."
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Contact Person <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={vendorForm.contact_name || ''}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      contact_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Marcus Vance"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email || ''}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, email: e.target.value })
                    }
                    placeholder="orders@apexsupply.com"
                    className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={vendorForm.phone || ''}
                    onChange={(e) =>
                      setVendorForm({ ...vendorForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 234-5678"
                    className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createVendorMutation.isPending ||
                    updateVendorMutation.isPending
                  }
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50"
                >
                  {createVendorMutation.isPending ||
                  updateVendorMutation.isPending
                    ? 'Saving...'
                    : editingVendor
                      ? 'Save Changes'
                      : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementPage;
