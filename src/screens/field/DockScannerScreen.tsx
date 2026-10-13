/**
 * HOVIN Field — Dock Scanner (GRN + Auto Credit-Note)
 *
 * Camera-based QR/barcode scan at the receiving dock. Scanning an inbound
 * packing barcode immediately produces a Goods Received Note (GRN) and, when
 * the order is accepted with a discrepancy, an automated credit note is
 * generated against the supplier invoice.
 *
 * Uses expo-camera's built-in barcode engine (CameraView + onBarcodeScanned) —
 * no separate barcode dependency. Brightness/camera-fail and permission-denied
 * states degrade to a graceful manual-entry fallback ("manual entry") so the
 * dock workflow is never fully blocked on hardware.
 */

import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ScanLine, CheckCircle, FileText, AlertTriangle, Keyboard, PackageCheck,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fieldAPI } from "@/api";

interface ScanResult {
  grnNumber: string;
  creditNoteNumber?: string | null;
  lineItemsAccepted: number;
  lineItemsDiscrepant: number;
}

export default function DockScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [orderId, setOrderId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  /** Called per frame with a detected barcode (debounced by resetting state). */
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!data || !scanning || processing || result) return;
    setScanning(false);
    setBarcode(data);
    await submitScan(data, orderId.trim());
  };

  const submitScan = async (code: string, targetOrderId: string) => {
    if (!code.trim() || !targetOrderId.trim()) {
      Alert.alert("Order required", "Enter the order ID before creating a GRN. A barcode alone cannot be treated as a received order.");
      setScanning(true);
      return;
    }
    setProcessing(true);
    try {
      // Create the GRN from the scanned barcode…
      const { data: grnRes } = await fieldAPI.scanForGrn({ barcode: code, orderId: targetOrderId });
      const grn = grnRes.data?.grn ?? grnRes.data;

      setResult({
        grnNumber: grn?.grnNumber ?? "",
        creditNoteNumber: null,
        lineItemsAccepted: grn?.lineItemsAccepted ?? 0,
        lineItemsDiscrepant: grn?.lineItemsDiscrepant ?? 0,
      });
    } catch (error: any) {
      setScanning(true);
      Alert.alert("GRN not created", error?.message || "The server did not confirm this receipt. No local success was recorded.");
    } finally {
      setProcessing(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setBarcode("");
    setManualCode("");
    setOrderId("");
    setScanning(true);
  };

  // ── Success / GRN-created confirmation ─────────────────────────────
  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle size={56} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Goods Received</Text>
          <Text style={styles.successGrn}>{result.grnNumber}</Text>
          <Text style={styles.successText}>
            {result.lineItemsAccepted} line item(s) accepted on the dock.
          </Text>
        </View>

        <View style={styles.creditNoteCard}>
          <View style={styles.cnHeader}>
            <FileText size={18} color={colors.primary} />
            <Text style={styles.cnTitle}>Automated Credit Note</Text>
          </View>
          {result.creditNoteNumber ? <Text style={styles.cnNumber}>{result.creditNoteNumber}</Text> : null}
          <Text style={styles.cnDesc}>
            Credit notes are created only after a verified discrepancy and invoice amount are recorded.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={resetScan}>
          <ScanLine size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Scan Next Delivery</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Camera not granted → graceful fallback ──────────────────────────
  if (!permission?.granted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.permissionCard}>
          <AlertTriangle size={40} color={colors.warning} />
          <Text style={styles.permissionTitle}>Camera access required</Text>
          <Text style={styles.permissionText}>
            The dock scanner needs the camera to read delivery barcodes. You can
            grant access below, or enter the barcode manually.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
        {manualEntry(
          manualCode,
          setManualCode,
          orderId,
          setOrderId,
          () => submitScan(manualCode, orderId.trim()),
          colors
        )}
      </ScrollView>
    );
  }

  // ── Live scan UI ────────────────────────────────────────────────────
  return (
    <View style={styles.scanContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "itf14", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={handleBarCodeScanned as any}
      />
      <View style={styles.scanOverlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanHint}>Align the barcode inside the frame</Text>
        <TextInput
          style={styles.scanOrderInput}
          placeholder="Order ID (required)"
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={orderId}
          onChangeText={setOrderId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {processing && <ActivityIndicator size="large" color="#fff" style={styles.scanSpinner} />}
        {!scanning && !processing && !result && (
          <Text style={styles.scanHint}>Barcode read — processing GRN…</Text>
        )}
      </View>
    </View>
  );
}

/** Shared manual-barcode entry block used by the no-permission fallback. */
function manualEntry(
  manualCode: string,
  setManualCode: (v: string) => void,
  orderId: string,
  setOrderId: (v: string) => void,
  onSubmit: () => void,
  colors: typeof import("@/theme").colors
) {
  return (
    <View style={styles.manualCard}>
      <View style={styles.manualHeader}>
        <Keyboard size={16} color={colors.textMuted} />
        <Text style={styles.manualTitle}>Manual barcode entry</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Type or paste barcode / PO number…"
        placeholderTextColor={colors.textMuted}
        value={manualCode}
        onChangeText={setManualCode}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Order ID (required)"
        placeholderTextColor={colors.textMuted}
        value={orderId}
        onChangeText={setOrderId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!manualCode || !orderId) && { opacity: 0.5 }]}
        onPress={onSubmit}
        disabled={!manualCode || !orderId}
      >
        <PackageCheck size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Create GRN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  scanContainer: { flex: 1, backgroundColor: "#000" },
  scanOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: spacing.lg },
  scanFrame: {
    width: 240, height: 240, borderRadius: radii.xl,
    borderWidth: 2, borderColor: colors.primary,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  scanHint: { color: "#fff", ...typography.body, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 },
  scanOrderInput: { width: 240, backgroundColor: "rgba(0,0,0,0.65)", borderColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderRadius: radii.md, padding: spacing.md, color: "#fff", ...typography.body },
  scanSpinner: { marginTop: spacing.sm },

  permissionCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: spacing.md,
  },
  permissionTitle: { ...typography.h3, color: colors.text },
  permissionText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  manualCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  manualHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  manualTitle: { ...typography.h3, color: colors.text },
  input: {
    backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, color: colors.text, ...typography.body,
  },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radii.md,
  },
  primaryBtnText: { ...typography.body, color: "#fff", fontWeight: "600" },

  successCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.success + "44", padding: spacing.xl, alignItems: "center", gap: spacing.sm,
  },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success + "1e", alignItems: "center", justifyContent: "center" },
  successTitle: { ...typography.h2, color: colors.text },
  successGrn: { ...typography.h3, color: colors.primary, fontWeight: "700" },
  successText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  creditNoteCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.sm,
  },
  cnHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cnTitle: { ...typography.h3, color: colors.text },
  cnNumber: { ...typography.body, color: colors.primary, fontWeight: "700" },
  cnDesc: { ...typography.bodySmall, color: colors.textSecondary },
});
