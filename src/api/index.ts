/**
 * HotelsVendors API Client
 * Points to the VPS backend
 */

import axios, { type AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import { getClerkToken } from "./clerk-token";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.hotelsvendors.com";

const contractUnavailable = (operation: string): Promise<AxiosResponse> =>
  Promise.reject(new Error(`${operation} is not available in the verified /api/v1 contract.`));

const api = axios.create({
  // The maintained backend exposes the authenticated contract under /api/v1.
  // There is no /api/v2 route tree in the release source; keeping this prefix
  // explicit prevents mobile from silently targeting a non-existent API.
  baseURL: `${API_BASE}/api/v1`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

async function productList(params?: Record<string, string>) {
  const response = await api.get("/products", { params });
  const payload = response.data?.data;
  // /products returns { data: { data: Product[], pagination } } while the
  // mobile screens consume the list directly. Normalize only this transport
  // envelope; never synthesize product rows.
  response.data = {
    ...response.data,
    data: Array.isArray(payload) ? payload : (payload?.data ?? payload?.products ?? []),
  };
  return response;
}

// Clerk is the source of truth for native sessions. The SecureStore fallback
// remains only for legacy screens until they are migrated to Clerk flows.
api.interceptors.request.use(async (config) => {
  const token = (await getClerkToken()) || await SecureStore.getItemAsync("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Map HTTP status codes to friendly user-facing messages.
const statusMessages: Record<number, string> = {
  400: "Something wasn't entered correctly. Please check your details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "This couldn't be found. It may have been removed.",
  409: "This action conflicts with the current state. Please refresh and try again.",
  422: "Something wasn't entered correctly. Please check your details and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again in a moment.",
  502: "Our server is temporarily unavailable. Please try again shortly.",
  503: "Our service is briefly down for maintenance. Please try again soon.",
};

// Extract the backend's structured error message when present.
function backendErrorMessage(error: any): string | null {
  const data = error?.response?.data;
  if (!data) return null;
  if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  return null;
}

// Normalize a rejected axios error into one with a friendly user-facing message.
function friendlyError(error: any): any {
  if (!error?.response) {
    // Network / timeout / no response.
    if (error?.code === "ECONNABORTED") {
      error.message = "The request took too long. Please check your connection and try again.";
    } else if (!error?.request) {
      error.message = error?.message || "Something went wrong. Please try again.";
    } else {
      error.message = "Can't reach the server. Please check your internet connection.";
    }
    return error;
  }
  const status = error.response.status;
  const backend = backendErrorMessage(error);
  if (backend && status !== 401 && status !== 403) {
    // Prefer the backend's specific message (validation, rate-limit text, etc.).
    error.message = backend;
  } else {
    error.message = statusMessages[status] || `Something went wrong (${status}). Please try again.`;
  }
  return error;
}

// Clerk refreshes sessions through its provider. Do not attempt the retired
// custom JWT refresh flow against the v2 API.
api.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(friendlyError(error))
);

export default api;

// ─── Auth ────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  role: string;
  password: string;
  phone: string;
  otpCode: string;
  email?: string;
}

export const authAPI = {
  // Sign-in is handled by Clerk in the native UI. These methods are retained
  // only for callers still being migrated and must not be used for new flows.
  login: (identifier: string, password: string) =>
    Promise.reject(new Error("Use Clerk sign-in for native authentication.")),
  register: (data: RegisterPayload) =>
    Promise.reject(new Error("Use Clerk sign-up for native authentication.")),
  me: () => api.get("/auth/me"),
  logout: () => Promise.resolve({ data: { success: true } }),
  refreshToken: (refreshToken: string) =>
    Promise.reject(new Error("Custom JWT refresh is retired; Clerk refreshes the session.")),
  sendOtp: (phone: string, email?: string, purpose?: string) =>
    Promise.reject(new Error("Use Clerk verification for native authentication.")),
  verifyOtp: (phone: string, code: string) =>
    Promise.reject(new Error("Use Clerk verification for native authentication.")),
  otpLogin: (phone: string, code: string) =>
    Promise.reject(new Error("Use Clerk verification for native authentication.")),
};

// ─── Hotel Buyer ─────────────────────────────────────
export const hotelAPI = {
  catalog: (params?: Record<string, string>) =>
    api.get("/hotel/catalog", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/hotel/orders", { params }),
  spend: () => api.get("/hotel/spend"),
  credit: () => api.get("/hotel/credit"),
  cashflow: () => api.get("/hotel/cashflow"),
  financing: () => api.get("/hotel/financing"),
  scheduledOrders: () => api.get("/hotel/scheduled-orders"),
  updateScheduledOrder: (_id: string, _data: Record<string, unknown>) =>
    contractUnavailable("Scheduled-order updates"),
  reconciliations: () => api.get("/hotel/inventory/reconciliations"),
};

// ─── Supplier ────────────────────────────────────────
export const supplierAPI = {
  inventory: (params?: Record<string, string>) =>
    productList(params),
  orders: (params?: Record<string, string>) =>
    api.get("/supplier/orders", { params }),
  dashboard: (params?: Record<string, string>) =>
    api.get("/supplier/dashboard", { params }),
  order: (id: string) => api.get(`/orders/${id}`),
  grns: (params?: Record<string, string>) => api.get("/grn", { params }),
  onboard: (_data: Record<string, unknown>) => contractUnavailable("Supplier onboarding mutation"),
  aiUpload: (_products: Array<Record<string, unknown>>) => contractUnavailable("AI catalog upload"),
  catalogImport: (_file: any) => contractUnavailable("Supplier catalog import"),
  catalogImportTemplate: () => contractUnavailable("Supplier catalog import template"),
};

// ─── Products ────────────────────────────────────────
export const productAPI = {
  list: (params?: Record<string, string>) => productList(params),
  get: (id: string) => api.get(`/products/${id}`),
};

// ─── Orders ──────────────────────────────────────────
export const orderAPI = {
  create: (data: Record<string, unknown>) =>
    api.post("/orders", data),
  get: (id: string) => api.get(`/orders/${id}`),
  list: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  approve: (id: string) => api.post(`/orders/${id}/approve`, { action: "APPROVED" }),
  reject: (id: string, reason: string) =>
    api.post(`/orders/${id}/reject`, { reason }),
  status: (id: string) => api.get(`/orders/${id}/status`),
};

// ─── Invoices ────────────────────────────────────────
export const invoiceAPI = {
  list: (params?: Record<string, string>) => api.get("/invoices", { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
};

// ─── Payments ────────────────────────────────────────
export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  description?: string;
  referenceType: "SUBSCRIPTION" | "DOCUMENT_FEE" | "MARKETPLACE_COMMISSION" | "ORDER_DEPOSIT";
  referenceId?: string;
}

export interface PaymentIntentResponse {
  paymentId: string;
  paymentKey: string;
  paymentUrl: string | null;
  paymobOrderId: number | string;
  amount: number;
  currency: string;
  status: string;
  message: string;
}

export const paymentAPI = {
  createIntent: (data: PaymentIntentRequest) => api.post("/payments/create-intent", data),
};

// ─── AI Assistant ────────────────────────────────────
export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
}

export const aiAPI = {
  ask: (payload: {
    messages: AiMessage[];
    question: string;
    role: string;
    conversationId?: string;
    hotelId?: string;
  }) => api.post("/ai/assistant", payload, { responseType: "text" }),
};

// ─── Oliv Finance (Supplier Factoring) ──────────────
export const olivAPI = {
   onboardSupplier: (_data: Record<string, unknown>) => contractUnavailable("Oliv supplier onboarding"),
   initiateFactoring: (_data: Record<string, unknown>) => contractUnavailable("Oliv factoring initiation"),
   getKycStatus: () => contractUnavailable("Oliv KYC status"),
 };

// ─── Onboarding ─────────────────────────────────────
export const onboardingAPI = {
  getProgress: () => api.get("/onboarding/progress"),
  updateStep: (_stepKey: string, _completed: boolean, _data?: Record<string, unknown>) =>
    api.post("/onboarding/progress", { stepKey: _stepKey, completed: _completed, data: _data }),
};

// ─── Fintech (Credit Facility + Factoring) ────────────
export const fintechAPI = {
  getCreditFacility: () => api.get("/funding"),
  getFactoringHistory: () => api.get("/funding"),
  getFactoringInvoices: () => api.get("/funding"),
  getCreditLines: () => api.get("/funding"),
  marketplaceOffers: () => api.get("/funders"),
  inquireFactoring: (_invoiceId: string) => contractUnavailable("Factoring inquiry"),
  triggerFunding: (_invoiceId: string, _partnerId: string) => contractUnavailable("Factoring funding trigger"),
};

// ─── HOVIN Field Layer (live inbound orders, dock GRN, logistics, 48h cash-out) ──
// Field = execution on the ground: dispatcher/supplier receives live POs,
// scans goods at the dock (GRN + auto credit-note), tracks deliveries/GPS/POD,
// and requests early 48h payout on approved invoices (reverse factoring).
export const fieldAPI = {
  // Live order inbox feed
  liveOrders: (params?: Record<string, string>) =>
    api.get("/field/orders/live", { params }),
  // One-tap status shift on a live PO (READY / IN_TRANSIT / DELIVERED)
  shiftStatus: (orderId: string, status: string) =>
    api.post(`/field/orders/${orderId}/status`, { status }),

  // Dock scanner → GRN from a scanned barcode + auto credit-note generation
  scanForGrn: (data: Record<string, unknown>) => api.post("/grn/scan", data),
  createCreditNote: (data: Record<string, unknown>) => api.post("/grn/credit-note", data),

  // Logistics + GPS tracking + POD
  logistics: (params?: Record<string, string>) => api.get("/logistics/shipments", { params }),
  trackOrder: (orderId: string) => api.get(`/logistics/shipments/${orderId}`),
  reportPosition: (_data: Record<string, unknown>) => contractUnavailable("Shipment position report"),

  // 48h early cash-out (reverse factoring on approved orders)
  cashOutEligible: (params?: Record<string, string>) => api.get("/fintech/cashout/eligible", { params }),
  cashOutRequest: (data: Record<string, unknown>) => api.post("/fintech/cashout", data),
};

// ─── Notifications ─────────────────────────────────
export interface ServerNotification {
  id: string;
  type: string;
  subject: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationAPI = {
  list: (_params?: { unreadOnly?: boolean; type?: string }) => contractUnavailable("Notifications"),
  markRead: (_id?: string) => contractUnavailable("Notification updates"),
  registerPushToken: (token: string, platform: string) => api.post("/notifications/push-token", { token, platform }),
};
