/**
 * Notification Store — Zustand
 * Manages in-app notifications list + push permission state.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

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

  markRead: (id: string) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      get().saveToStorage(notifications);
      return { notifications, unreadCount: computeUnread(notifications) };
    }),

  markAllRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
      get().saveToStorage(notifications);
      return { notifications, unreadCount: 0 };
    }),

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
}));
