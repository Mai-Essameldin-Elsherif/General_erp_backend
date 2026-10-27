import api from '../api/axios';

const STORAGE_KEY = 'erp_wishlist_items';

const DEFAULT_WISHLIST = [
  {
    id: 'w-1',
    productId: 'prod-1',
    sku: 'PRD-SRV-001',
    name: 'Dell PowerEdge R750 Server',
    category: 'Hardware & Servers',
    unitPrice: 5200.00,
    inStock: true,
    stockQty: 25,
    addedAt: '2026-10-20',
    description: 'Dual Xeon 32-core, 128GB RAM, 4TB NVMe SSD Enterprise Rack Server'
  },
  {
    id: 'w-2',
    productId: 'prod-2',
    sku: 'PRD-WS-002',
    name: 'ThinkPad P16 Gen 2 Workstation',
    category: 'Hardware & Servers',
    unitPrice: 2850.00,
    inStock: true,
    stockQty: 18,
    addedAt: '2026-10-21',
    description: 'Core i9, 64GB DDR5, RTX 4080, 2TB SSD Mobile Engineering Workstation'
  },
  {
    id: 'w-3',
    productId: 'prod-3',
    sku: 'PRD-SW-003',
    name: 'Cisco Catalyst 9300 48P PoE+',
    category: 'Networking',
    unitPrice: 2100.00,
    inStock: true,
    stockQty: 12,
    addedAt: '2026-10-22',
    description: '48-Port Gigabit Managed Network Switch with Layer 3 Routing'
  },
  {
    id: 'w-4',
    productId: 'prod-5',
    sku: 'PRD-CHR-005',
    name: 'Steelcase Gesture Ergonomic Chair',
    category: 'Office Furniture',
    unitPrice: 1150.00,
    inStock: true,
    stockQty: 30,
    addedAt: '2026-10-23',
    description: 'Premium executive ergonomic task chair with 3D lumbar support'
  }
];

export const wishlistService = {
  getAll: async () => {
    // Try to fetch products from backend if available
    try {
      const res = await api.get('/api/v1/products');
      const products = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      if (products.length > 0) {
        // Map products into wishlist shape
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (saved.length > 0) return saved;
        return products.slice(0, 4).map((p, idx) => ({
          id: `w-${idx + 1}`,
          productId: p.id,
          sku: p.sku || `SKU-${idx + 1}`,
          name: p.name,
          category: p.category?.name || 'Enterprise Hardware',
          unitPrice: parseFloat(p.unitPrice || p.unit_price || 1200),
          inStock: true,
          stockQty: 20,
          addedAt: new Date().toISOString().split('T')[0],
          description: p.description || ''
        }));
      }
    } catch {
      // Fallback to local storage or defaults
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WISHLIST));
    return DEFAULT_WISHLIST;
  },

  remove: async (id) => {
    const list = await wishlistService.getAll();
    const updated = list.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  add: async (item) => {
    const list = await wishlistService.getAll();
    const newItem = {
      ...item,
      id: `w-${Date.now()}`,
      addedAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};

export default wishlistService;
