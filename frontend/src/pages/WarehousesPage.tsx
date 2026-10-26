import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import { StockTransferModal } from '../components/StockTransferModal';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  ArrowRightLeft,
  Plus,
  RefreshCw,
  Boxes,
  History,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
} from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] =
    useState<boolean>(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState<boolean>(false);

  // Create Warehouse Form
  const [newWarehouseName, setNewWarehouseName] = useState<string>('');
  const [newWarehouseLocation, setNewWarehouseLocation] = useState<string>('');

  // Stock Adjustment Form (POST /warehouses/stock/movements)
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjType, setAdjType] = useState<'IN_ADJUSTMENT' | 'OUT_ADJUSTMENT'>(
    'IN_ADJUSTMENT',
  );
  const [adjQuantity, setAdjQuantity] = useState<number>(10);
  const [adjNotes, setAdjNotes] = useState<string>('');

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. GET /warehouses
  const {
    data: warehouses = [],
    isLoading: isLoadingWarehouses,
    isError,
    error,
    refetch: refetchWarehouses,
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryApi.getWarehouses(),
  });

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  // 2. GET /warehouses/:id/stock
  const {
    data: stockLevels = [],
    isLoading: isLoadingStock,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ['warehouseStock', selectedWarehouseId],
    queryFn: () => inventoryApi.getWarehouseStock(selectedWarehouseId),
    enabled: Boolean(selectedWarehouseId),
  });

  // 3. GET /warehouses/stock/movements
  const {
    data: movementsData,
    isLoading: isLoadingMovements,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ['stockMovements', selectedWarehouseId],
    queryFn: () =>
      inventoryApi.getStockMovements({
        warehouseId: selectedWarehouseId || undefined,
        limit: 30,
      }),
  });

  // 4. GET /products (for Transfer & Adjustment product dropdowns)
  const { data: productsData } = useQuery({
    queryKey: ['products', { limit: 200 }],
    queryFn: () => inventoryApi.getProducts({ limit: 200 }),
  });
  const products = productsData?.items || [];

  // 5. POST /warehouses
  const createWarehouseMutation = useMutation({
    mutationFn: inventoryApi.createWarehouse,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setSelectedWarehouseId(created.id);
      setIsCreateWarehouseOpen(false);
      setNewWarehouseName('');
      setNewWarehouseLocation('');
      showToast('success', `Warehouse "${created.name}" created.`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create warehouse.');
    },
  });

  // 6. POST /warehouses/stock/transfer
  const transferMutation = useMutation({
    mutationFn: inventoryApi.transferStock,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['warehouseStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      showToast('success', res.message || 'Stock transferred atomically.');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Stock transfer failed.');
    },
  });

  // 7. POST /warehouses/stock/movements (Direct Adjustment)
  const adjustMutation = useMutation({
    mutationFn: inventoryApi.adjustStock,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['warehouseStock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      setIsAdjustmentOpen(false);
      showToast('success', res.message || 'Stock level adjusted.');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to adjust stock.');
    },
  });

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;
    createWarehouseMutation.mutate({
      name: newWarehouseName.trim(),
      location: newWarehouseLocation.trim() || undefined,
    });
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId || !adjProductId || adjQuantity <= 0) return;
    adjustMutation.mutate({
      warehouseId: selectedWarehouseId,
      productId: adjProductId,
      movementType: adjType,
      quantity: Number(adjQuantity),
      notes: adjNotes.trim() || undefined,
    });
  };

  const selectedWarehouse = warehouses.find(
    (w) => w.id === selectedWarehouseId,
  );
  const totalQtyOnHand = stockLevels.reduce(
    (sum, sl) => sum + Number(sl.qtyOnHand ?? sl.qty_on_hand ?? 0),
    0,
  );
  const totalQtyReserved = stockLevels.reduce(
    (sum, sl) => sum + Number(sl.qtyReserved ?? sl.qty_reserved ?? 0),
    0,
  );
  const movementsList = movementsData?.items || [];

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
            Warehouses & Inventory Stock
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track facility stock balances (`qty_on_hand`, `qty_reserved`), execute inter-warehouse transfers, and review audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetchWarehouses();
              if (selectedWarehouseId) refetchStock();
              refetchMovements();
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0f172a] hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingWarehouses || isLoadingStock
                  ? 'animate-spin text-slate-400'
                  : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdjProductId(products[0]?.id || '');
              setAdjType('IN_ADJUSTMENT');
              setAdjQuantity(10);
              setAdjNotes('');
              setIsAdjustmentOpen(true);
            }}
            disabled={!selectedWarehouseId}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors disabled:opacity-40"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            disabled={warehouses.length < 2}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors disabled:opacity-40"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateWarehouseOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Warehouse</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Active Facilities
            </span>
            <WarehouseIcon className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {warehouses.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Configured warehouse locations
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Qty On Hand
            </span>
            <Boxes className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {totalQtyOnHand}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Physical units in {selectedWarehouse?.name || 'selected hub'}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Qty Reserved
            </span>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {totalQtyReserved}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Committed or allocated units
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Audit Movements
            </span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {movementsList.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Recorded ledger transactions
          </p>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {error instanceof Error
                ? error.message
                : 'Failed to load warehouses.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetchWarehouses()}
            className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Warehouse Selector Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Select Warehouse Facility ({warehouses.length})
          </h2>
          {warehouses.length < 2 && (
            <span className="text-xs text-slate-500">
              Add at least two warehouses to enable inter-warehouse transfers
            </span>
          )}
        </div>

        {isLoadingWarehouses ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 rounded-lg bg-[#0f172a] border border-slate-800 animate-pulse p-4"
              />
            ))}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="bg-[#0f172a] rounded-lg border border-dashed border-slate-800 p-8 text-center">
            <WarehouseIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">
              No warehouses configured
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Create your first warehouse facility to manage stock levels.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateWarehouseOpen(true)}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
            >
              Create Warehouse
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {warehouses.map((wh) => {
              const isSelected = wh.id === selectedWarehouseId;
              return (
                <div
                  key={wh.id}
                  onClick={() => setSelectedWarehouseId(wh.id)}
                  className={`cursor-pointer rounded-lg p-4 border transition-colors ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700/70">
                      <WarehouseIcon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>Selected</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mt-3 truncate">
                    {wh.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {wh.location || 'Standard Distribution Facility'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Warehouse Stock Levels Table & Movement Logs */}
      {selectedWarehouse && (
        <div className="bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden">
          {/* Sub-header & Tab Switcher */}
          <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-1 bg-[#0b0f19] p-1 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'stock'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Stock Levels ({stockLevels.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('movements')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === 'movements'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Logs ({movementsList.length})</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-400 tabular-nums">
              <span>
                Facility:{' '}
                <strong className="text-slate-200 font-medium">
                  {selectedWarehouse.name}
                </strong>
              </span>
              <span>
                On Hand:{' '}
                <strong className="text-slate-200 font-medium">
                  {totalQtyOnHand}
                </strong>
              </span>
              <span>
                Reserved:{' '}
                <strong className="text-slate-200 font-medium">
                  {totalQtyReserved}
                </strong>
              </span>
            </div>
          </div>

          {activeTab === 'stock' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-right">
                      Qty On Hand (`qty_on_hand`)
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      Qty Reserved (`qty_reserved`)
                    </th>
                    <th className="py-2.5 px-4 text-right">Net Available</th>
                    <th className="py-2.5 px-4">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {isLoadingStock ? (
                    [1, 2, 3, 4].map((n) => (
                      <tr key={n} className="animate-pulse">
                        <td className="py-3 px-4">
                          <div className="h-3.5 bg-slate-800 rounded w-36" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-3.5 bg-slate-800/70 rounded w-20" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3.5 bg-slate-800/70 rounded w-10 ml-auto" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3.5 bg-slate-800/70 rounded w-10 ml-auto" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3.5 bg-slate-800/70 rounded w-10 ml-auto" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-slate-800/70 rounded w-20" />
                        </td>
                      </tr>
                    ))
                  ) : stockLevels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No stock records in this warehouse. Complete a Purchase Order or use "Adjust Stock" to add inventory.
                      </td>
                    </tr>
                  ) : (
                    stockLevels.map((sl) => {
                      const onHand = Number(
                        sl.qtyOnHand ?? sl.qty_on_hand ?? 0,
                      );
                      const reserved = Number(
                        sl.qtyReserved ?? sl.qty_reserved ?? 0,
                      );
                      const netAvailable = onHand - reserved;

                      return (
                        <tr
                          key={`${sl.warehouseId}-${sl.productId}`}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-4 font-medium text-slate-100">
                            {sl.product?.name || sl.product_name}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-400">
                            {sl.product?.sku || sl.productId.slice(0, 8)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums font-medium text-slate-200">
                            {onHand}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                            {reserved}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-slate-100">
                            {netAvailable}
                          </td>
                          <td className="py-2.5 px-4">
                            {netAvailable > 10 ? (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>Available</span>
                              </span>
                            ) : netAvailable > 0 ? (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>Low Buffer</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                <span>Depleted</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Movement Type</th>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-right">Quantity</th>
                    <th className="py-2.5 px-4">Reference & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {isLoadingMovements ? (
                    [1, 2, 3, 4].map((n) => (
                      <tr key={n} className="animate-pulse">
                        <td className="py-3 px-4">
                          <div className="h-3.5 bg-slate-800 rounded w-28" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-4 bg-slate-800/70 rounded w-24" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-3.5 bg-slate-800/70 rounded w-32" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="h-3.5 bg-slate-800/70 rounded w-10 ml-auto" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="h-3.5 bg-slate-800/70 rounded w-40" />
                        </td>
                      </tr>
                    ))
                  ) : movementsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No stock movements logged for this warehouse.
                      </td>
                    </tr>
                  ) : (
                    movementsList.map((mv) => {
                      const isInbound =
                        mv.movementType === 'TRANSFER_IN' ||
                        mv.movementType === 'PURCHASE_IN' ||
                        mv.movementType === 'IN_ADJUSTMENT';

                      return (
                        <tr
                          key={mv.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-4 tabular-nums text-slate-400">
                            {new Date(mv.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                isInbound
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {isInbound ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>{mv.movementType}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-200">
                            {mv.product?.name || mv.productId.slice(0, 8)}
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right tabular-nums font-medium ${
                              isInbound ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {isInbound ? '+' : '-'}
                            {mv.quantity}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            <span className="font-mono text-slate-300">
                              [{mv.referenceType}]
                            </span>{' '}
                            {mv.notes || ''}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Transfer Modal (POST /warehouses/stock/transfer) */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        warehouses={warehouses}
        products={products}
        currentWarehouseId={selectedWarehouseId}
        sourceStockLevels={stockLevels}
        onSubmit={async (dto) => {
          await transferMutation.mutateAsync(dto);
        }}
      />

      {/* Create Warehouse Modal (POST /warehouses) */}
      {isCreateWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <WarehouseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    New Warehouse Facility
                  </h3>
                  <p className="text-xs text-slate-400">
                    Register a new storage location in the ERP network
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWarehouseOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. Central Distribution Hub A"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Location / Address <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newWarehouseLocation}
                  onChange={(e) => setNewWarehouseLocation(e.target.value)}
                  placeholder="e.g. Logistics Park Sector 4"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateWarehouseOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWarehouseMutation.isPending}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50"
                >
                  {createWarehouseMutation.isPending
                    ? 'Creating...'
                    : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Stock Adjustment Modal (POST /warehouses/stock/movements) */}
      {isAdjustmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Manual Stock Adjustment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record an inbound or outbound inventory adjustment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustmentOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Product
                </label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  required
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Adjustment Type
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) =>
                      setAdjType(
                        e.target.value as 'IN_ADJUSTMENT' | 'OUT_ADJUSTMENT',
                      )
                    }
                    className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="IN_ADJUSTMENT">Inbound (+)</option>
                    <option value="OUT_ADJUSTMENT">Outbound (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(Number(e.target.value))}
                    className="w-full text-xs tabular-nums rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Reason / Audit Note <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="e.g. Cycle count reconciliation"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50"
                >
                  {adjustMutation.isPending
                    ? 'Applying...'
                    : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousesPage;
