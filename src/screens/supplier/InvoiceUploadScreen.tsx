import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { olivAPI } from "@/api";

interface InvoicePreview {
  amount: string;
  supplierName: string;
  uri?: string;
}

export default function InvoiceUploadScreen() {
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [etaUuid, setEtaUuid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length) {
        handleFileSelected(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Could not open file picker");
    }
  };

  const takePhoto = async () => {
    try {
      const ImagePicker = require("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to take a photo");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });
      if (!result.canceled && result.assets?.length) {
        handleFileSelected(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Could not open camera");
    }
  };

  const handleFileSelected = (asset: { uri: string; fileName?: string }) => {
    setUploading(true);
    setPreview({
      amount: "",
      supplierName: "",
      uri: asset.uri,
    });
    setTimeout(() => setUploading(false), 600);
  };

  const handleSubmit = async () => {
    if (!etaUuid.trim()) {
      Alert.alert("Required", "Please enter your ETA tax UUID");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await olivAPI.initiateFactoring({
        invoiceUri: preview?.uri,
        etaUuid: etaUuid.trim(),
        amount: preview?.amount ? parseFloat(preview.amount) : undefined,
        supplierName: preview?.supplierName || undefined,
      });
      if (data.success) {
        Alert.alert("Submitted", "Your invoice has been submitted for financing. You will be notified once approved.", [
          { text: "OK" },
        ]);
        setPreview(null);
        setEtaUuid("");
      } else {
        Alert.alert("Error", data.error || "Submission failed");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.headline}>Upload Invoice for Financing</Text>
      <Text style={styles.subtext}>
        Upload any invoice — not just HotelsVendors orders. Get funded in 48
        hours.
      </Text>

      {!preview ? (
        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={pickFile}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadTitle}>Upload File</Text>
            <Text style={styles.uploadDesc}>PDF or image of your invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={takePhoto}
            activeOpacity={0.7}
          >
            <Text style={styles.uploadIcon}>📸</Text>
            <Text style={styles.uploadTitle}>Take Photo</Text>
            <Text style={styles.uploadDesc}>Photograph checks or invoices</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewSection}>
          {uploading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxxl }} />
          ) : (
            <>
              <Text style={styles.previewHeader}>Invoice Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Invoice Amount (EGP)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 150000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={preview.amount}
                  onChangeText={(t) => setPreview({ ...preview, amount: t })}
                />
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Supplier Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your business name"
                  placeholderTextColor={colors.textMuted}
                  value={preview.supplierName}
                  onChangeText={(t) => setPreview({ ...preview, supplierName: t })}
                />
              </View>
            </>
          )}

          <Text style={styles.etaLabel}>ETA Tax UUID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your ETA tax UUID for same-day approval"
            placeholderTextColor={colors.textMuted}
            value={etaUuid}
            onChangeText={setEtaUuid}
            autoCapitalize="characters"
          />
          <Text style={styles.etaHint}>
            Your ETA UUID is required for same-day approval and compliance
          </Text>

          <TouchableOpacity
            style={[styles.submitBtn, !etaUuid.trim() && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!etaUuid.trim() || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bg} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit for Financing</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setPreview(null);
              setEtaUuid("");
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel & Choose Different File</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  headline: { ...typography.h1, color: colors.text, textAlign: "center" },
  subtext: { ...typography.body, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  uploadOptions: { gap: spacing.md, marginTop: spacing.md },
  uploadCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.sm,
  },
  uploadIcon: { fontSize: 40 },
  uploadTitle: { ...typography.h3, color: colors.text },
  uploadDesc: { ...typography.bodySmall, color: colors.textSecondary },
  previewSection: { gap: spacing.md },
  previewHeader: { ...typography.label, color: colors.primary, textTransform: "uppercase", marginBottom: spacing.xs },
  previewRow: { gap: spacing.sm },
  previewLabel: { ...typography.bodySmall, color: colors.textSecondary },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radii.md,
    padding: spacing.lg,
    color: colors.text,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  etaLabel: { ...typography.label, color: colors.textSecondary, textTransform: "uppercase", marginTop: spacing.sm },
  etaHint: { ...typography.caption, color: colors.textMuted },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...typography.h3, color: colors.bg, fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: spacing.md },
  cancelBtnText: { ...typography.bodySmall, color: colors.textMuted },
});
