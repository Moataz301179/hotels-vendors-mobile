import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert,
  Linking,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { paymentAPI } from "@/api";
import * as WebBrowser from "expo-web-browser";
import { WebBrowserPresentationStyle } from "expo-web-browser";
import { useAuthStore } from "@/store/auth";
import { fmtMoney } from "@/utils/format";

export default function PaymentScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  const { invoiceId, amount, currency, invoiceNumber } = route.params;

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  const createIntent = useCallback(async () => {
    const email = user?.email || "";
    const phone = user?.phone || "";
    const nameParts = (user?.name || "Guest").split(" ");
    const firstName = nameParts[0] || "Guest";
    const lastName = nameParts.slice(1).join(" ") || "User";

    setLoading(true);
    try {
      const { data } = await paymentAPI.createIntent({
        amount,
        currency,
        email,
        firstName,
        lastName,
        phone: phone || email,
        description: invoiceNumber ? `Invoice ${invoiceNumber}` : "Invoice payment",
        referenceType: "ORDER_DEPOSIT",
        referenceId: invoiceId,
      });

      if (data.success && data.data) {
        setPaymentData(data.data);
      } else {
        Alert.alert("Error", data.error || "Could not create payment intent");
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Payment initialization failed");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [invoiceId, amount, currency, invoiceNumber, user, navigation]);

  useEffect(() => {
    createIntent();

    const unsubscribe = Linking.addEventListener("url", (event: any) => {
      if (event.url.includes("payment-success")) {
        Alert.alert("Payment Successful", "Your payment has been processed.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else if (event.url.includes("payment-cancel")) {
        Alert.alert("Payment Cancelled", "The payment was not completed.");
        navigation.goBack();
      }
    });

    return () => unsubscribe.remove();
  }, [createIntent, navigation]);

  const openPaymentUrl = async () => {
    if (!paymentData?.paymentUrl) return;
    await WebBrowser.openBrowserAsync(paymentData.paymentUrl, {
      presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
      enableBarCollapsing: true,
      toolbarColor: colors.bg,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing payment…</Text>
      </View>
    );
  }

  if (!paymentData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Payment could not be initialized.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Complete Your Payment</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{fmtMoney(paymentData.amount)} {paymentData.currency}</Text>
        </View>

        {paymentData.message ? (
          <Text style={styles.message}>{paymentData.message}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.payButton}
          onPress={openPaymentUrl}
          activeOpacity={0.8}
        >
          <Text style={styles.payButtonText}>Open Payment Page</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  center: { justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xxl,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xl, textAlign: "center" },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  amountLabel: { ...typography.body, color: colors.textSecondary },
  amountValue: { ...typography.h3, color: colors.primary, fontWeight: "600" },
  message: { ...typography.bodySmall, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg },
  payButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  payButtonText: { color: colors.bg, ...typography.body, fontWeight: "600" },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: { color: colors.textMuted, ...typography.bodySmall },
  loadingText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.md },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  backLink: { color: colors.primary, ...typography.bodySmall },
});
