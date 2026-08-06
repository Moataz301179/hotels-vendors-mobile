/**
 * Auth Store — Zustand
 * Manages JWT tokens, user state, role selection
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authAPI, type RegisterPayload } from "../api";
import type { User, UserRole } from "../types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  otpLogin: (phone: string, code: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// Backend returns the org role (e.g. "OWNER") in `role` and the platform
// entry point (e.g. "SUPPLIER"/"HOTEL") in `platformRole`. Routing is driven
// by platformRole.
function platformRoleOf(user: User): UserRole {
  return (user.platformRole ?? user.role) as UserRole;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (identifier: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(identifier, password);
      if (data.success && data.data) {
        const { accessToken, refreshToken, user } = data.data;
        await SecureStore.setItemAsync("access_token", accessToken);
        if (refreshToken) await SecureStore.setItemAsync("refresh_token", refreshToken);
        set({ user, role: platformRoleOf(user), isAuthenticated: true, isLoading: false });
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (regData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(regData);
      if (data.success && data.data) {
        const { accessToken, refreshToken, user } = data.data;
        await SecureStore.setItemAsync("access_token", accessToken);
        if (refreshToken) await SecureStore.setItemAsync("refresh_token", refreshToken);
        set({ user, role: platformRoleOf(user), isAuthenticated: true, isLoading: false });
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  otpLogin: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.otpLogin(phone, code);
      if (data.success && data.data) {
        const { accessToken, refreshToken, user } = data.data;
        await SecureStore.setItemAsync("access_token", accessToken);
        if (refreshToken) await SecureStore.setItemAsync("refresh_token", refreshToken);
        set({ user, role: platformRoleOf(user), isAuthenticated: true, isLoading: false });
      } else {
        throw new Error(data.error || "Sign-in failed");
      }
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  sendOtp: async (phone: string) => {
    const { data } = await authAPI.sendOtp(phone);
    if (!data.success) throw new Error(data.error || "Could not send code");
  },

  logout: async () => {
    try { await authAPI.logout(); } catch {}
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    set({ user: null, role: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const { data } = await authAPI.me();
      if (data.success && data.data) {
        set({ user: data.data, role: platformRoleOf(data.data), isAuthenticated: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync("access_token");
      if (token) {
        await get().loadUser();
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
