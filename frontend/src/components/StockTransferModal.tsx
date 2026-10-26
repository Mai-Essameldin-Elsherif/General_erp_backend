import React, { useState, useEffect } from 'react';
import type { Warehouse, Product, StockLevel } from '../types/inventory';
import { ArrowRightLeft, X, AlertCircle } from 'lucide-react';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  products: Product[];
  currentWarehouseId?: string;
  sourceStockLevels?: StockLevel[];
  onSubmit: (data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    notes?: string;
  }) => Promise<void>;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  products,
  currentWarehouseId,
  sourceStockLevels = [],
  onSubmit,
}) => {
  const [fromWarehouseId, setFromWarehouseId] = useState<string>('');
  const [toWarehouseId, setToWarehouseId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialFrom = currentWarehouseId || warehouses[0]?.id || '';
      const initialTo = warehouses.find((w) => w.id !== initialFrom)?.id || '';
      setFromWarehouseId(initialFrom);
      setToWarehouseId(initialTo);
      setProductId(products[0]?.id || '');
      setQuantity(1);
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentWarehouseId, warehouses, products]);

  if (!isOpen) return null;

  const selectedStockRecord = sourceStockLevels.find(
    (sl) => (sl.productId ?? sl.product_id) === productId,
  );
  const availableStock =
    fromWarehouseId === currentWarehouseId && selectedStockRecord
      ? Number(selectedStockRecord.qtyOnHand ?? selectedStockRecord.qty_on_hand ?? 0)
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromWarehouseId || !toWarehouseId) {
      setError('Select both source and destination warehouses.');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      setError('Source and destination warehouses must be different.');
      return;
    }

    if (!productId) {
      setError('Select a product to transfer.');
      return;
    }

    if (quantity <= 0) {
      setError('Transfer quantity must be greater than zero.');
      return;
    }

    if (availableStock !== undefined && quantity > availableStock) {
      setError(
        `Insufficient stock in source warehouse. Available: ${availableStock}, Requested: ${quantity}.`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        fromWarehouseId,
        toWarehouseId,
        productId,
        quantity: Number(quantity),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stock transfer failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="bg-[#0f172a] rounded-lg max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-800 text-slate-200 rounded-md border border-slate-700">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Inter-Warehouse Stock Transfer
              </h3>
              <p className="text-xs text-slate-400">
                Atomic transaction across source and destination hubs
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Source & Destination Warehouses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Source Warehouse
              </label>
              <select
                value={fromWarehouseId}
                onChange={(e) => {
                  const nextFrom = e.target.value;
                  setFromWarehouseId(nextFrom);
                  if (nextFrom === toWarehouseId) {
                    const alt = warehouses.find((w) => w.id !== nextFrom);
                    setToWarehouseId(alt?.id || '');
                  }
                }}
                required
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select source...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.location ? `(${w.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Destination Warehouse
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                required
                className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select destination...</option>
                {warehouses
                  .filter((w) => w.id !== fromWarehouseId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.location ? `(${w.location})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Product Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Product
              </label>
              {availableStock !== undefined && (
                <span className="text-xs text-slate-400 tabular-nums">
                  Available in source:{' '}
                  <strong
                    className={
                      availableStock > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {availableStock}
                  </strong>
                </span>
              )}
            </div>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.sku}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Quantity to Transfer
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full text-xs tabular-nums rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reference Notes <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for transfer or requisition reference..."
              className="w-full text-xs rounded-md border border-slate-700 bg-[#0b0f19] px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer */}
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
              {isSubmitting ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockTransferModal;
