/**
 * POD (Proof of Delivery) Screen — Photo + signature capture for delivery confirmation
 */

import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput,
} from "react-native";
import { Camera, CheckCircle, XCircle, FileText } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface PODData {
  stopId: string;
  hotelName: string;
  orderNumber: string;
  itemCount: number;
  orderTotal: number;
}

export default function PODScreen({ route, navigation }: any) {
  const { stopId, tripId } = route.params;
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [delivered, setDelivered] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to capture proof of delivery.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const submitPOD = async () => {
    if (!photo) {
      Alert.alert("Photo Required", "Please take a photo of the delivered goods.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/shipping/pod", {
        tripStopId: stopId,
        photoUrl: photo,
        signatureName: signature,
        notes,
        status: "DELIVERED",
      });
      setDelivered(true);
      setTimeout(() => navigation.goBack(), 2000);
    } catch (err) {
      Alert.alert("Error", "Failed to submit proof of delivery. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (delivered) {
    return (
      <View style={styles.successContainer}>
        <CheckCircle size={64} color={colors.success} />
        <Text style={styles.successTitle}>Delivery Confirmed!</Text>
        <Text style={styles.successText}>Proof of delivery has been submitted.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Photo Section */}
      <Text style={styles.sectionTitle}>Delivery Photo</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
        {photo ? (
          <View style={styles.photoPreview}>
            <CheckCircle size={24} color={colors.success} />
            <Text style={styles.photoText}>Photo captured</Text>
            <Text style={styles.photoSubtext}>Tap to retake</Text>
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Camera size={32} color={colors.textMuted} />
            <Text style={styles.photoText}>Take Photo</Text>
            <Text style={styles.photoSubtext}>Capture the delivered goods</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Recipient Name */}
      <Text style={styles.sectionTitle}>Received By</Text>
      <TextInput
        style={styles.input}
        placeholder="Name of person who received the delivery"
        placeholderTextColor={colors.textMuted}
        value={signature}
        onChangeText={setSignature}
      />

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any issues, damage, or special notes..."
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (!photo || submitting) && styles.submitBtnDisabled]}
        onPress={submitPOD}
        disabled={!photo || submitting}
      >
        {submitting ? (
          <Text style={styles.submitText}>Submitting...</Text>
        ) : (
          <>
            <CheckCircle size={18} color="#fff" />
            <Text style={styles.submitText}>Confirm Delivery</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Failed Delivery */}
      <TouchableOpacity
        style={styles.failedBtn}
        onPress={() => {
          Alert.alert(
            "Mark as Failed",
            "Why couldn't this delivery be completed?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "No One Present",
                onPress: async () => {
                  await api.post("/shipping/pod", { tripStopId: stopId, status: "FAILED", notes: "No one present at delivery location" });
                  navigation.goBack();
                },
              },
              {
                text: "Wrong Address",
                onPress: async () => {
                  await api.post("/shipping/pod", { tripStopId: stopId, status: "FAILED", notes: "Wrong address - unable to locate" });
                  navigation.goBack();
                },
              },
              {
                text: "Order Refused",
                onPress: async () => {
                  await api.post("/shipping/pod", { tripStopId: stopId, status: "FAILED", notes: "Recipient refused delivery" });
                  navigation.goBack();
                },
              },
            ]
          );
        }}
      >
        <XCircle size={16} color={colors.error} />
        <Text style={styles.failedText}>Mark as Failed</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  photoBtn: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, overflow: "hidden" },
  photoPreview: { padding: spacing.xxl, alignItems: "center", backgroundColor: colors.success + "10" },
  photoPlaceholder: { padding: spacing.xxl, alignItems: "center" },
  photoText: { ...typography.body, color: colors.text, fontWeight: "600", marginTop: spacing.md },
  photoSubtext: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  input: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, color: colors.text, ...typography.body },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: radii.md, marginTop: spacing.xl },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { ...typography.body, color: "#fff", fontWeight: "600" },
  failedBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.error + "10", paddingVertical: spacing.md, borderRadius: radii.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.error + "30" },
  failedText: { ...typography.body, color: colors.error, fontWeight: "600" },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg, padding: spacing.xxl },
  successTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg },
  successText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
