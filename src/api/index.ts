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
    return Promise.reject(error);
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
  sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
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
