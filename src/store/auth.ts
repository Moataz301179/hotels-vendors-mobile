/**
 * Auth Store — Zustand
 * Manages JWT tokens, user state, role selection
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../api";
import type { User, UserRole } from "../types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setRole: (role: UserRole) => void;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(email, password);
      if (data.success && data.data) {
        const { accessToken, refreshToken, user } = data.data;
        await SecureStore.setItemAsync("access_token", accessToken);
        if (refreshToken) await SecureStore.setItemAsync("refresh_token", refreshToken);
        set({ user, role: user.role as UserRole, isAuthenticated: true, isLoading: false });
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
        set({ user, role: user.role as UserRole, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
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
        set({ user: data.data, role: data.data.role as UserRole, isAuthenticated: true });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  setRole: (role: UserRole) => set({ role }),

  restoreSession: async () => {
    set({ isLoading: true });
    const token = await SecureStore.getItemAsync("access_token");
    if (token) {
      await get().loadUser();
    }
    set({ isLoading: false });
  },
}));
