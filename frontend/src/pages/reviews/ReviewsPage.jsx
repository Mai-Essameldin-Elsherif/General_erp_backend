import { useState, useEffect } from 'react';
import { Star, Trash2, Plus, X } from 'lucide-react';
import { reviewsService } from '../../services/reviewsService';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await reviewsService.getAll();
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    const updated = await reviewsService.remove(id);
    setReviews(updated);
    notify('Review removed');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!name || !comment) return;
    const updated = await reviewsService.add({
      customerName: name,
      rating: Number(rating),
      comment: comment,
    });
    setReviews(updated);
    setName('');
    setRating(5);
    setComment('');
    setShowAddModal(false);
    notify('Review submitted successfully');
  };

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            Reviews & Feedback
          </h1>
          <p className="text-xs text-slate-400 mt-1">User ratings and comments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Review
        </button>
      </div>

      {/* Notification */}
      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
          {message}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-surface-800/60 border border-white/[0.04] rounded-2xl p-8 text-center text-xs text-slate-500">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-surface-800/60 border border-white/[0.04] rounded-2xl p-8 text-center text-xs text-slate-500">
            No reviews available yet.
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-surface-800/60 border border-white/[0.04] rounded-2xl p-4 backdrop-blur-sm flex items-start justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white text-xs">{rev.customerName}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  {rev.date && <span className="text-[10px] text-slate-500">{rev.date}</span>}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
              </div>
              <button
                onClick={() => handleRemove(rev.id)}
                className="text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                title="Delete Review"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Simple Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-800 border border-white/[0.06] rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
              <h3 className="text-sm font-semibold text-white">Add Review</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">User / Client Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Mohamed"
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="5" className="bg-surface-900">5 Stars (Excellent)</option>
                  <option value="4" className="bg-surface-900">4 Stars (Very Good)</option>
                  <option value="3" className="bg-surface-900">3 Stars (Good)</option>
                  <option value="2" className="bg-surface-900">2 Stars (Fair)</option>
                  <option value="1" className="bg-surface-900">1 Star (Poor)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Review</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your feedback..."
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 resize-none"
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
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
