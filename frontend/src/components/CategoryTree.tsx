import React, { useState } from 'react';
import type { Category } from '../types/inventory';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';

interface CategoryTreeProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (category: Category | null) => void;
  onCreateCategory: (parentId?: string | null) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory: (categoryId: string, categoryName: string) => void;
  isLoading?: boolean;
}

interface TreeNodeProps {
  category: Category;
  level: number;
  selectedCategoryId: string | null;
  onSelectCategory: (category: Category | null) => void;
  onCreateCategory: (parentId?: string | null) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory: (categoryId: string, categoryName: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const children = category.sub_categories || category.subCategories || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedCategoryId === category.id;

  return (
    <div className="select-none">
      <div
        onClick={() => onSelectCategory(isSelected ? null : category)}
        style={{ paddingLeft: `${Math.max(level * 14, 8)}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 rounded-md cursor-pointer transition-colors text-[13px] ${
          isSelected
            ? 'bg-indigo-500/15 text-indigo-300 font-medium'
            : 'text-slate-300 hover:bg-slate-800/70 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 h-4 inline-block shrink-0" />
          )}

          {hasChildren && isExpanded ? (
            <FolderOpen
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-indigo-400' : 'text-slate-400'
              }`}
            />
          ) : (
            <Folder
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-indigo-400' : 'text-slate-500'
              }`}
            />
          )}

          <span className="truncate">{category.name}</span>

          {hasChildren && (
            <span className="px-1.5 py-0.2 text-[11px] tabular-nums rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              {children.length}
            </span>
          )}
        </div>

        {/* Subtle hover actions */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            title="Add sub-category"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCategory(category.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>

          {onEditCategory && (
            <button
              type="button"
              title="Rename or move"
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category);
              }}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            title="Delete category"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCategory(category.id, category.name);
            }}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Nested Sub-Categories */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5 border-l border-slate-800 ml-3.5 pl-1.5">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              category={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onCreateCategory={onCreateCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  isLoading = false,
}) => {
  return (
    <div className="bg-[#0f172a] rounded-lg border border-slate-800 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
            Hierarchy Explorer
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onCreateCategory(null)}
          className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded border border-slate-700 transition-colors"
          title="New Root Category"
        >
          <Plus className="w-3 h-3" />
          <span>Root</span>
        </button>
      </div>

      {/* Filter Reset */}
      <div className="p-2.5 border-b border-slate-800/70">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
            selectedCategoryId === null
              ? 'bg-slate-800 text-slate-100 border border-slate-700/80'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>All Categories</span>
          </span>
          <span className="text-[11px] tabular-nums text-slate-400">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="overflow-y-auto flex-1 p-2.5 space-y-0.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-6 bg-slate-800/60 rounded animate-pulse"
                style={{ width: `${65 + (n % 3) * 10}%` }}
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs font-medium text-slate-400">
              No categories defined
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Create a root category to organize products.
            </p>
            <button
              type="button"
              onClick={() => onCreateCategory(null)}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              Create Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <TreeNode
              key={category.id}
              category={category}
              level={0}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onCreateCategory={onCreateCategory}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryTree;
