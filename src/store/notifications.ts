/**
 * Notification Store — Zustand
 * Manages in-app notifications list + push permission state.
 * Syncs with the backend so order events (approve/ship/deliver) appear here.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { notificationAPI, type ServerNotification } from "../api";

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  category: "order" | "invoice" | "payment" | "system" | "factoring";
  read: boolean;
  createdAt: string;
  orderId?: string;
  invoiceId?: string;
}

function mapServer(n: ServerNotification): InAppNotification {
  const raw = n.type.toLowerCase();
  const category: InAppNotification["category"] = raw.includes("invoice")
    ? "invoice"
    : raw.includes("payment") || raw.includes("pay")
      ? "payment"
      : raw.includes("order")
        ? "order"
        : raw.includes("oliv") || raw.includes("kyc") || raw.includes("factoring")
          ? "factoring"
          : "system";
  return {
    id: n.id,
    title: n.subject,
    body: n.body ?? "",
    category,
    read: !!n.readAt,
    createdAt: n.createdAt,
  };
}

interface NotificationState {
  notifications: InAppNotification[];
  unreadCount: number;
  hasPermission: boolean | null;

  setPermission: (granted: boolean) => void;
  addNotification: (n: Omit<InAppNotification, "id" | "createdAt" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: (notifications: InAppNotification[]) => Promise<void>;
  syncFromServer: () => Promise<void>;
  registerPushToken: (token: string, platform: string) => Promise<void>;
}

function computeUnread(notifications: InAppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  hasPermission: null,

  setPermission: (granted: boolean) => set({ hasPermission: granted }),

  addNotification: (n) =>
    set((state) => {
      const newNotif: InAppNotification = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const notifications = [newNotif, ...state.notifications];
      get().saveToStorage(notifications);
      return { notifications, unreadCount: computeUnread(notifications) };
    }),

  markRead: (id: string) => {
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      get().saveToStorage(notifications);
      return { notifications, unreadCount: computeUnread(notifications) };
    });
    // Best-effort server sync
    notificationAPI.markRead(id).catch(() => {});
  },

  markAllRead: () => {
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
      get().saveToStorage(notifications);
      return { notifications, unreadCount: 0 };
    });
    notificationAPI.markRead().catch(() => {});
  },

  clearAll: () =>
    set(() => {
      get().saveToStorage([]);
      return { notifications: [], unreadCount: 0 };
    }),

  loadFromStorage: async () => {
    try {
      const raw = await SecureStore.getItemAsync("invo_notifications");
      if (raw) {
        const notifications: InAppNotification[] = JSON.parse(raw);
        set({ notifications, unreadCount: computeUnread(notifications) });
      }
    } catch {
      set({ notifications: [], unreadCount: 0 });
    }
  },

  saveToStorage: async (notifications: InAppNotification[]) => {
    try {
      await SecureStore.setItemAsync("invo_notifications", JSON.stringify(notifications));
    } catch {}
  },

  syncFromServer: async () => {
    try {
      const { data } = await notificationAPI.list();
      if (data?.success && data?.data) {
        const mapped = (data.data.notifications as ServerNotification[]).map(mapServer);
        // Merge: server is source of truth, but keep local-only items too
        const merged = [...mapped];
        get().saveToStorage(merged);
        set({
          notifications: merged,
          unreadCount: data.data.unreadCount ?? computeUnread(merged),
        });
      }
    } catch {
      // fall back to local storage on network failure
      await get().loadFromStorage();
    }
  },

  registerPushToken: async (token: string, platform: string) => {
    try {
      await notificationAPI.registerPushToken(token, platform);
    } catch {
      // non-fatal; token registration is best-effort
    }
  },
}));
