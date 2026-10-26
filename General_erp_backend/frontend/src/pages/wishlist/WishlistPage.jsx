import { useState, useEffect } from 'react';
import { Heart, Trash2, Plus, X } from 'lucide-react';
import { wishlistService } from '../../services/wishlistService';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await wishlistService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    const updated = await wishlistService.remove(id);
    setItems(updated);
    notify('Item removed from wishlist');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice) return;
    const added = await wishlistService.add({
      name: newItemName,
      unitPrice: parseFloat(newItemPrice) || 0,
    });
    setItems(added);
    setNewItemName('');
    setNewItemPrice('');
    setShowAddModal(false);
    notify('New item added to wishlist');
  };

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500 fill-pink-500/20" />
            Wishlist
          </h1>
          <p className="text-xs text-slate-400 mt-1">Saved products and items</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
          {message}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-surface-800/60 border border-white/[0.04] rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading wishlist...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Your wishlist is empty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.04] text-slate-400 uppercase tracking-wider font-medium">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">{item.name}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                      ${Number(item.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-white/[0.06] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <h3 className="text-sm font-semibold text-white">Add to Wishlist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Dell Monitor 27-inch"
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  placeholder="350.00"
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-medium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
