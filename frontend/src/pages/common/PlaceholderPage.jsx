import { Construction, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PlaceholderPage({ title, description, category }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in text-center">
      {/* Icon badge */}
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-600/10 border border-brand-500/20 shadow-xl shadow-brand-500/10">
          <Construction className="h-9 w-9 text-brand-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-surface-800 border border-white/[0.08] shadow-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </div>
      </div>

      {category && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-400 mb-3 uppercase tracking-wider">
          {category}
        </span>
      )}

      <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
        {title || 'Module Under Construction'}
      </h1>

      <p className="max-w-md text-sm text-slate-400 leading-relaxed mb-6">
        {description || 'This ERP module is currently being developed and will be connected to the backend soon.'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.04] hover:text-white transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
