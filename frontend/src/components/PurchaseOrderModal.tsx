import React, { useState, useEffect } from 'react';
import type {
  Vendor,
  Warehouse,
  Product,
  CreatePurchaseOrderItemDto,
} from '../types/inventory';
import { ShoppingCart, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: Vendor[];
  warehouses: Warehouse[];
  products: Product[];
  onSubmit: (data: {
    vendorId: string;
    warehouseId: string;
    expectedDeliveryDate?: string;
    notes?: string;
    items: CreatePurchaseOrderItemDto[];
  }) => Promise<void>;
}

interface FormLineItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  vendors,
  warehouses,
  products,
  onSubmit,
}) => {
  const [vendorId, setVendorId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<FormLineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVendorId(vendors[0]?.id || '');
      setWarehouseId(warehouses[0]?.id || '');
      setExpectedDeliveryDate('');
      setNotes('');
      const firstProd = products[0];
      setItems([
        {
          productId: firstProd?.id || '',
          quantity: 10,
          unitCost: Number(firstProd?.costPrice ?? firstProd?.cost_price ?? 0),
        },
      ]);
      setError(null);
    }
  }, [isOpen, vendors, warehouses, products]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd?.id || '',
        quantity: 1,
        unitCost: Number(firstProd?.costPrice ?? firstProd?.cost_price ?? 0),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('A purchase order requires at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const selectedProd = products.find((p) => p.id === newProductId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: newProductId,
              unitCost: Number(
                selectedProd?.costPrice ??
                  selectedProd?.cost_price ??
                  item.unitCost,
              ),
            }
          : item,
      ),
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: 'quantity' | 'unitCost',
    value: number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const totalOrderCost = items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError('Select a supplier vendor.');
      return;
    }

    if (!warehouseId) {
      setError('Select a receiving warehouse.');
      return;
    }

    for (const item of items) {
      if (!item.productId) {
        setError('Select a product for every line item.');
        return;
      }
      if (item.quantity <= 0) {
        setError('Quantity must be greater than zero.');
        return;
      }
      if (item.unitCost < 0) {
        setError('Unit cost cannot be negative.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        vendorId,
        warehouseId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to create purchase order',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] overflow-y-auto">
      <div className="bg-[#0f172a] rounded-lg max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-800 text-slate-200 rounded-md border border-slate-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                New Purchase Order
              </h3>
              <p className="text-xs text-slate-400">
                Issue a procurement order with automatic cost calculation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Vendor
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.company_name || v.name}
                    {v.contact_name ? ` (${v.contact_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Receiving Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.location ? `(${w.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Notes <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Internal requisition or delivery instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="border border-slate-800 rounded-md overflow-hidden bg-[#0b0f19]">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-medium text-slate-300">
                Line Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto p-3 space-y-2.5">
              {items.map((item, idx) => {
                const subtotal =
                  (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2.5 items-center pt-2 first:pt-0"
                  >
                    <div className="col-span-5">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Product
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) =>
                          handleProductChange(idx, e.target.value)
                        }
                        required
                        className="w-full text-xs rounded border border-slate-700 bg-[#0f172a] px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            'quantity',
                            Number(e.target.value),
                          )
                        }
                        className="w-full text-xs tabular-nums rounded border border-slate-700 bg-[#0f172a] px-2.5 py-1.5 text-slate-100 text-right focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Unit Cost ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitCost}
                        onChange={(e) =>
                          handleItemFieldChange(
                            idx,
                            'unitCost',
                            Number(e.target.value),
                          )
                        }
                        className="w-full text-xs tabular-nums rounded border border-slate-700 bg-[#0f172a] px-2.5 py-1.5 text-slate-100 text-right focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="block text-[11px] text-slate-400 mb-1">
                        Subtotal
                      </span>
                      <span className="text-xs font-medium tabular-nums text-slate-200">
                        $
                        {subtotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="col-span-1 flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Cost Bar */}
            <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total Order Value
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-100">
                $
                {totalOrderCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Order...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
