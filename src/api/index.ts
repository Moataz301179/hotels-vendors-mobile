/**
 * HotelsVendors API Client
 * Points to the VPS backend
 */

import axios, { type AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import { getClerkToken } from "./clerk-token";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.hotelsvendors.com";

const v2Unavailable = (operation: string): Promise<AxiosResponse> =>
  Promise.reject(new Error(`${operation} is not available in the verified /api/v2 contract.`));

const api = axios.create({
  baseURL: `${API_BASE}/api/v2`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

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
  me: () => api.get("/me"),
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
    api.get("/marketplace", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  spend: () => api.get("/dashboard"),
  credit: () => api.get("/funding"),
  cashflow: () => api.get("/funding"),
  financing: () => api.get("/funding"),
  scheduledOrders: () => api.get("/orders"),
  updateScheduledOrder: (_id: string, _data: Record<string, unknown>) =>
    v2Unavailable("Scheduled-order updates"),
  reconciliations: () => v2Unavailable("Inventory reconciliation"),
};

// ─── Supplier ────────────────────────────────────────
export const supplierAPI = {
  inventory: (params?: Record<string, string>) =>
    api.get("/catalog", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  dashboard: (params?: Record<string, string>) =>
    api.get("/dashboard", { params }),
  order: (_id: string) => v2Unavailable("Supplier order detail"),
  grns: (_params?: Record<string, string>) => v2Unavailable("GRN listing"),
  onboard: (data: Record<string, unknown>) => api.post("/onboarding", data),
  aiUpload: (_products: Array<Record<string, unknown>>) => v2Unavailable("AI catalog upload"),
  catalogImport: (_file: any) => v2Unavailable("Supplier catalog import"),
  catalogImportTemplate: () => v2Unavailable("Supplier catalog import template"),
};

// ─── Products ────────────────────────────────────────
export const productAPI = {
  list: (params?: Record<string, string>) =>
    api.get("/marketplace", { params }),
  get: (_id: string) => v2Unavailable("Product detail"),
};

// ─── Orders ──────────────────────────────────────────
export const orderAPI = {
  create: (data: Record<string, unknown>) =>
    api.post("/orders", data),
  get: (_id: string) => v2Unavailable("Order detail"),
  list: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  approve: (id: string) => api.patch("/orders", { id, status: "APPROVED" }),
  reject: (id: string, reason: string) =>
    api.patch("/orders", { id, status: "REJECTED", reason }),
  status: (_id: string) => v2Unavailable("Order status detail"),
};

// ─── Invoices ────────────────────────────────────────
export const invoiceAPI = {
  list: (_params?: Record<string, string>) => v2Unavailable("Invoice listing"),
  get: (_id: string) => v2Unavailable("Invoice detail"),
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
  createIntent: (_data: PaymentIntentRequest) => v2Unavailable("Payment intent creation"),
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
  }) => api.post("/assistant", payload),
};

// ─── Oliv Finance (Supplier Factoring) ──────────────
export const olivAPI = {
   onboardSupplier: (_data: Record<string, unknown>) => v2Unavailable("Oliv supplier onboarding"),
   initiateFactoring: (_data: Record<string, unknown>) => v2Unavailable("Oliv factoring initiation"),
   getKycStatus: () => v2Unavailable("Oliv KYC status"),
 };

// ─── Onboarding ─────────────────────────────────────
export const onboardingAPI = {
  getProgress: () => api.get("/onboarding"),
  updateStep: (_stepKey: string, _completed: boolean, _data?: Record<string, unknown>) =>
    v2Unavailable("Onboarding step updates"),
};

// ─── Fintech (Credit Facility + Factoring) ────────────
export const fintechAPI = {
  getCreditFacility: () => api.get("/funding"),
  getFactoringHistory: () => api.get("/funding"),
  getFactoringInvoices: () => api.get("/funding"),
  getCreditLines: () => api.get("/funding"),
  marketplaceOffers: () => api.get("/funders"),
  inquireFactoring: (_invoiceId: string) => v2Unavailable("Factoring inquiry"),
  triggerFunding: (_invoiceId: string, _partnerId: string) => v2Unavailable("Factoring funding trigger"),
};

// ─── HOVIN Field Layer (live inbound orders, dock GRN, logistics, 48h cash-out) ──
// Field = execution on the ground: dispatcher/supplier receives live POs,
// scans goods at the dock (GRN + auto credit-note), tracks deliveries/GPS/POD,
// and requests early 48h payout on approved invoices (reverse factoring).
export const fieldAPI = {
  // Live order inbox feed
  liveOrders: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  // One-tap status shift on a live PO (READY / IN_TRANSIT / DELIVERED)
  shiftStatus: (orderId: string, status: string) =>
    api.patch("/orders", { id: orderId, status }),

  // Dock scanner → GRN from a scanned barcode + auto credit-note generation
  scanForGrn: (data: Record<string, unknown>) => api.post("/grn", data),
  createCreditNote: (_data: Record<string, unknown>) => v2Unavailable("Credit-note creation"),

  // Logistics + GPS tracking + POD
  logistics: (params?: Record<string, string>) => api.get("/shipments", { params }),
  trackOrder: (orderId: string) => api.get("/shipments", { params: { orderId } }),
  reportPosition: (_data: Record<string, unknown>) => v2Unavailable("Shipment position report"),

  // 48h early cash-out (reverse factoring on approved orders)
  cashOutEligible: (_params?: Record<string, string>) => v2Unavailable("Cash-out eligibility"),
  cashOutRequest: (_data: Record<string, unknown>) => v2Unavailable("Cash-out request"),
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
  list: (_params?: { unreadOnly?: boolean; type?: string }) => v2Unavailable("Notifications"),
  markRead: (_id?: string) => v2Unavailable("Notification updates"),
  registerPushToken: (_token: string, _platform: string) => v2Unavailable("Push-token registration"),
};
