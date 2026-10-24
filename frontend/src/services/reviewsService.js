const STORAGE_KEY = 'erp_reviews_items';

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    productName: 'Dell PowerEdge R750 Server',
    customerName: 'Ahmed Mohamed',
    company: 'Vodafone Enterprise',
    rating: 5,
    title: 'Outstanding Performance & High Availability',
    comment: 'Deployed as primary virtualization host. Zero downtime across 6 months of continuous operation.',
    date: '2026-10-18',
    verified: true
  },
  {
    id: 'rev-2',
    productName: 'Cisco Catalyst 9300 48P PoE+',
    customerName: 'Michael Chen',
    company: 'Financial Operations Hub',
    rating: 5,
    title: 'Flawless Layer 3 Routing & PoE Reliability',
    comment: 'Powers our entire VoIP system and WiFi 6 access points with flawless throughput.',
    date: '2026-10-19',
    verified: true
  },
  {
    id: 'rev-3',
    productName: 'Steelcase Gesture Ergonomic Chair',
    customerName: 'Mariam Hassan',
    company: 'Headquarters Operations',
    rating: 5,
    title: 'Superior Ergonomics for Engineering Teams',
    comment: 'Exceptional lumbar support and build quality. Drastically improved developer comfort.',
    date: '2026-10-20',
    verified: true
  },
  {
    id: 'rev-4',
    productName: 'Fortinet FortiGate 100F Firewall',
    customerName: 'James Wilson',
    company: 'Enterprise Security Lead',
    rating: 4,
    title: 'Solid Threat Prevention & Intuitive Management',
    comment: 'Great SSL inspection and SD-WAN capabilities. Setup was seamless across regional branch offices.',
    date: '2026-10-22',
    verified: true
  }
];

export const reviewsService = {
  getAll: async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_REVIEWS));
    return DEFAULT_REVIEWS;
  },

  add: async (review) => {
    const list = await reviewsService.getAll();
    const newReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      verified: true
    };
    const updated = [newReview, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  remove: async (id) => {
    const list = await reviewsService.getAll();
    const updated = list.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};

export default reviewsService;
