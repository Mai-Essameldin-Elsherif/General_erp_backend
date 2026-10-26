import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, X } from 'lucide-react';
import api from '../../services/api';
import './ProductsPage.css';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    stock_quantity: 0
  });

  const dummyProducts = [
    { id: '1', name: 'MacBook Pro 16"', sku: 'MAC-16-M3', price: 2499.00, stock_quantity: 45 },
    { id: '2', name: 'Ergonomic Office Chair', sku: 'FURN-CHR-01', price: 299.50, stock_quantity: 5 },
    { id: '3', name: 'Wireless Mechanical Keyboard', sku: 'TECH-KB-09', price: 120.00, stock_quantity: 150 },
  ];

  const fetchProducts = () => {
    api.get('/api/v1/products')
      .then((res) => {
        setProducts(res.data.length > 0 ? res.data : dummyProducts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setProducts(dummyProducts);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/api/v1/products', {
      ...formData,
      price: Number(formData.price),
      stock_quantity: Number(formData.stock_quantity)
    })
      .then(() => {
        setIsModalOpen(false);
        setFormData({ name: '', sku: '', price: 0, stock_quantity: 0 });
        fetchProducts();
      })
      .catch((err) => {
        console.error("Error creating product:", err);
        alert("حدث خطأ أثناء إضافة المنتج");
      });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Inventory & Products</h1>
          <p>Manage product catalog, pricing, and stock levels</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search by product name or SKU..." />
        </div>
      </div>

      <table className="custom-table">
        <thead>
          <tr>
            <th>PRODUCT</th>
            <th>SKU</th>
            <th>PRICE</th>
            <th>STOCK</th>
            <th>STATUS</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <div className="product-icon"><Package size={20} /></div>
                  <span style={{ fontWeight: 500 }}>{product.name}</span>
                </div>
              </td>
              <td><span className="sku-badge">{product.sku}</span></td>
              <td style={{ fontWeight: 600 }}>${Number(product.price).toLocaleString()}</td>
              <td className={product.stock_quantity > 10 ? 'stock-high' : 'stock-low'}>
                {product.stock_quantity} Units
              </td>
              <td>
                <span style={{ 
                  color: product.stock_quantity > 0 ? '#10b981' : '#ef4444',
                  backgroundColor: product.stock_quantity > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px'
                }}>
                  {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
              <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- Modal (Add Product Form) --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>SKU (Stock Keeping Unit)</label>
                <input type="text" name="sku" className="form-input" value={formData.sku} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Price ($)</label>
                  <input type="number" name="price" className="form-input" value={formData.price} onChange={handleInputChange} min="0" step="0.01" required />
                </div>
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" name="stock_quantity" className="form-input" value={formData.stock_quantity} onChange={handleInputChange} min="0" required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}