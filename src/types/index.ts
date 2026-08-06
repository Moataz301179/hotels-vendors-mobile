/**
 * HotelsVendors — TypeScript types for mobile app
 */

export type UserRole = "HOTEL" | "SUPPLIER" | "SHIPPING" | "FACTORING" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  platformRole?: UserRole;
  tenantId: string;
  hotelId?: string | null;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  companyName?: string | null;
  supplier?: {
    id: string;
    name: string;
    legalName?: string | null;
    city?: string | null;
    governorate?: string | null;
    taxId?: string | null;
    status?: string;
    tier?: string;
  } | null;
}

export interface SupplierKpis {
  totalOrders: number;
  pendingOrders: number;
  approvedOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  productsCount: number;
  lowStockCount: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  poNumber?: string | null;
  status: OrderStatus | string;
  total: number;
  currency: string;
  createdAt: string;
  deliveryDate?: string | null;
  hotelName?: string;
  hotelCity?: string;
}

export interface RecentGrn {
  id: string;
  grnNumber: string;
  status: string;
  receivedAt: string;
  orderNumber?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  currency: string;
  unit: string;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  supplierId: string;
  supplierName?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  supplierId: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  hotelName?: string;
  supplierName?: string;
}

export type OrderStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  etaStatus?: string;
  createdAt: string;
  dueDate?: string;
  hotelName?: string;
  supplierName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
