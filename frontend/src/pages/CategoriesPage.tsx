import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { Category } from '../types/inventory';
import { CategoryTree } from '../components/CategoryTree';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Layers,
  FolderOpen,
  Package,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  GitBranch,
} from 'lucide-react';

interface FlatCategoryRow {
  category: Category;
  depth: number;
  parentName: string | null;
  path: string;
  childCount: number;
}

const flattenCategories = (
  categories: Category[],
  depth = 0,
  parentName: string | null = null,
  parentPath = '',
): FlatCategoryRow[] => {
  const rows: FlatCategoryRow[] = [];
  for (const cat of categories) {
    const currentPath = parentPath ? `${parentPath} / ${cat.name}` : cat.name;
    const children = cat.sub_categories || cat.subCategories || [];
    rows.push({
      category: cat,
      depth,
      parentName,
      path: currentPath,
      childCount: children.length,
    });
    if (children.length > 0) {
      rows.push(
        ...flattenCategories(children, depth + 1, cat.name, currentPath),
      );
    }
  }
  return rows;
};

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryParentId, setCategoryParentId] = useState<string>('');

  // Inspect Category Details (GET /categories/:id) State
  const [inspectCategoryId, setInspectCategoryId] = useState<string | null>(
    null,
  );

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. GET /categories (Tree)
  const {
    data: categoriesTree = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['categoriesTree'],
    queryFn: () => inventoryApi.getCategoriesTree(),
  });

  // 2. GET /categories/:id (Category details + associated products)
  const { data: inspectedCategoryDetails, isLoading: isLoadingDetails } =
    useQuery({
      queryKey: ['categoryDetail', inspectCategoryId],
      queryFn: () => inventoryApi.getCategoryById(inspectCategoryId!),
      enabled: Boolean(inspectCategoryId),
    });

  const flatRows = useMemo(
    () => flattenCategories(categoriesTree),
    [categoriesTree],
  );

  const displayedRows = useMemo(() => {
    let list = flatRows;
    if (selectedCategory) {
      list = list.filter(
        (r) =>
          r.category.id === selectedCategory.id ||
          (r.category.parentId ?? r.category.parent_id) ===
            selectedCategory.id ||
          r.path.startsWith(selectedCategory.name),
      );
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.category.name.toLowerCase().includes(q) ||
          r.path.toLowerCase().includes(q),
      );
    }
    return list;
  }, [flatRows, selectedCategory, searchTerm]);

  // 3. POST /categories
  const createMutation = useMutation({
    mutationFn: inventoryApi.createCategory,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['categoriesTree'] });
      showToast('success', `Category "${created.name}" created.`);
      setIsModalOpen(false);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create category.');
    },
  });

  // 4. PATCH /categories/:id
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      parentId,
    }: {
      id: string;
      name: string;
      parentId: string | null;
    }) => inventoryApi.updateCategory(id, { name, parentId }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['categoriesTree'] });
      if (inspectCategoryId === updated.id) {
        queryClient.invalidateQueries({
          queryKey: ['categoryDetail', updated.id],
        });
      }
      showToast('success', `Category "${updated.name}" updated.`);
      setIsModalOpen(false);
      setEditingCategory(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update category.');
    },
  });

  // 5. DELETE /categories/:id
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteCategory(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriesTree'] });
      if (selectedCategory) setSelectedCategory(null);
      showToast('success', 'Category deleted.');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete category.');
    },
  });

  const handleOpenCreateModal = (parentId?: string | null) => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryParentId(parentId || '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryParentId(category.parentId ?? category.parent_id ?? '');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (
      window.confirm(
        `Delete category "${name}"? Child categories or linked products may prevent deletion.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        name: categoryName.trim(),
        parentId: categoryParentId || null,
      });
    } else {
      createMutation.mutate({
        name: categoryName.trim(),
        parentId: categoryParentId || null,
      });
    }
  };

  const rootCategoriesCount = categoriesTree.length;
  const subCategoriesCount = Math.max(0, flatRows.length - rootCategoriesCount);
  const maxDepth =
    flatRows.length > 0
      ? Math.max(...flatRows.map((r) => r.depth)) + 1
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
            Product Categories
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage catalog taxonomy, parent-child relationships, and assigned products.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0f172a] hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-400' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal(selectedCategory?.id || null)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {selectedCategory
                ? `New Sub-Category in ${selectedCategory.name}`
                : 'New Category'}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total Categories
            </span>
            <FolderTree className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {flatRows.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Active nodes in catalog tree
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Root Categories
            </span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {rootCategoriesCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Top-level product departments
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Sub-Categories
            </span>
            <FolderOpen className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {subCategoriesCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Nested classification branches
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Hierarchy Depth
            </span>
            <GitBranch className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-semibold text-slate-100 mt-2 tabular-nums">
            {maxDepth} {maxDepth === 1 ? 'level' : 'levels'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Self-referencing parent_id depth
          </p>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong className="font-semibold">Failed to load categories:</strong>{' '}
              {error instanceof Error ? error.message : 'Connection error'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Split View: Side-panel Category Tree + Category Directory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Tree */}
        <div className="lg:col-span-4 h-[560px]">
          <CategoryTree
            categories={categoriesTree}
            selectedCategoryId={selectedCategory?.id || null}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            onCreateCategory={(parentId) => handleOpenCreateModal(parentId)}
            onEditCategory={(cat) => handleOpenEditModal(cat)}
            onDeleteCategory={handleDeleteCategory}
            isLoading={isLoading}
          />
        </div>

        {/* Right Table */}
        <div className="lg:col-span-8 bg-[#0f172a] rounded-lg border border-slate-800 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {selectedCategory
                  ? `Filtered: ${selectedCategory.name}`
                  : 'Category Directory'}
              </h2>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by category or path..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0b0f19] border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Taxonomy Path</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4 text-right">Sub-Categories</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((n) => (
                    <tr key={n} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800 rounded w-32" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-3.5 bg-slate-800/70 rounded w-44" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 bg-slate-800/70 rounded w-20" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-3.5 bg-slate-800/70 rounded w-6 ml-auto" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="h-4 bg-slate-800/70 rounded w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No categories match your current filter.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map(
                    ({ category, depth, parentName, path, childCount }) => (
                      <tr
                        key={category.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-100">
                          <div
                            className="flex items-center space-x-2"
                            style={{ paddingLeft: `${depth * 12}px` }}
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{category.name}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 text-slate-400">
                          {path}
                        </td>

                        <td className="py-2.5 px-4">
                          {parentName ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/70">
                              Child of {parentName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span>Root</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">
                          {childCount}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setInspectCategoryId(category.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="View products in category"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCreateModal(category.id)}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="Add sub-category"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(category)}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                              title="Edit category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCategory(category.id, category.name)
                              }
                              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Category Details Modal (GET /api/v1/categories/:id) */}
      {inspectCategoryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    Category Overview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Associated products and sub-categories
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectCategoryId(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingDetails ? (
                <div className="space-y-2 py-4">
                  <div className="h-10 bg-slate-800/70 rounded animate-pulse" />
                  <div className="h-24 bg-slate-800/50 rounded animate-pulse" />
                </div>
              ) : inspectedCategoryDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md bg-[#0b0f19] border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block">Category Name</span>
                      <span className="text-slate-100 font-semibold text-sm mt-0.5 block">
                        {inspectedCategoryDetails.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        Sub-Categories
                      </span>
                      <span className="text-slate-100 font-semibold text-sm tabular-nums mt-0.5 block">
                        {(inspectedCategoryDetails.subCategories || []).length}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-2">
                      Products in Category (
                      {(inspectedCategoryDetails.products || []).length})
                    </h4>
                    {(inspectedCategoryDetails.products || []).length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-md">
                        No products currently assigned to this category.
                      </p>
                    ) : (
                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-md bg-[#0b0f19]">
                        {(inspectedCategoryDetails.products || []).map(
                          (prod) => (
                            <div
                              key={prod.id}
                              className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-medium text-slate-200">
                                  {prod.name}
                                </p>
                                <p className="text-slate-500 font-mono text-[11px]">
                                  {prod.sku}
                                </p>
                              </div>
                              <span className="tabular-nums font-medium text-slate-200">
                                $
                                {Number(
                                  prod.unitPrice ?? prod.unit_price ?? 0,
                                ).toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-rose-400">
                  Could not load category details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal (POST /categories & PATCH /categories/:id) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-[#0f172a] rounded-lg max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingCategory
                      ? 'Update category name or parent assignment'
                      : 'Add a category node to the catalog hierarchy'}
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

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Industrial Components"
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Parent Category <span className="text-slate-500">(optional)</span>
                </label>
                <select
                  value={categoryParentId}
                  onChange={(e) => setCategoryParentId(e.target.value)}
                  className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None (Root Category)</option>
                  {flatRows
                    .filter((r) => r.category.id !== editingCategory?.id)
                    .map((r) => (
                      <option key={r.category.id} value={r.category.id}>
                        {r.path}
                      </option>
                    ))}
                </select>
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
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
