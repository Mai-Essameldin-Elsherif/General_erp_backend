import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { Category, Product, CreateProductDto } from '../types/inventory';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Barcode,
  DollarSign,
  Warehouse as WarehouseIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

const flattenCategoryOptions = (
  categories: Category[],
  prefix = '',
): { id: string; label: string }[] => {
  const result: { id: string; label: string }[] = [];
  for (const cat of categories) {
    const label = prefix ? `${prefix} / ${cat.name}` : cat.name;
    result.push({ id: cat.id, label });
    const subs = cat.sub_categories || cat.subCategories || [];
    if (subs.length > 0) {
      result.push(...flattenCategoryOptions(subs, label));
    }
  }
  return result;
};

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  // Toast State
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Create / Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductDto>({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    unitPrice: 0,
    costPrice: 0,
    reorderLevel: 10,
    isActive: true,
  });

  // Inspect Product Stock Breakdown Modal (GET /products/:id)
  const [inspectProductId, setInspectProductId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. GET /products (Paginated + Search + Category Filter)
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError,
    error,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['products', { page, limit, search, categoryId: categoryFilter }],
    queryFn: () =>
      inventoryApi.getProducts({
        page,
        limit,
        search: search.trim() || undefined,
        categoryId: categoryFilter || undefined,
      }),
  });

  // 2. GET /products/alerts/reorder-level (Low stock alerts)
  const {
    data: reorderAlerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['productReorderAlerts'],
    queryFn: () => inventoryApi.getProductReorderAlerts(),
  });

  // 3. GET /categories
  const { data: categoriesTree = [] } = useQuery({
    queryKey: ['categoriesTree'],
    queryFn: () => inventoryApi.getCategoriesTree(),
  });

  // 4. GET /products/:id (Product details with per-warehouse stock breakdown)
  const { data: inspectedProduct, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['productDetail', inspectProductId],
    queryFn: () => inventoryApi.getProductById(inspectProductId!),
    enabled: Boolean(inspectProductId),
  });

  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categoriesTree),
    [categoriesTree],
  );

  const alertMap = useMemo(() => {
    const map = new Map<
      string,
      { currentTotalStock: number; stockDeficit: number }
    >();
    for (const alert of reorderAlerts) {
      map.set(alert.id, {
        currentTotalStock: Number(alert.currentTotalStock ?? 0),
        stockDeficit: Number(alert.stockDeficit ?? 0),
      });
    }
    return map;
  }, [reorderAlerts]);

  const productsList = useMemo(
    () => productsData?.items ?? [],
    [productsData?.items],
  );
  const meta = productsData?.meta || {
    page: 1,
    limit: 10,
    totalItems: productsList.length,
    totalPages: 1,
  };

  const displayedProducts = useMemo(() => {
    if (showOnlyLowStock) {
      return reorderAlerts;
    }
    return productsList;
  }, [showOnlyLowStock, reorderAlerts, productsList]);

  // 5. POST /products
  const createMutation = useMutation({
    mutationFn: inventoryApi.createProduct,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      showToast('success', `Product "${created.name}" (${created.sku}) created.`);
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create product.');
    },
  });

  // 6. PATCH /products/:id
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateProductDto> }) =>
      inventoryApi.updateProduct(id, dto),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      if (inspectProductId === updated.id) {
        queryClient.invalidateQueries({
          queryKey: ['productDetail', updated.id],
        });
      }
      showToast('success', `Product "${updated.name}" updated.`);
      setIsModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update product.');
    },
  });

  // 7. DELETE /products/:id
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteProduct(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productReorderAlerts'] });
      showToast('success', 'Product deactivated.');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to deactivate product.');
    },
  });

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      name: '',
      description: '',
      categoryId: categoryFilter || categoryOptions[0]?.id || '',
      unitPrice: 0,
      costPrice: 0,
      reorderLevel: 10,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId ?? product.category_id ?? '',
      unitPrice: Number(product.unitPrice ?? product.unit_price ?? 0),
      costPrice: Number(product.costPrice ?? product.cost_price ?? 0),
      reorderLevel: Number(product.reorderLevel ?? product.reorder_level ?? 0),
      isActive: product.isActive ?? product.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (
      window.confirm(
        `Deactivate product "${product.name}" (SKU: ${product.sku})?`,
      )
    ) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({
        id: editingProduct.id,
        dto: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const avgUnitPrice =
    productsList.length > 0
      ? productsList.reduce(
          (acc, p) => acc + Number(p.unitPrice ?? p.unit_price ?? 0),
          0,
        ) / productsList.length
      : 0;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SKUs, barcodes, pricing, and warehouse reorder thresholds.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              refetchProducts();
              refetchAlerts();
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0f172a] hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoadingProducts || isLoadingAlerts
                  ? 'animate-spin text-slate-400'
                  : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total SKUs
            </span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {meta.totalItems}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Registered in master catalog
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Active Categories
            </span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {categoryOptions.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Available classification groups
          </p>
        </div>

        <div
          onClick={() => setShowOnlyLowStock((prev) => !prev)}
          className={`bg-[#0f172a] border rounded-lg p-4 cursor-pointer transition-colors ${
            showOnlyLowStock
              ? 'border-amber-500/50 bg-amber-500/[0.04]'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Low Stock Alerts
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                reorderAlerts.length > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
            />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-semibold text-slate-100 tabular-nums">
              {reorderAlerts.length}
            </p>
            <span className="text-[11px] font-medium text-amber-400">
              {showOnlyLowStock ? 'Filter active' : 'Click to filter'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Items at or below reorder_level
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Avg. Unit Price
            </span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            ${avgUnitPrice.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Current catalog page average
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {error instanceof Error
                ? error.message
                : 'Failed to load products from backend.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetchProducts()}
            className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Product Catalog Table */}
      <div className="bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0b0f19] border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-[#0b0f19] border border-slate-800 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowOnlyLowStock((prev) => !prev)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
                showOnlyLowStock
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-[#0b0f19] text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Reorder Alerts ({reorderAlerts.length})</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">SKU / Barcode</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-right">Cost Price</th>
                <th className="py-2.5 px-4 text-right">Unit Price</th>
                <th className="py-2.5 px-4 text-right">Reorder Threshold</th>
                <th className="py-2.5 px-4">Inventory Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {isLoadingProducts ? (
                [1, 2, 3, 4, 5, 6].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-slate-800 rounded w-36" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-slate-800/70 rounded w-24" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 bg-slate-800/70 rounded w-20" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3.5 bg-slate-800/70 rounded w-14 ml-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-3.5 bg-slate-800/70 rounded w-10 ml-auto" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-4 bg-slate-800/70 rounded w-20" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-4 bg-slate-800/70 rounded w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No products match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((product) => {
                  const reorderInfo = alertMap.get(product.id);
                  const isLowStock = Boolean(reorderInfo);
                  const unitPrice = Number(
                    product.unitPrice ?? product.unit_price ?? 0,
                  );
                  const costPrice = Number(
                    product.costPrice ?? product.cost_price ?? 0,
                  );
                  const reorderLevel = Number(
                    product.reorderLevel ?? product.reorder_level ?? 0,
                  );

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-100">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {product.description}
                          </p>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-mono text-slate-200 block">
                          {product.sku}
                        </span>
                        {product.barcode && (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                            <Barcode className="w-3 h-3" />
                            <span>{product.barcode}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        {product.category?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/70">
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-400">
                        ${costPrice.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-slate-100">
                        ${unitPrice.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">
                        {reorderLevel}
                      </td>

                      <td className="py-2.5 px-4">
                        {isLowStock ? (
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="tabular-nums">
                              Low Stock ({reorderInfo?.currentTotalStock ?? 0}/
                              {reorderLevel})
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setInspectProductId(product.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            title="Inspect warehouse stock breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Deactivate product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!showOnlyLowStock && (
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
            <span className="tabular-nums">
              Page <strong className="text-slate-200">{meta.page}</strong> of{' '}
              <strong className="text-slate-200">{meta.totalPages || 1}</strong>{' '}
              ({meta.totalItems} total items)
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 border border-slate-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= (meta.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 border border-slate-700"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Product Details & Per-Warehouse Stock Breakdown Modal (GET /products/:id) */}
      {inspectProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <WarehouseIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Warehouse Stock Distribution
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time inventory breakdown by facility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectProductId(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingDetail ? (
                <div className="space-y-2 py-4">
                  <div className="h-12 bg-slate-800/70 rounded animate-pulse" />
                  <div className="h-24 bg-slate-800/50 rounded animate-pulse" />
                </div>
              ) : inspectedProduct ? (
                <>
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-md bg-[#0b0f19] border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block">Product</span>
                      <span className="text-slate-100 font-medium block mt-0.5">
                        {inspectedProduct.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {inspectedProduct.sku}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Total Stock</span>
                      <span className="text-slate-100 font-semibold text-sm tabular-nums block mt-0.5">
                        {inspectedProduct.currentTotalStock ?? 0} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        Reorder Level
                      </span>
                      <span className="text-slate-300 font-semibold text-sm tabular-nums block mt-0.5">
                        {inspectedProduct.reorderLevel} units
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-2">
                      Stock by Warehouse
                    </h4>
                    {(inspectedProduct.stockBreakdown || []).length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-md">
                        No warehouse stock records initialized for this product.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-md bg-[#0b0f19]">
                        {(inspectedProduct.stockBreakdown || []).map((wb) => (
                          <div
                            key={wb.warehouseId}
                            className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-slate-200">
                              {wb.warehouseName}
                            </span>
                            <div className="flex items-center space-x-4 tabular-nums">
                              <span className="text-slate-300">
                                On Hand:{' '}
                                <strong className="text-emerald-400">
                                  {wb.qtyOnHand}
                                </strong>
                              </span>
                              <span className="text-slate-400">
                                Reserved:{' '}
                                <strong className="text-amber-400">
                                  {wb.qtyReserved}
                                </strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-rose-400">
                  Failed to load product breakdown.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal (POST /products & PATCH /products/:id) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-[#0f172a] rounded-lg max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProduct
                      ? 'Update SKU specifications, pricing, or reorder threshold'
                      : 'Register a new SKU in the master inventory catalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="e.g. ERP-IND-101"
                    className="w-full text-xs font-mono rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Barcode <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    placeholder="e.g. 890123456789"
                    className="w-full text-xs font-mono rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Industrial Servo Controller Unit"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryId: e.target.value || null,
                    })
                  }
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Uncategorized</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs tabular-nums rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitPrice: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs tabular-nums rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.reorderLevel ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorderLevel: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs tabular-nums rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Technical specifications or storage notes..."
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingProduct
                      ? 'Save Changes'
                      : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
