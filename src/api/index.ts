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
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// ─── Hotel Buyer ─────────────────────────────────────
export const hotelAPI = {
  catalog: (params?: Record<string, string>) =>
    api.get("/hotel/catalog", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/hotel/orders", { params }),
  spend: () => api.get("/hotel/spend"),
};

// ─── Supplier ────────────────────────────────────────
export const supplierAPI = {
  inventory: (params?: Record<string, string>) =>
    api.get("/supplier/inventory", { params }),
  orders: (params?: Record<string, string>) =>
    api.get("/supplier/orders", { params }),
  onboard: (data: Record<string, unknown>) =>
    api.post("/supplier/onboard", data),
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
export const paymentAPI = {
  createIntent: (data: Record<string, unknown>) =>
    api.post("/payments/create-intent", data),
};

// ─── AI Assistant ────────────────────────────────────
export const aiAPI = {
  ask: (message: string, role: string) =>
    api.post("/ai/assistant", { message, role }),
};

// ─── Oliv Finance (Supplier Factoring) ──────────────
export const olivAPI = {
  onboardSupplier: (data: Record<string, unknown>) =>
    api.post("/oliv/onboard-supplier", data),
  initiateFactoring: (data: Record<string, unknown>) =>
    api.post("/oliv/initiate-factoring", data),
};

// ─── Fintech (Credit Facility) ──────────────────────
export const fintechAPI = {
  getCreditFacility: () => api.get("/fintech/oliv-facility"),
  getFactoringHistory: () => api.get("/fintech/factoring-history"),
};
