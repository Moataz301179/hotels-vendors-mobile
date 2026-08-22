/**
 * HotelsVendors API Client
 * Points to the VPS backend
 */

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE = "https://www.hotelsvendors.com";

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from secure storage
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("access_token");
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

// Handle 401 → try refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
            refreshToken,
          });
          if (data.success && data.data?.accessToken) {
            await SecureStore.setItemAsync("access_token", data.data.accessToken);
            if (data.data.refreshToken) {
              await SecureStore.setItemAsync("refresh_token", data.data.refreshToken);
            }
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }
        }
      } catch {
        await SecureStore.deleteItemAsync("access_token");
        await SecureStore.deleteItemAsync("refresh_token");
      }
    }
    return Promise.reject(friendlyError(error));
  }
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
  login: (identifier: string, password: string) =>
    api.post("/auth/login", { identifier, password }),
  register: (data: RegisterPayload) =>
    api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
  sendOtp: (phone: string, email?: string, purpose?: string) =>
    api.post("/auth/send-otp", { phone, email, purpose }),
  verifyOtp: (phone: string, code: string) =>
    api.post("/auth/verify-otp", { phone, code }),
  otpLogin: (phone: string, code: string) =>
    api.post("/auth/otp-login", { phone, code }),
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
  updateScheduledOrder: (id: string, data: Record<string, unknown>) =>
    api.patch(`/hotel/scheduled-orders/${id}`, data),
  reconciliations: () => api.get("/hotel/inventory/reconciliations"),
};

// ─── Supplier ────────────────────────────────────────
export const supplierAPI = {
  inventory: (params?: Record<string, string>) =>
    api.get("/supplier/inventory", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/supplier/orders", { params }),
  dashboard: (params?: Record<string, string>) =>
    api.get("/supplier/dashboard", { params }),
  order: (id: string) => api.get(`/orders/${id}`),
  grns: (params?: Record<string, string>) =>
    api.get("/grn", { params }),
  onboard: (data: Record<string, unknown>) =>
    api.post("/supplier/onboard", data),
  aiUpload: (products: Array<Record<string, unknown>>) =>
    api.post("/supplier/ai-upload", { products }),
  catalogImport: (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/supplier/catalog/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  catalogImportTemplate: () =>
    api.get("/supplier/catalog/import?template=true", {
      responseType: "arraybuffer",
    }),
};

// ─── Products ────────────────────────────────────────
export const productAPI = {
  list: (params?: Record<string, string>) =>
    api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
};

// ─── Orders ──────────────────────────────────────────
export const orderAPI = {
  create: (data: Record<string, unknown>) =>
    api.post("/orders", data),
  get: (id: string) => api.get(`/orders/${id}`),
  list: (params?: Record<string, string>) =>
    api.get("/orders", { params }),
  approve: (id: string) => api.post(`/orders/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/orders/${id}/reject`, { reason }),
  status: (id: string) => api.get(`/orders/${id}/status`),
};

// ─── Invoices ────────────────────────────────────────
export const invoiceAPI = {
  list: (params?: Record<string, string>) =>
    api.get("/invoices", { params }),
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
  createIntent: (data: PaymentIntentRequest) =>
    api.post("/payments/create-intent", data),
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
  }) => api.post("/ai/assistant", payload, {
    responseType: "stream",
  }),
};

// ─── Oliv Finance (Supplier Factoring) ──────────────
export const olivAPI = {
   onboardSupplier: (data: Record<string, unknown>) =>
     api.post("/oliv/onboard-supplier", data),
   initiateFactoring: (data: Record<string, unknown>) =>
     api.post("/oliv/initiate-factoring", data),
   getKycStatus: () => api.get("/oliv/kyc-status"),
 };

// ─── Onboarding ─────────────────────────────────────
export const onboardingAPI = {
  getProgress: () => api.get("/onboarding/progress"),
  updateStep: (stepKey: string, completed: boolean, data?: Record<string, unknown>) =>
    api.post("/onboarding/progress", { stepKey, completed, data }),
};

// ─── Fintech (Credit Facility + Factoring) ────────────
export const fintechAPI = {
  getCreditFacility: () => api.get("/fintech/oliv-facility"),
  getFactoringHistory: () => api.get("/factoring/requests"),
  getFactoringInvoices: () => api.get("/factoring/invoices"),
  getCreditLines: () => api.get("/factoring/credit-lines"),
  marketplaceOffers: () => api.get("/factoring/marketplace"),
  inquireFactoring: (invoiceId: string) =>
    api.post("/factoring/inquire", { invoiceId }),
  triggerFunding: (invoiceId: string, partnerId: string) =>
    api.post("/factoring/fund", { invoiceId, partnerId }),
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
  createCreditNote: (data: Record<string, unknown>) =>
    api.post("/grn/credit-note", data),

  // Logistics + GPS tracking + POD
  logistics: (params?: Record<string, string>) =>
    api.get("/logistics/tracking", { params }),
  trackOrder: (orderId: string) => api.get(`/logistics/orders/${orderId}`),
  reportPosition: (data: Record<string, unknown>) =>
    api.post("/logistics/position", data),

  // 48h early cash-out (reverse factoring on approved orders)
  cashOutEligible: (params?: Record<string, string>) =>
    api.get("/fintech/cashout/eligible", { params }),
  cashOutRequest: (data: Record<string, unknown>) =>
    api.post("/fintech/cashout", data),
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
  list: (params?: { unreadOnly?: boolean; type?: string }) =>
    api.get("/notifications", { params }),
  markRead: (id?: string) => api.post("/notifications/read", { id }),
  registerPushToken: (token: string, platform: string) =>
    api.post("/notifications/push-token", { token, platform }),
};
