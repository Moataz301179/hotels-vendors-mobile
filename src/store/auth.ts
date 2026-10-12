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
  authError: string | null;

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
  // Start in sync mode so an already-active Clerk session cannot briefly
  // render a second sign-in/sign-up surface before AppContent hydrates it.
  isLoading: true,
  isAuthenticated: false,
  authError: null,

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
      // The active /api/v2/me contract returns { user }, while older API
      // releases returned { success, data }. Accept both, but never infer a
      // signed-in app identity from the Clerk token alone.
      const userData = data?.user ?? data?.data?.user ?? data?.data;
      const platformRole = userData?.platformRole ?? userData?.role;
      const allowedRoles: UserRole[] = ["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"];
      if (
        !userData?.id ||
        !userData?.email ||
        !userData?.tenantId ||
        !allowedRoles.includes(platformRole)
      ) {
        throw new Error("The account profile response is incomplete or unsupported.");
      }

      const user = {
        ...userData,
        role: userData.role ?? platformRole,
        platformRole,
      } as User;
      set({ user, role: platformRoleOf(user), isAuthenticated: true, authError: null });
    } catch (error: any) {
      // Keep Clerk's session intact while the backend finishes provisioning.
      // The navigator can now show the actionable backend error instead of a
      // permanent, unexplained workspace deadlock.
      set({ user: null, role: null, isAuthenticated: false, authError: error?.message || "Workspace setup is still being finalized." });
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
      set({ user: null, role: null, isAuthenticated: false, isLoading: false, authError: null });
      return;
    }
    set({ isLoading: true });
    // SSO session activation and token minting are asynchronous. Retry the
    // tenant profile fetch briefly instead of dropping the user back at login
    // while Clerk is still propagating the new session.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await get().loadUser();
      if (get().isAuthenticated) break;
      if (attempt < 7) await new Promise((resolve) => setTimeout(resolve, Math.min(500 * 2 ** attempt, 4000)));
    }
    set({ isLoading: false });
  },
}));
