import React, { useEffect, useState } from 'react';
import { Plus, Search, FileText, X, Trash2 } from 'lucide-react';
import api from '../../services/api';
import './AccountingPage.css';

export default function AccountingPage() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالات الـ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    items: [
      { account_id: '', debit: 0, credit: 0 },
      { account_id: '', debit: 0, credit: 0 }
    ]
  });

  const fetchData = () => {
    Promise.all([
      api.get('/api/v1/accounting/journal-entries').catch(() => ({ data: [] })),
      api.get('/api/v1/accounting/accounts').catch(() => ({ data: [] }))
    ]).then(([entriesRes, accountsRes]) => {
      setJournalEntries(entriesRes.data);
      // بيانات وهمية للحسابات لو الباك إند مفيش فيه حسابات لسه
      setAccounts(accountsRes.data.length > 0 ? accountsRes.data : [
        { id: '1', name: 'Cash', code: '1001' },
        { id: '2', name: 'Sales Revenue', code: '4001' },
        { id: '3', name: 'Office Equipment', code: '1501' }
      ]);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateTotal = (items, type) => {
    return items.reduce((sum, item) => sum + Number(item[type] || 0), 0);
  };

  // دوال التحكم في سطور القيد (المدين والدائن)
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // تصفير الجانب الآخر (لا يمكن أن يكون السطر مدين ودائن في نفس الوقت)
    if (field === 'debit' && value > 0) newItems[index].credit = 0;
    if (field === 'credit' && value > 0) newItems[index].debit = 0;

    setFormData({ ...formData, items: newItems });
  };

  const addRow = () => {
    setFormData({ ...formData, items: [...formData.items, { account_id: '', debit: 0, credit: 0 }] });
  };

  const removeRow = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const totalDebit = calculateTotal(formData.items, 'debit');
  const totalCredit = calculateTotal(formData.items, 'credit');
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) return alert("القيد غير متزن! مجموع المدين يجب أن يساوي مجموع الدائن.");

    api.post('/api/v1/accounting/journal-entries', formData)
      .then(() => {
        setIsModalOpen(false);
        setFormData({
          entry_date: new Date().toISOString().split('T')[0],
          description: '',
          items: [{ account_id: '', debit: 0, credit: 0 }, { account_id: '', debit: 0, credit: 0 }]
        });
        fetchData();
      })
      .catch((err) => {
        console.error("Error creating entry:", err);
        alert("حدث خطأ أثناء إنشاء القيد");
      });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Accounting & Journal Entries</h1>
          <p>Manage chart of accounts, journal entries, and ledgers</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Entry
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by entry number or description..." />
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>ENTRY NUMBER</th>
            <th>DATE</th>
            <th>DESCRIPTION</th>
            <th>TOTAL DEBIT</th>
            <th>TOTAL CREDIT</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {journalEntries.map((entry) => {
            const tDebit = calculateTotal(entry.items, 'debit');
            const tCredit = calculateTotal(entry.items, 'credit');
            const balanced = tDebit === tCredit;

            return (
              <tr key={entry.id}>
                <td style={{ fontWeight: 600, color: '#6366f1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#94a3b8" /> {entry.entry_number || 'New'}
                  </div>
                </td>
                <td style={{ color: '#94a3b8' }}>{new Date(entry.entry_date).toLocaleDateString()}</td>
                <td style={{ fontWeight: 500 }}>{entry.description}</td>
                <td className="amount-debit">${tDebit.toLocaleString()}</td>
                <td className="amount-credit">${tCredit.toLocaleString()}</td>
                <td>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    backgroundColor: balanced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: balanced ? '#10b981' : '#ef4444'
                  }}>
                    {balanced ? 'Balanced' : 'Unbalanced'}
                  </span>
                </td>
                <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* --- Modal (Create Journal Entry Form) --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Create Journal Entry</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="form-input" value={formData.entry_date} onChange={(e) => setFormData({...formData, entry_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" className="form-input" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. Initial capital deposit" required />
                </div>
              </div>

              <div style={{ marginTop: '16px', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px' }}>
                <span>Account</span>
                <span>Debit ($)</span>
                <span>Credit ($)</span>
                <span></span>
              </div>

              {formData.items.map((item, index) => (
                <div className="journal-row" key={index}>
                  <select className="form-select" value={item.account_id} onChange={(e) => handleItemChange(index, 'account_id', e.target.value)} required>
                    <option value="" disabled>Select Account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                  <input type="number" className="form-input" value={item.debit} onChange={(e) => handleItemChange(index, 'debit', Number(e.target.value))} min="0" />
                  <input type="number" className="form-input" value={item.credit} onChange={(e) => handleItemChange(index, 'credit', Number(e.target.value))} min="0" />
                  {formData.items.length > 2 && (
                    <button type="button" className="icon-btn" onClick={() => removeRow(index)}><Trash2 size={18} /></button>
                  )}
                </div>
              ))}

              <button type="button" style={{ background: 'transparent', color: '#6366f1', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }} onClick={addRow}>
                + Add Line
              </button>

              <div className="totals-bar">
                <span>Total</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <span style={{ color: totalDebit === totalCredit ? '#10b981' : '#f8fafc' }}>Debit: ${totalDebit.toLocaleString()}</span>
                  <span style={{ color: totalDebit === totalCredit ? '#10b981' : '#f8fafc' }}>Credit: ${totalCredit.toLocaleString()}</span>
                </div>
              </div>
              {!isBalanced && totalDebit > 0 && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', textAlign: 'right' }}>
                  Difference: ${Math.abs(totalDebit - totalCredit).toLocaleString()}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!isBalanced}>Post Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}