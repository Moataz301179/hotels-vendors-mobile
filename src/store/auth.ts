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
  sendOtp: (phone: string, email?: string, purpose?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  restoreSession: () => Promise<void>;
  syncClerkSession: (isLoaded: boolean, isSignedIn: boolean) => Promise<void>;
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
    void identifier;
    void password;
    set({ isLoading: false });
    throw new Error("Use Clerk sign-in for native authentication.");
  },

  register: async (regData) => {
    void regData;
    set({ isLoading: false });
    throw new Error("Use Clerk sign-up for native authentication.");
  },

  otpLogin: async (phone: string, code: string) => {
    void phone;
    void code;
    set({ isLoading: false });
    throw new Error("Use Clerk verification for native authentication.");
  },

  sendOtp: async (phone: string, email?: string, purpose: string = "REGISTER") => {
    void phone;
    void email;
    void purpose;
    throw new Error("Use Clerk verification for native authentication.");
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
    // Clerk owns session restoration. App.tsx calls syncClerkSession after
    // Clerk has finished loading so we never infer auth from stale JWT state.
    set({ isLoading: false });
  },

  syncClerkSession: async (isLoaded: boolean, isSignedIn: boolean) => {
    if (!isLoaded) {
      set({ isLoading: true });
      return;
    }
    if (!isSignedIn) {
      set({ user: null, role: null, isAuthenticated: false, isLoading: false });
      return;
    }
    set({ isLoading: true });
    await get().loadUser();
    set({ isLoading: false });
  },
}));
