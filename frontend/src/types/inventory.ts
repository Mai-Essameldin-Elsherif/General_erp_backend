// ============================================================================
// STANDARD NESTJS ERP API RESPONSE ENVELOPE
// ============================================================================
export interface ApiResponseMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: ApiResponseMeta;
}

// ============================================================================
// 1. CATEGORIES MODULE TYPES
// ============================================================================
export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  parent_id?: string | null;
  parent?: Category | null;
  subCategories?: Category[];
  sub_categories?: Category[];
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string | null;
  parent_id?: string | null;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
  parent_id?: string | null;
}

// ============================================================================
// 2. PRODUCTS MODULE TYPES
// ============================================================================
export interface ProductStockBreakdown {
  warehouseId: string;
  warehouseName: string;
  qtyOnHand: number;
  qtyReserved: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unitPrice: number;
  unit_price: number;
  costPrice: number;
  cost_price: number;
  reorderLevel: number;
  reorder_level: number;
  categoryId?: string | null;
  category_id?: string | null;
  isActive: boolean;
  is_active: boolean;
  imageUrl?: string | null;
  category?: Category | null;
  currentTotalStock?: number;
  totalReserved?: number;
  stockDeficit?: number;
  stockBreakdown?: ProductStockBreakdown[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string | null;
  category_id?: string | null;
  unitPrice: number;
  unit_price?: number;
  costPrice: number;
  cost_price?: number;
  reorderLevel?: number;
  reorder_level?: number;
  isActive?: boolean;
  imageUrl?: string;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductReorderAlert extends Product {
  currentTotalStock: number;
  stockDeficit: number;
}

// ============================================================================
// 3. WAREHOUSES & STOCK MODULE TYPES
// ============================================================================
export interface Warehouse {
  id: string;
  name: string;
  location?: string | null;
  branchId?: string | null;
  branch_id?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseDto {
  name: string;
  location?: string;
  branchId?: string;
  branch_id?: string;
}

export interface StockLevel {
  id?: string;
  productId: string;
  product_id: string;
  warehouseId: string;
  warehouse_id: string;
  qtyOnHand: number;
  qty_on_hand: number;
  qtyReserved: number;
  qty_reserved: number;
  product_name: string;
  product?: Product;
  warehouse?: Warehouse;
  updatedAt?: string;
}

export type StockMovementType =
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'IN_ADJUSTMENT'
  | 'OUT_ADJUSTMENT'
  | 'PURCHASE_IN'
  | 'SALE_OUT';

export interface StockMovement {
  id: string;
  productId: string;
  product_id?: string;
  warehouseId: string;
  warehouse_id?: string;
  movementType: StockMovementType;
  quantity: number;
  referenceType: string;
  referenceId?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface StockTransferDto {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  quantity: number;
  notes?: string;
}

export interface StockAdjustmentDto {
  warehouseId: string;
  productId: string;
  movementType: 'IN_ADJUSTMENT' | 'OUT_ADJUSTMENT';
  quantity: number;
  notes?: string;
}

export interface StockMovementsQueryParams {
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  movementType?: StockMovementType;
}

// ============================================================================
// 4. PROCUREMENT & VENDORS MODULE TYPES
// ============================================================================
export interface Vendor {
  id: string;
  name: string;
  company_name: string;
  code?: string | null;
  contactName?: string | null;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVendorDto {
  name?: string;
  company_name?: string;
  code?: string;
  contactName?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  isActive?: boolean;
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  productId: string;
  product_id: string;
  quantity: number;
  unitCost: number;
  unit_cost: number;
  subtotal?: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  po_number: string;
  vendorId: string;
  vendor_id: string;
  warehouseId: string;
  warehouse_id: string;
  branchId?: string | null;
  status: PurchaseOrderStatus;
  totalCost: number;
  total_cost: number;
  expectedDeliveryDate?: string | null;
  notes?: string | null;
  vendor?: Vendor;
  warehouse?: Warehouse;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePurchaseOrderItemDto {
  productId: string;
  product_id?: string;
  quantity: number;
  unitCost: number;
  unit_cost?: number;
}

export interface CreatePurchaseOrderDto {
  vendorId: string;
  vendor_id?: string;
  warehouseId: string;
  warehouse_id?: string;
  branchId?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemDto[];
}

export interface UpdatePoStatusDto {
  status: PurchaseOrderStatus;
  notes?: string;
}

export interface PurchaseOrderQueryParams {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus;
  vendorId?: string;
  warehouseId?: string;
}
