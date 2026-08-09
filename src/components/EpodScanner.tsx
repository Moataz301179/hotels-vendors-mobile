/**
 * ePOD Scanner — HOVIN Mobile
 * Hotel dock barcode/QR scanner for Goods Received verification
 *
 * Uses expo-camera/bar-code-scanner to scan delivery packages.
 * Verifies items against purchase order, marks as received,
 * captures damaged goods with photos.
 */

import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import {
  Camera, Barcode, CheckCircle2, AlertTriangle,
  XCircle, Camera as CameraIcon, Package,
} from "lucide-react-native";

// Mock barcode scanner — replace with expo-camera/bar-code-scanner in production
// import { CameraView, useCameraPermissions } from "expo-camera";

interface EpodItem {
  id: string;
  sku: string;
  name: string;
  expectedQty: number;
  receivedQty: number;
  status: "pending" | "received" | "damaged" | "missing";
  scanned?: boolean;
}

interface EpodScannerProps {
  orderId: string;
  orderNumber: string;
  supplierName: string;
  items: EpodItem[];
  onComplete: (items: EpodItem[]) => void;
}

export function EpodScanner({
  orderId,
  orderNumber,
  supplierName,
  items: initialItems,
  onComplete,
}: EpodScannerProps) {
  const [items, setItems] = useState<EpodItem[]>(initialItems);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const receivedCount = items.filter((i) => i.status === "received").length;
  const damagedCount = items.filter((i) => i.status === "damaged").length;

  const handleScan = useCallback((sku: string) => {
    setLastScanned(sku);
    setItems((prev) =>
      prev.map((item) =>
        item.sku === sku && item.status === "pending"
          ? { ...item, status: "received", receivedQty: item.expectedQty, scanned: true }
          : item
      )
    );
    // Auto-close scanner after scan
    setScanning(false);
  }, []);

  const markDamaged = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "damaged" } : item
      )
    );
  }, []);

  const markMissing = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status: "missing" } : item
      )
    );
  }, []);

  const handleSubmit = async () => {
    if (pendingCount > 0) {
      Alert.alert(
        "Incomplete",
        `${pendingCount} item(s) still pending. Submit anyway?`,
        [
          { text: "Continue Scanning", style: "cancel" },
          { text: "Submit", onPress: async () => { setSubmitting(true); onComplete(items); } },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      onComplete(items);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Package size={24} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Goods Received (ePOD)</Text>
          <Text style={styles.headerSubtitle}>
            Order {orderNumber} · {supplierName}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={styles.progressStats}>
          <View style={styles.stat}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={styles.statText}>{receivedCount} received</Text>
          </View>
          <View style={styles.stat}>
            <AlertTriangle size={14} color="var(--orange-base)" />
            <Text style={styles.statText}>{damagedCount} damaged</Text>
          </View>
          <View style={styles.stat}>
            <Barcode size={14} color={colors.textMuted} />
            <Text style={styles.statText}>{pendingCount} pending</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${items.length > 0 ? ((receivedCount + damagedCount) / items.length) * 100 : 0}%` },
            ]}
          />
        </View>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={[styles.scanBtn, scanning && styles.scanBtnActive]}
        onPress={() => setScanning(true)}
        activeOpacity={0.8}
      >
        <Camera size={20} color={scanning ? colors.bg : colors.text} />
        <Text style={[styles.scanBtnText, scanning && styles.scanBtnTextActive]}>
          {scanning ? "Scanning... (tap to close)" : "Scan Package Barcode"}
        </Text>
      </TouchableOpacity>

      {/* Mock scan input for development (remove when expo-camera is wired) */}
      {scanning && (
        <View style={styles.mockScan}>
          <Text style={styles.mockScanLabel}>Enter SKU to simulate scan:</Text>
          <View style={styles.mockScanInputs}>
            {items.filter((i) => i.status === "pending").slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.mockSkuBtn}
                onPress={() => handleScan(item.sku)}
              >
                <Text style={styles.mockSkuText}>{item.sku}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Item list */}
      <View style={styles.itemList}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.itemRow,
              item.status === "received" && styles.itemReceived,
              item.status === "damaged" && styles.itemDamaged,
              item.status === "missing" && styles.itemMissing,
            ]}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemSku}>{item.sku} · Qty: {item.expectedQty}</Text>
            </View>

            {item.status === "pending" && (
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => markDamaged(item.id)}
                >
                  <XCircle size={18} color="var(--orange-base)" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => markMissing(item.id)}
                >
                  <AlertTriangle size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            {item.status === "received" && (
              <CheckCircle2 size={20} color="#10B981" />
            )}
            {item.status === "damaged" && (
              <AlertTriangle size={20} color="var(--orange-base)" />
            )}
            {item.status === "missing" && (
              <XCircle size={20} color={colors.textMuted} />
            )}
          </View>
        ))}
      </View>

      {/* Last scanned */}
      {lastScanned && (
        <View style={styles.lastScanned}>
          <CheckCircle2 size={14} color="#10B981" />
          <Text style={styles.lastScannedText}>{lastScanned} verified</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color={colors.bg} size="small" />
        ) : (
          <Text style={styles.submitBtnText}>
            {pendingCount > 0
              ? `Submit ePOD (${pendingCount} pending)`
              : "Confirm Goods Received"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressBar: {
    gap: spacing.xs,
  },
  progressStats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderStyle: "dashed",
  },
  scanBtnActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    borderStyle: "solid",
  },
  scanBtnText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  scanBtnTextActive: {
    color: colors.bg,
  },
  mockScan: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  mockScanLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  mockScanInputs: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  mockSkuBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted + "22",
    borderWidth: 1,
    borderColor: colors.primary + "22",
  },
  mockSkuText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontFamily: "monospace",
  },
  itemList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  itemReceived: {
    borderColor: "rgba(16,185,129,0.2)",
    backgroundColor: "rgba(16,185,129,0.04)",
  },
  itemDamaged: {
    borderColor: "rgba(249,115,22,0.2)",
    backgroundColor: "rgba(249,115,22,0.04)",
  },
  itemMissing: {
    borderColor: "rgba(255,255,255,0.04)",
    opacity: 0.5,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
  },
  itemSku: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  lastScanned: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  lastScannedText: {
    ...typography.caption,
    color: "#10B981",
    fontWeight: "600",
  },
  submitBtn: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    ...typography.body,
    color: colors.bg,
    fontWeight: "700",
  },
});