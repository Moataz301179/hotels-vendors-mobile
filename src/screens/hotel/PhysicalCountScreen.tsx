/**
 * Camera-assisted physical counting.
 *
 * The camera identifies a permitted inventory item only. A person must choose
 * the observed whole quantity and submit it. Submission creates a pending
 * review record; it never changes stock in the app or on the server.
 */
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { AlertTriangle, Camera, CheckCircle2, Minus, PackageSearch, Plus, RefreshCw, ScanLine, ShieldCheck } from "lucide-react-native";

import { inventoryCountAPI, type CountableProduct } from "@/api";
import { colors, radii, spacing, typography } from "@/theme";

type Candidate = { product: CountableProduct; barcode: string };

function newSubmissionId() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) throw new Error("This device cannot create the secure submission identifier required for a count.");
  const bytes = new Uint8Array(16);
  cryptoApi.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function messageFrom(error: unknown) {
  const response = (error as { response?: { data?: { error?: string } } })?.response;
  return response?.data?.error || (error instanceof Error ? error.message : "The count could not be recorded.");
}

export default function PhysicalCountScreen() {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { startHostedAuth } = useHostedAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [observedQuantity, setObservedQuantity] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setCandidate(null);
    setObservedQuantity(null);
    setSaved(false);
    setScanning(true);
  };

  const lookup = async (barcode: string) => {
    if (!scanning || loading || candidate) return;
    setScanning(false);
    setLoading(true);
    try {
      const { data } = await inventoryCountAPI.lookupBarcode(barcode);
      setCandidate({ product: data.product, barcode: data.barcode });
    } catch (error) {
      Alert.alert("Item not ready for a count", messageFrom(error));
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const adjust = (delta: number) => {
    setObservedQuantity((current) => Math.max(0, (current ?? 0) + delta));
  };

  const submit = async () => {
    if (!candidate || observedQuantity === null || loading) return;
    setLoading(true);
    try {
      await inventoryCountAPI.submit({
        productId: candidate.product.id,
        clientSubmissionId: newSubmissionId(),
        observedQuantity,
        barcode: candidate.barcode,
        capturedAt: new Date().toISOString(),
      });
      setSaved(true);
    } catch (error) {
      Alert.alert("Count not recorded", messageFrom(error));
    } finally {
      setLoading(false);
    }
  };

  const signInForCount = async () => {
    try {
      await startHostedAuth({ mode: "sign-in" });
    } catch {
      Alert.alert("Sign-in did not finish", "Complete sign-in with your HotelsVendors work account, then try again.");
    }
  };

  if (!isClerkLoaded) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.noticeText}>Checking your secure work session…</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.noticeCard}>
          <ShieldCheck size={40} color={colors.primary} />
          <Text style={styles.noticeTitle}>Secure work sign-in required</Text>
          <Text style={styles.noticeText}>Physical counts are available only to authorized HotelsVendors staff. The camera will remain off until sign-in is complete.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={signInForCount}>
            <Text style={styles.primaryButtonText}>Sign in securely</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!permission?.granted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.noticeCard}>
          <Camera size={40} color={colors.warning} />
          <Text style={styles.noticeTitle}>Camera access is required</Text>
          <Text style={styles.noticeText}>Camera scanning prevents a count from being recorded against an unverified item. There is no manual barcode entry.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant camera access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (saved && candidate) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.successCard}>
          <CheckCircle2 size={48} color={colors.success} />
          <Text style={styles.successTitle}>Count recorded for review</Text>
          <Text style={styles.noticeText}>{candidate.product.name}: {observedQuantity} {candidate.product.unitOfMeasure}</Text>
          <Text style={styles.mutedText}>The quantity has not changed stock. An authorized reconciliation review is required.</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={reset}>
          <ScanLine size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Scan next item</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (candidate) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.identificationCard}>
          <PackageSearch size={24} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.itemName}>{candidate.product.name}</Text>
            <Text style={styles.mutedText}>{candidate.product.sku} · {candidate.product.unitOfMeasure}</Text>
          </View>
        </View>
        <View style={styles.controlCard}>
          <ShieldCheck size={22} color={colors.primary} />
          <Text style={styles.controlTitle}>Confirm the observed quantity</Text>
          <Text style={styles.noticeText}>The scan did not count this item. Use the controls only after physically counting it.</Text>
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepButton} onPress={() => adjust(-1)} disabled={observedQuantity === null || observedQuantity === 0}>
              <Minus size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.quantityBox}>
              <Text style={styles.quantityValue}>{observedQuantity === null ? "—" : observedQuantity}</Text>
              <Text style={styles.mutedText}>{candidate.product.unitOfMeasure}</Text>
            </View>
            <TouchableOpacity style={styles.stepButton} onPress={() => adjust(1)}>
              <Plus size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.zeroButton} onPress={() => setObservedQuantity(0)}>
            <Text style={styles.zeroButtonText}>Set confirmed zero</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.primaryButton, observedQuantity === null && styles.disabledButton]} onPress={submit} disabled={observedQuantity === null || loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <ShieldCheck size={18} color="#fff" />}
          <Text style={styles.primaryButtonText}>Record count for review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={reset} disabled={loading}>
          <RefreshCw size={18} color={colors.text} />
          <Text style={styles.secondaryButtonText}>Scan a different item</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "itf14", "upc_a", "upc_e"] }}
        onBarcodeScanned={({ data }) => lookup(data)}
      />
      <View style={styles.cameraOverlay}>
        <View style={styles.scanFrame} />
        {loading ? <ActivityIndicator size="large" color="#fff" /> : <Text style={styles.cameraText}>Scan the item barcode to identify it</Text>}
        <Text style={styles.cameraSubtext}>No stock quantity is displayed or changed by a scan.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  centeredState: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  cameraOverlay: { ...StyleSheet.absoluteFill, justifyContent: "center", alignItems: "center", gap: spacing.md, padding: spacing.xl },
  scanFrame: { width: 248, height: 248, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.primary, backgroundColor: "rgba(255,255,255,0.04)" },
  cameraText: { ...typography.body, color: "#fff", fontWeight: "700", textAlign: "center" },
  cameraSubtext: { ...typography.bodySmall, color: "#fff", opacity: 0.86, textAlign: "center" },
  noticeCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: spacing.md },
  noticeTitle: { ...typography.h3, color: colors.text, textAlign: "center" },
  noticeText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  mutedText: { ...typography.bodySmall, color: colors.textMuted },
  identificationCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  flex: { flex: 1 },
  itemName: { ...typography.h3, color: colors.text },
  controlCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  controlTitle: { ...typography.h3, color: colors.text, textAlign: "center" },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  stepButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  quantityBox: { minWidth: 112, alignItems: "center" },
  quantityValue: { ...typography.h1, color: colors.text },
  zeroButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  zeroButtonText: { ...typography.bodySmall, color: colors.primary, fontWeight: "700" },
  primaryButton: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.body, color: "#fff", fontWeight: "700" },
  disabledButton: { opacity: 0.45 },
  secondaryButton: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.body, color: colors.text, fontWeight: "600" },
  successCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.success + "66" },
  successTitle: { ...typography.h2, color: colors.text, textAlign: "center" },
});
