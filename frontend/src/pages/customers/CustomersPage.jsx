import React, { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import api from '../../services/api';
import './CustomersPage.css';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    credit_limit: 0
  });

  const fetchCustomers = () => {
    api.get('/api/v1/customers')
      .then((res) => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  
  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/api/v1/customers', {
      ...formData,
      credit_limit: Number(formData.credit_limit)
    })
      .then(() => {
        setIsModalOpen(false); 
        setFormData({ name: '', email: '', phone: '', credit_limit: 0 }); 
        fetchCustomers(); 
      })
      .catch((err) => {
        console.error("Error creating customer:", err);
        alert("حدث خطأ أثناء إضافة العميل");
      });
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage clients, credit limits & statuses</p>
        </div>
        {/* زرار فتح النافذة */}
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">TOTAL CUSTOMERS</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">ACTIVE</div>
          <div className="stat-value" style={{color: '#10b981'}}>
            {customers.filter(c => c.is_active !== false).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">AVG CREDIT LIMIT</div>
          <div className="stat-value">
            ${customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + Number(c.credit_limit || 0), 0) / customers.length).toLocaleString() : 0}
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by name or email..." />
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>CUSTOMER</th>
            <th>PHONE</th>
            <th>CREDIT LIMIT</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr key={customer.id}>
              <td>
                <div className="user-cell">
                  <div className="avatar" style={{ backgroundColor: index % 2 === 0 ? '#8b5cf6' : '#f59e0b' }}>
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{customer.name}</div>
                    <div className="user-email">{customer.email}</div>
                  </div>
                </div>
              </td>
              <td style={{ color: '#94a3b8' }}>{customer.phone || 'N/A'}</td>
              <td style={{ fontWeight: 500 }}>${Number(customer.credit_limit || 0).toLocaleString()}</td>
              <td>
                <div className="status-indicator">
                  <div className="dot" style={{ backgroundColor: customer.is_active !== false ? '#10b981' : '#ef4444' }}></div>
                  <span style={{ color: customer.is_active !== false ? '#10b981' : '#ef4444' }}>
                    {customer.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </td>
              <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
            </tr>
          ))}
          {customers.length === 0 && !loading && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No customers found. Click "Add Customer" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* --- Modal (Add Customer Form) --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Credit Limit ($)</label>
                <input type="number" name="credit_limit" className="form-input" value={formData.credit_limit} onChange={handleInputChange} min="0" required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}