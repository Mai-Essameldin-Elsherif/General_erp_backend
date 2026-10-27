import React, { useEffect, useState } from 'react';
import { Plus, Search, ShoppingCart, X } from 'lucide-react';
import api from '../../services/api';
import './SalesPage.css';

export default function SalesPage() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]); // لحفظ قائمة العملاء
  const [loading, setLoading] = useState(true);

  // حالات الـ Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    quantity: 1,
    unit_price: 0
  });

  const fetchData = () => {
    // جلب الطلبات والعملاء في نفس الوقت
    Promise.all([
      api.get('/api/v1/sales').catch(() => ({ data: [] })),
      api.get('/api/v1/customers').catch(() => ({ data: [] }))
    ]).then(([salesRes, customersRes]) => {
      setSalesOrders(salesRes.data);
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
    
    // تجهيز البيانات زي ما الباك إند طالبها بالظبط (مصفوفة items)
    const orderData = {
      customer_id: formData.customer_id,
      items: [
        {
          product_id: '11111111-1111-1111-1111-111111111111', // UUID وهمي مؤقتاً لحد ما نعمل موديول المنتجات
          quantity: Number(formData.quantity),
          unit_price: Number(formData.unit_price)
        }
      ]
    };

    api.post('/api/v1/sales', orderData)
      .then(() => {
        setIsModalOpen(false);
        setFormData({ customer_id: '', quantity: 1, unit_price: 0 });
        fetchData(); // تحديث الجدول
      })
      .catch((err) => {
        console.error("Error creating order:", err);
        alert("حدث خطأ أثناء إنشاء الطلب");
      });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="badge badge-pending">Pending</span>;
      case 'CONFIRMED': return <span className="badge badge-confirmed">Confirmed</span>;
      case 'DELIVERED': return <span className="badge badge-delivered">Delivered</span>;
      case 'CANCELLED': return <span className="badge badge-cancelled">Cancelled</span>;
      default: return <span className="badge badge-pending">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>
          <p>Manage sales operations, orders, and statuses</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <ShoppingCart size={18} /> Create Order
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by order number or customer..." />
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>ORDER NUMBER</th>
            <th>CUSTOMER</th>
            <th>DATE</th>
            <th>TOTAL AMOUNT</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {salesOrders.map((order) => (
            <tr key={order.id}>
              <td style={{ fontWeight: 600, color: '#6366f1' }}>{order.order_number}</td>
              <td style={{ fontWeight: 500 }}>{order.customer?.name || 'Unknown'}</td>
              <td style={{ color: '#94a3b8' }}>{new Date(order.created_at).toLocaleDateString()}</td>
              <td style={{ fontWeight: 600 }}>${Number(order.total_amount).toLocaleString()}</td>
              <td>{getStatusBadge(order.status)}</td>
              <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
            </tr>
          ))}
          {salesOrders.length === 0 && !loading && (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No sales orders found. Click "Create Order" to start.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* --- Modal (Create Order Form) --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Sales Order</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Customer</label>
                <select name="customer_id" className="form-select" value={formData.customer_id} onChange={handleInputChange} required>
                  <option value="" disabled>-- Choose a customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" name="quantity" className="form-input" value={formData.quantity} onChange={handleInputChange} min="1" required />
              </div>

              <div className="form-group">
                <label>Unit Price ($)</label>
                <input type="number" name="unit_price" className="form-input" value={formData.unit_price} onChange={handleInputChange} min="0" step="0.01" required />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}