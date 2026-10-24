/**
 * Dock scan capture.
 *
 * A camera read is evidence that a code was seen. It is not evidence that a
 * delivery was accepted, so this screen never creates a GRN, a credit note, or
 * an offline success record. Receiving staff must use the controlled receipt
 * workflow to confirm its lines and quantities.
 */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { AlertTriangle, Camera, CheckCircle2, RefreshCw, ScanLine, ShieldCheck } from "lucide-react-native";

import { colors, radii, spacing, typography } from "@/theme";

export default function DockScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [barcode, setBarcode] = useState<string | null>(null);

  const reset = () => {
    setBarcode(null);
    setScanning(true);
  };

  if (!permission?.granted) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Camera size={40} color={colors.warning} />
          <Text style={styles.title}>Camera access is required</Text>
          <Text style={styles.body}>Scanning identifies a delivery code. It never accepts goods or creates a financial document.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant camera access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (barcode) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <CheckCircle2 size={48} color={colors.success} />
          <Text style={styles.title}>Delivery code captured</Text>
          <Text style={styles.barcode}>{barcode}</Text>
          <Text style={styles.body}>No GRN, quantity acceptance, credit note, or inventory adjustment has been created. Continue in the controlled receipt workflow to verify each line.</Text>
        </View>
        <View style={styles.guardrail}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={styles.guardrailText}>A scanned code is not a completed receiving record.</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={reset}>
          <RefreshCw size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>Scan another delivery</Text>
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
        onBarcodeScanned={({ data }) => {
          if (!scanning || !data) return;
          setScanning(false);
          setBarcode(data);
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <ScanLine size={24} color="#fff" />
        <Text style={styles.cameraText}>Scan the delivery barcode</Text>
        <Text style={styles.cameraSubtext}>This captures a code only. It does not receive goods.</Text>
        {!scanning && <ActivityIndicator color="#fff" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  frame: { width: 244, height: 244, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.primary, backgroundColor: "rgba(255,255,255,0.04)" },
  cameraText: { ...typography.body, color: "#fff", fontWeight: "700", textAlign: "center" },
  cameraSubtext: { ...typography.bodySmall, color: "#fff", opacity: 0.86, textAlign: "center" },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: spacing.md },
  title: { ...typography.h2, color: colors.text, textAlign: "center" },
  body: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  barcode: { ...typography.body, color: colors.primary, fontWeight: "700", textAlign: "center" },
  guardrail: { flexDirection: "row", gap: spacing.sm, alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  guardrailText: { flex: 1, ...typography.bodySmall, color: colors.text },
  primaryButton: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.md },
  primaryButtonText: { ...typography.body, color: "#fff", fontWeight: "700" },
});
