/**
 * HotelsVendors — TypeScript types for mobile app
 */

export type UserRole = "HOTEL" | "SUPPLIER" | "LOGISTICS" | "FACTORING" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
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
