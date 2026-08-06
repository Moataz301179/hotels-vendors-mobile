/**
 * Notification Service
 * Handles push notification permissions, token registration,
 * and incoming notification handling.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Linking, Platform, Alert } from "react-native";
import Constants from "expo-constants";
import { useNotificationStore, type InAppNotification } from "@/store/notifications";
import api from "@/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("Notifications only work on physical devices");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  useNotificationStore.getState().setPermission(finalStatus === "granted");

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permission Required",
      "Enable notifications to receive order updates, invoice reminders, and payment confirmations.",
      [
        { text: "Open Settings", onPress: () => Linking.openSettings() },
        { text: "Not Now", style: "cancel" },
      ]
    );
    return false;
  }

  return true;
}

export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: Constants?.expoConfig?.extra?.eas?.projectId,
  });

  try {
    await api.post("/notifications/push-token", {
      token,
      platform: Platform.OS,
    });
  } catch (e) {
    console.warn("Failed to register push token:", e);
  }

  return token;
}

export function handleIncomingNotification(response: Notifications.NotificationResponse | null) {
  if (response?.notification?.request?.content?.data) {
    const data = response.notification.request.content.data as Record<string, unknown>;
    const store = useNotificationStore.getState();

    store.addNotification({
      title: response.notification.request.content.title || "New Update",
      body: response.notification.request.content.body || "",
      category: (data.category as InAppNotification["category"]) || "system",
      orderId: data.orderId as string | undefined,
      invoiceId: data.invoiceId as string | undefined,
    });
  }
}

export async function initializeNotifications() {
  const granted = await requestNotificationPermission();
  if (granted) {
    await registerPushToken();
  }

  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    handleIncomingNotification(response);
  }

  Notifications.addNotificationResponseReceivedListener(handleIncomingNotification);
}
