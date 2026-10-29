import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Calendar,
  Building2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

const METHOD_BADGES = {
  CASH: { label: 'Cash', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  CREDIT_CARD: { label: 'Credit Card', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  BANK_TRANSFER: { label: 'Bank Transfer', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  CHEQUE: { label: 'Cheque', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoice_id: '',
    customer_name: '',
    amount: '',
    payment_method: 'BANK_TRANSFER',
    status: 'COMPLETED',
  });

  // Fetch Payments & Invoices
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        api.get('/api/v1/payments').catch(() => ({ data: [] })),
        api.get('/api/v1/invoices').catch(() => ({ data: [] })),
      ]);

      const pData = Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
      setPayments(pData);

      const invData = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      setInvoices(invData);
    } catch (err) {
      console.error('Failed to load payments data:', err);
      setError('Unable to fetch payments from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'invoice_id') {
      const selectedInv = invoices.find((inv) => inv.id === value);
      setFormData((prev) => ({
        ...prev,
        invoice_id: value,
        amount: selectedInv ? selectedInv.total_amount || selectedInv.amount || '' : prev.amount,
        customer_name: selectedInv ? selectedInv.customer?.name || selectedInv.customer_name || '' : prev.customer_name,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    // Default to first invoice if none selected or available
    const invoiceId = formData.invoice_id || (invoices.length > 0 ? invoices[0].id : '05d64a0b-fd84-4707-a50e-f368aa12f151');

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/api/v1/payments', {
        invoice_id: invoiceId,
        amount: Number(formData.amount),
        payment_method: formData.payment_method,
      });

      setSuccess('Payment recorded successfully!');
      setIsModalOpen(false);
      setFormData({
        invoice_id: '',
        customer_name: '',
        amount: '',
        payment_method: 'BANK_TRANSFER',
        status: 'COMPLETED',
      });
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to create payment:', err);
      setError('Failed to record payment. Please verify input fields.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completedCount = payments.length;
    // Calculate pending from outstanding invoices if any
    const pendingAmount = invoices
      .filter((inv) => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + Number(inv.total_amount || inv.amount || 0), 0);

    return { totalAmount, completedCount, pendingAmount };
  }, [payments, invoices]);

  // Filtered List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.id?.toLowerCase().includes(search.toLowerCase()) ||
        p.invoice?.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.invoice?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.payment_method?.toLowerCase().includes(search.toLowerCase());

      const matchMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [payments, search, methodFilter]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-neon-purple/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Payments & Transactions</h1>
              <p className="text-xs text-slate-400">Track incoming customer receipts, methods, and transaction history</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800/80 border border-white/[0.06] text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-brand-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* ── Notifications ── */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Top Metrics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Payments */}
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 p-4 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Payments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              ${metrics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Aggregated across all settlement accounts</p>
        </div>

        {/* Pending Amount */}
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 p-4 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Amount</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              ${metrics.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Unpaid & issued invoice balances</p>
        </div>

        {/* Completed Transactions */}
        <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 p-4 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Transactions</span>
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">{metrics.completedCount}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Successfully booked payment vouchers</p>
        </div>
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments by ID, invoice, or method..."
            className="w-full rounded-xl border border-white/[0.06] bg-surface-800/60 pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>

        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-surface-800/60 pl-9 pr-3 py-2 text-xs text-slate-300 outline-none cursor-pointer focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all"
          >
            <option value="ALL">All Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="rounded-2xl border border-white/[0.04] bg-surface-800/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="py-3 px-4 font-semibold text-slate-400">PAYMENT ID</th>
                <th className="py-3 px-4 font-semibold text-slate-400">INVOICE / CUSTOMER</th>
                <th className="py-3 px-4 font-semibold text-slate-400">AMOUNT</th>
                <th className="py-3 px-4 font-semibold text-slate-400">METHOD</th>
                <th className="py-3 px-4 font-semibold text-slate-400">DATE</th>
                <th className="py-3 px-4 font-semibold text-slate-400">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-brand-500" />
                      <span className="text-xs">Loading payment transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-7 w-7 opacity-30 text-slate-400" />
                      <span className="text-xs">No payment records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const methodBadge = METHOD_BADGES[p.payment_method] || {
                    label: p.payment_method || 'Other',
                    bg: 'bg-slate-500/10',
                    text: 'text-slate-400',
                    border: 'border-slate-500/20',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-brand-300">
                        {p.id ? `${p.id.substring(0, 8)}...` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {p.invoice?.invoice_number || 'Direct Payment'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.invoice?.customer?.name || p.invoice?.customer_name || 'Enterprise Client'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-emerald-400">
                          ${Number(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${methodBadge.bg} ${methodBadge.text} ${methodBadge.border}`}
                        >
                          {methodBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Today'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record New Payment</h3>
                  <p className="text-[11px] text-slate-400">Post a verified payment entry into general ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Linked Invoice */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Select Associated Invoice
                </label>
                <select
                  name="invoice_id"
                  value={formData.invoice_id}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-800/80 px-3 py-2 text-xs text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  <option value="">Select an invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id} className="bg-surface-800 text-white">
                      {inv.invoice_number} - ${Number(inv.total_amount || inv.amount || 0).toLocaleString()} (
                      {inv.status})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecting an invoice automatically loads the balance.
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Payment Amount ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-800/80 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Payment Method *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-800/80 px-3 py-2 text-xs text-white outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all cursor-pointer"
                >
                  <option value="BANK_TRANSFER" className="bg-surface-800 text-white">Bank Transfer</option>
                  <option value="CREDIT_CARD" className="bg-surface-800 text-white">Credit Card</option>
                  <option value="CASH" className="bg-surface-800 text-white">Cash</option>
                  <option value="CHEQUE" className="bg-surface-800 text-white">Cheque</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>{actionLoading ? 'Recording...' : 'Record Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
