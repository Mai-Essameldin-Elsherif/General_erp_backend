import axiosInstance from './axiosInstance';
import type {
  ApiResponse,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
  ProductReorderAlert,
  Warehouse,
  CreateWarehouseDto,
  StockLevel,
  StockTransferDto,
  StockAdjustmentDto,
  StockMovement,
  StockMovementsQueryParams,
  Vendor,
  CreateVendorDto,
  UpdateVendorDto,
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePoStatusDto,
  PurchaseOrderQueryParams,
} from '../types/inventory';

// Normalizers to ensure both camelCase & snake_case properties are always available
export const normalizeCategory = (cat: Category): Category => {
  const subs = (cat.subCategories ?? cat.sub_categories ?? []).map(normalizeCategory);
  return {
    ...cat,
    parentId: cat.parentId ?? cat.parent_id ?? null,
    parent_id: cat.parentId ?? cat.parent_id ?? null,
    subCategories: subs,
    sub_categories: subs,
  };
};

export const normalizeProduct = (p: Product): Product => ({
  ...p,
  unitPrice: Number(p.unitPrice ?? p.unit_price ?? 0),
  unit_price: Number(p.unitPrice ?? p.unit_price ?? 0),
  costPrice: Number(p.costPrice ?? p.cost_price ?? 0),
  cost_price: Number(p.costPrice ?? p.cost_price ?? 0),
  reorderLevel: Number(p.reorderLevel ?? p.reorder_level ?? 0),
  reorder_level: Number(p.reorderLevel ?? p.reorder_level ?? 0),
  categoryId: p.categoryId ?? p.category_id ?? null,
  category_id: p.categoryId ?? p.category_id ?? null,
  isActive: p.isActive ?? p.is_active ?? true,
  is_active: p.isActive ?? p.is_active ?? true,
});

export const normalizeVendor = (v: Vendor): Vendor => ({
  ...v,
  name: v.name ?? v.company_name ?? '',
  company_name: v.company_name ?? v.name ?? '',
  contactName: v.contactName ?? v.contact_name ?? '',
  contact_name: v.contact_name ?? v.contactName ?? '',
});

export const normalizePurchaseOrder = (po: PurchaseOrder): PurchaseOrder => ({
  ...po,
  poNumber: po.poNumber ?? po.po_number ?? '',
  po_number: po.po_number ?? po.poNumber ?? '',
  vendorId: po.vendorId ?? po.vendor_id ?? '',
  vendor_id: po.vendor_id ?? po.vendorId ?? '',
  warehouseId: po.warehouseId ?? po.warehouse_id ?? '',
  warehouse_id: po.warehouse_id ?? po.warehouseId ?? '',
  totalCost: Number(po.totalCost ?? po.total_cost ?? 0),
  total_cost: Number(po.total_cost ?? po.totalCost ?? 0),
  vendor: po.vendor ? normalizeVendor(po.vendor) : undefined,
  items: (po.items || []).map((item) => ({
    ...item,
    productId: item.productId ?? item.product_id ?? '',
    product_id: item.product_id ?? item.productId ?? '',
    quantity: Number(item.quantity ?? 0),
    unitCost: Number(item.unitCost ?? item.unit_cost ?? 0),
    unit_cost: Number(item.unit_cost ?? item.unitCost ?? 0),
    subtotal: Number(
      item.subtotal ??
        Number(item.quantity ?? 0) * Number(item.unitCost ?? item.unit_cost ?? 0),
    ),
  })),
});

export const inventoryApi = {
  // ==========================================================================
  // A. CATEGORIES MODULE ENDPOINTS (5 Endpoints)
  // ==========================================================================

  // 1. GET /categories -> Tree structure of categories with sub-categories
  async getCategoriesTree(): Promise<Category[]> {
    const res = await axiosInstance.get<ApiResponse<Category[]>>('/categories');
    return (res.data.data || []).map(normalizeCategory);
  },

  // 2. GET /categories/:id -> Category details with associated products
  async getCategoryById(id: string): Promise<Category> {
    const res = await axiosInstance.get<ApiResponse<Category>>(`/categories/${id}`);
    return normalizeCategory(res.data.data);
  },

  // 3. POST /categories -> Create category
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const parentIdVal = dto.parentId ?? dto.parent_id;
    const payload: Record<string, unknown> = {
      name: dto.name.trim(),
    };
    if (parentIdVal) {
      payload.parentId = parentIdVal;
    }
    const res = await axiosInstance.post<ApiResponse<Category>>('/categories', payload);
    return normalizeCategory(res.data.data);
  },

  // 4. PATCH /categories/:id -> Update category name or parentId
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.parentId !== undefined || dto.parent_id !== undefined) {
      payload.parentId = dto.parentId ?? dto.parent_id ?? null;
    }
    const res = await axiosInstance.patch<ApiResponse<Category>>(
      `/categories/${id}`,
      payload,
    );
    return normalizeCategory(res.data.data);
  },

  // 5. DELETE /categories/:id -> Soft/Hard delete category
  async deleteCategory(
    id: string,
    hard: boolean = false,
  ): Promise<{ id: string; deleted: boolean }> {
    const res = await axiosInstance.delete<
      ApiResponse<{ id: string; deleted: boolean }>
    >(`/categories/${id}${hard ? '?hard=true' : ''}`);
    return res.data.data;
  },

  // ==========================================================================
  // B. PRODUCTS MODULE ENDPOINTS (6 Endpoints)
  // ==========================================================================

  // 6. GET /products -> Pagination, Search, Filtering by categoryId & isActive
  async getProducts(params?: ProductQueryParams): Promise<{
    items: Product[];
    meta: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search) queryParams.search = params.search;
    if (params?.categoryId) queryParams.categoryId = params.categoryId;
    if (params?.isActive !== undefined) queryParams.isActive = params.isActive;

    const res = await axiosInstance.get<ApiResponse<Product[]>>('/products', {
      params: queryParams,
    });
    const items = (res.data.data || []).map(normalizeProduct);

    return {
      items,
      meta: res.data.meta || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalItems: items.length,
        totalPages: 1,
      },
    };
  },

  // 7. GET /products/alerts/reorder-level -> Products where total stock <= reorder_level
  async getProductReorderAlerts(): Promise<ProductReorderAlert[]> {
    const res = await axiosInstance.get<ApiResponse<ProductReorderAlert[]>>(
      '/products/alerts/reorder-level',
    );
    return (res.data.data || []).map((p) => ({
      ...normalizeProduct(p),
      currentTotalStock: Number(p.currentTotalStock ?? 0),
      stockDeficit: Number(p.stockDeficit ?? 0),
    }));
  },

  // 8. GET /products/:id -> Product details with categories and stock breakdown per warehouse
  async getProductById(id: string): Promise<Product> {
    const res = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);
    return normalizeProduct(res.data.data);
  },

  // 9. POST /products -> Create product
  async createProduct(dto: CreateProductDto): Promise<Product> {
    const categoryIdVal = dto.categoryId ?? dto.category_id;
    const payload: Record<string, unknown> = {
      sku: dto.sku.trim(),
      name: dto.name.trim(),
      unitPrice: Number(dto.unitPrice ?? dto.unit_price ?? 0),
      costPrice: Number(dto.costPrice ?? dto.cost_price ?? 0),
      reorderLevel: Number(dto.reorderLevel ?? dto.reorder_level ?? 0),
      isActive: dto.isActive ?? true,
    };
    if (dto.barcode?.trim()) payload.barcode = dto.barcode.trim();
    if (dto.description?.trim()) payload.description = dto.description.trim();
    if (categoryIdVal) payload.categoryId = categoryIdVal;
    if (dto.imageUrl?.trim()) payload.imageUrl = dto.imageUrl.trim();

    const res = await axiosInstance.post<ApiResponse<Product>>('/products', payload);
    return normalizeProduct(res.data.data);
  },

  // 10. PATCH /products/:id -> Update product details or prices
  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const payload: Record<string, unknown> = {};
    if (dto.sku !== undefined) payload.sku = dto.sku.trim();
    if (dto.barcode !== undefined) payload.barcode = dto.barcode.trim() || undefined;
    if (dto.name !== undefined) payload.name = dto.name.trim();
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.categoryId !== undefined || dto.category_id !== undefined) {
      payload.categoryId = dto.categoryId ?? dto.category_id ?? null;
    }
    if (dto.unitPrice !== undefined || dto.unit_price !== undefined) {
      payload.unitPrice = Number(dto.unitPrice ?? dto.unit_price ?? 0);
    }
    if (dto.costPrice !== undefined || dto.cost_price !== undefined) {
      payload.costPrice = Number(dto.costPrice ?? dto.cost_price ?? 0);
    }
    if (dto.reorderLevel !== undefined || dto.reorder_level !== undefined) {
      payload.reorderLevel = Number(dto.reorderLevel ?? dto.reorder_level ?? 0);
    }
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;
    if (dto.imageUrl !== undefined) payload.imageUrl = dto.imageUrl;

    const res = await axiosInstance.patch<ApiResponse<Product>>(
      `/products/${id}`,
      payload,
    );
    return normalizeProduct(res.data.data);
  },

  // 11. DELETE /products/:id -> Deactivate or hard delete product
  async deleteProduct(
    id: string,
    hard: boolean = false,
  ): Promise<{ id: string; deactivated?: boolean; deleted?: boolean }> {
    const res = await axiosInstance.delete<
      ApiResponse<{ id: string; deactivated?: boolean; deleted?: boolean }>
    >(`/products/${id}${hard ? '?hard=true' : ''}`);
    return res.data.data;
  },

  // ==========================================================================
  // C. WAREHOUSES & STOCK MODULE ENDPOINTS (6 Endpoints)
  // ==========================================================================

  // 12. GET /warehouses -> List warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    const res = await axiosInstance.get<ApiResponse<Warehouse[]>>('/warehouses');
    return (res.data.data || []).map((w) => ({
      ...w,
      branchId: w.branchId ?? w.branch_id ?? null,
      branch_id: w.branchId ?? w.branch_id ?? null,
    }));
  },

  // 13. POST /warehouses -> Create warehouse
  async createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
    const payload: Record<string, unknown> = {
      name: dto.name.trim(),
    };
    if (dto.location?.trim()) payload.location = dto.location.trim();
    if (dto.branchId || dto.branch_id) {
      payload.branchId = dto.branchId ?? dto.branch_id;
    }
    const res = await axiosInstance.post<ApiResponse<Warehouse>>('/warehouses', payload);
    return {
      ...res.data.data,
      branchId: res.data.data.branchId ?? res.data.data.branch_id ?? null,
      branch_id: res.data.data.branchId ?? res.data.data.branch_id ?? null,
    };
  },

  // 14. GET /warehouses/:id/stock -> List stock levels for products in specific warehouse
  async getWarehouseStock(warehouseId: string): Promise<StockLevel[]> {
    const res = await axiosInstance.get<ApiResponse<StockLevel[]>>(
      `/warehouses/${warehouseId}/stock`,
    );
    return (res.data.data || []).map((sl) => ({
      ...sl,
      productId: sl.productId ?? sl.product_id,
      product_id: sl.productId ?? sl.product_id,
      warehouseId: sl.warehouseId ?? sl.warehouse_id ?? warehouseId,
      warehouse_id: sl.warehouseId ?? sl.warehouse_id ?? warehouseId,
      qtyOnHand: Number(sl.qtyOnHand ?? sl.qty_on_hand ?? 0),
      qty_on_hand: Number(sl.qtyOnHand ?? sl.qty_on_hand ?? 0),
      qtyReserved: Number(sl.qtyReserved ?? sl.qty_reserved ?? 0),
      qty_reserved: Number(sl.qtyReserved ?? sl.qty_reserved ?? 0),
      product_name: sl.product_name ?? sl.product?.name ?? 'Unknown Product',
    }));
  },

  // 15. POST /warehouses/stock/transfer -> Atomic stock transfer between warehouses
  async transferStock(dto: StockTransferDto): Promise<{
    message: string;
    transferOut: StockMovement;
    transferIn: StockMovement;
  }> {
    const payload = {
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      productId: dto.productId,
      quantity: Number(dto.quantity),
      notes: dto.notes?.trim() || undefined,
    };
    const res = await axiosInstance.post<
      ApiResponse<{
        message: string;
        transferOut: StockMovement;
        transferIn: StockMovement;
      }>
    >('/warehouses/stock/transfer', payload);
    return res.data.data;
  },

  // 16. POST /warehouses/stock/movements -> Direct stock adjustment log
  async adjustStock(dto: StockAdjustmentDto): Promise<{
    message: string;
    stockLevel: StockLevel;
    movement: StockMovement;
  }> {
    const payload = {
      warehouseId: dto.warehouseId,
      productId: dto.productId,
      movementType: dto.movementType,
      quantity: Number(dto.quantity),
      notes: dto.notes?.trim() || undefined,
    };
    const res = await axiosInstance.post<
      ApiResponse<{
        message: string;
        stockLevel: StockLevel;
        movement: StockMovement;
      }>
    >('/warehouses/stock/movements', payload);
    return res.data.data;
  },

  // 17. GET /warehouses/stock/movements -> Audit movement logs list
  async getStockMovements(params?: StockMovementsQueryParams): Promise<{
    items: StockMovement[];
    meta: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const res = await axiosInstance.get<ApiResponse<StockMovement[]>>(
      '/warehouses/stock/movements',
      { params },
    );
    return {
      items: res.data.data || [],
      meta: res.data.meta || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        totalItems: (res.data.data || []).length,
        totalPages: 1,
      },
    };
  },

  // ==========================================================================
  // D. PROCUREMENT & VENDORS MODULE ENDPOINTS (6+ Endpoints)
  // ==========================================================================

  // 18. GET /procurement/vendors -> List vendors
  async getVendors(): Promise<Vendor[]> {
    const res = await axiosInstance.get<ApiResponse<Vendor[]>>('/procurement/vendors');
    return (res.data.data || []).map(normalizeVendor);
  },

  // 19. POST /procurement/vendors -> Create vendor
  async createVendor(dto: CreateVendorDto): Promise<Vendor> {
    const payload: Record<string, unknown> = {
      name: (dto.company_name ?? dto.name ?? '').trim(),
    };
    if (dto.code?.trim()) payload.code = dto.code.trim();
    if (dto.contact_name?.trim() || dto.contactName?.trim()) {
      payload.contactName = (dto.contact_name ?? dto.contactName)?.trim();
    }
    if (dto.email?.trim()) payload.email = dto.email.trim();
    if (dto.phone?.trim()) payload.phone = dto.phone.trim();
    if (dto.address?.trim()) payload.address = dto.address.trim();
    if (dto.taxNumber?.trim()) payload.taxNumber = dto.taxNumber.trim();

    const res = await axiosInstance.post<ApiResponse<Vendor>>(
      '/procurement/vendors',
      payload,
    );
    return normalizeVendor(res.data.data);
  },

  // 19b. PATCH /procurement/vendors/:id -> Update vendor
  async updateVendor(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const payload: Record<string, unknown> = {};
    if (dto.company_name !== undefined || dto.name !== undefined) {
      payload.name = (dto.company_name ?? dto.name)?.trim();
    }
    if (dto.code !== undefined) payload.code = dto.code.trim() || undefined;
    if (dto.contact_name !== undefined || dto.contactName !== undefined) {
      payload.contactName = (dto.contact_name ?? dto.contactName)?.trim() || undefined;
    }
    if (dto.email !== undefined) payload.email = dto.email.trim() || undefined;
    if (dto.phone !== undefined) payload.phone = dto.phone.trim() || undefined;
    if (dto.address !== undefined) payload.address = dto.address.trim() || undefined;
    if (dto.taxNumber !== undefined) {
      payload.taxNumber = dto.taxNumber.trim() || undefined;
    }
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    const res = await axiosInstance.patch<ApiResponse<Vendor>>(
      `/procurement/vendors/${id}`,
      payload,
    );
    return normalizeVendor(res.data.data);
  },

  // 19c. DELETE /procurement/vendors/:id -> Delete vendor
  async deleteVendor(id: string): Promise<{ id: string; deleted: boolean }> {
    const res = await axiosInstance.delete<
      ApiResponse<{ id: string; deleted: boolean }>
    >(`/procurement/vendors/${id}`);
    return res.data.data;
  },

  // 20. GET /procurement/purchase-orders -> List POs with status filters
  async getPurchaseOrders(params?: PurchaseOrderQueryParams): Promise<{
    items: PurchaseOrder[];
    meta: { page: number; limit: number; totalItems: number; totalPages: number };
  }> {
    const res = await axiosInstance.get<ApiResponse<PurchaseOrder[]>>(
      '/procurement/purchase-orders',
      { params },
    );
    const items = (res.data.data || []).map(normalizePurchaseOrder);
    return {
      items,
      meta: res.data.meta || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalItems: items.length,
        totalPages: 1,
      },
    };
  },

  // 21. GET /procurement/purchase-orders/:id -> Fetch PO with items array and vendor info
  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    const res = await axiosInstance.get<ApiResponse<PurchaseOrder>>(
      `/procurement/purchase-orders/${id}`,
    );
    return normalizePurchaseOrder(res.data.data);
  },

  // 22. POST /procurement/purchase-orders -> Create PO + PO Items, auto-calculating total_cost
  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const payload = {
      vendorId: dto.vendorId ?? dto.vendor_id,
      warehouseId: dto.warehouseId ?? dto.warehouse_id,
      branchId: dto.branchId || undefined,
      expectedDeliveryDate: dto.expectedDeliveryDate || undefined,
      notes: dto.notes?.trim() || undefined,
      items: dto.items.map((item) => ({
        productId: item.productId ?? item.product_id,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost ?? item.unit_cost ?? 0),
      })),
    };
    const res = await axiosInstance.post<ApiResponse<PurchaseOrder>>(
      '/procurement/purchase-orders',
      payload,
    );
    return normalizePurchaseOrder(res.data.data);
  },

  // 23. PATCH /procurement/purchase-orders/:id/status -> Update PO status ('COMPLETED' / 'RECEIVED' / 'APPROVED')
  async updatePurchaseOrderStatus(
    id: string,
    dto: UpdatePoStatusDto,
  ): Promise<PurchaseOrder> {
    const payload = {
      status: dto.status,
      notes: dto.notes?.trim() || undefined,
    };
    const res = await axiosInstance.patch<ApiResponse<PurchaseOrder>>(
      `/procurement/purchase-orders/${id}/status`,
      payload,
    );
    return normalizePurchaseOrder(res.data.data);
  },
};

export default inventoryApi;
