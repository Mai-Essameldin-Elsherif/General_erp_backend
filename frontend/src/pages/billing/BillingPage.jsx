import React, { useEffect, useState } from 'react';
import { Plus, Search, Receipt, X } from 'lucide-react';
import api from '../../services/api';
import './BillingPage.css';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: 0,
    due_date: ''
  });

  const dummyInvoices = [
    { id: '1', invoice_number: 'INV-2610-001', customer_name: 'Malak Radwan', amount: 1500.00, status: 'PAID', issue_date: '2026-10-20', due_date: '2026-10-27' },
    { id: '2', invoice_number: 'INV-2610-002', customer_name: 'Asmaa Mostafa', amount: 3200.50, status: 'UNPAID', issue_date: '2026-10-25', due_date: '2026-11-05' },
    { id: '3', invoice_number: 'INV-2610-003', customer_name: 'Ahmed Ali', amount: 850.00, status: 'OVERDUE', issue_date: '2026-10-10', due_date: '2026-10-17' },
  ];

  const fetchData = () => {
    Promise.all([
      api.get('/api/v1/billing').catch(() => ({ data: [] })),
      api.get('/api/v1/customers').catch(() => ({ data: [] }))
    ]).then(([billingRes, customersRes]) => {
      setInvoices(billingRes.data.length > 0 ? billingRes.data : dummyInvoices);
      setCustomers(customersRes.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/api/v1/billing', {
      ...formData,
      amount: Number(formData.amount)
    })
      .then(() => {
        setIsModalOpen(false);
        setFormData({ customer_id: '', amount: 0, due_date: '' });
        fetchData();
      })
      .catch((err) => {
        console.error("Error creating invoice:", err);
        alert("حدث خطأ أثناء إنشاء الفاتورة");
      });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PAID': return <span className="badge badge-paid">Paid</span>;
      case 'UNPAID': return <span className="badge badge-unpaid">Unpaid</span>;
      case 'OVERDUE': return <span className="badge badge-overdue">Overdue</span>;
      default: return <span className="badge badge-unpaid">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Billing & Invoices</h1>
          <p>Manage customer invoices, payments, and overdue accounts</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Receipt size={18} /> Create Invoice
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search invoices..." />
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>INVOICE NO.</th>
            <th>CUSTOMER</th>
            <th>ISSUE DATE</th>
            <th>DUE DATE</th>
            <th>AMOUNT</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td style={{ fontWeight: 600, color: '#6366f1' }}>{invoice.invoice_number}</td>
              <td style={{ fontWeight: 500 }}>{invoice.customer?.name || invoice.customer_name || 'Unknown'}</td>
              <td style={{ color: '#94a3b8' }}>{new Date(invoice.issue_date || new Date()).toLocaleDateString()}</td>
              <td style={{ color: '#94a3b8' }}>{new Date(invoice.due_date).toLocaleDateString()}</td>
              <td style={{ fontWeight: 600 }}>${Number(invoice.amount).toLocaleString()}</td>
              <td>{getStatusBadge(invoice.status)}</td>
              <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Invoice</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer</label>
                <select name="customer_id" className="form-select" value={formData.customer_id} onChange={handleInputChange} required>
                  <option value="" disabled>Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" name="amount" className="form-input" value={formData.amount} onChange={handleInputChange} min="0" step="0.01" required />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" name="due_date" className="form-input" value={formData.due_date} onChange={handleInputChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}