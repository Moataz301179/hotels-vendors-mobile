import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useAuth, useHostedAuth } from "@clerk/expo";
import { Camera, CheckCircle2, Minus, Plus, ShieldCheck, UploadCloud, WifiOff, X } from "lucide-react-native";

import { fieldAPI } from "@/api";
import { colors, radii, spacing, typography } from "@/theme";
import {
  createReceiptDraftId, createReceiptDraftLines, receiptDraftStorageKey,
  summarizeReceiptLine, validateReceiptDraft,
} from "@/receiving/receiptDraft";
import type { LocalReceiptDraft, ReceiptLineDraft, ReceiptOrder } from "@/receiving/receiptDraft";

const MAX_EVIDENCE_PHOTOS = 8;

function messageFrom(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { error?: string } } })?.response;
  if (response?.status === 401) return "Sign in with your HotelsVendors work account, then try again.";
  if (response?.status === 403) return "Your account is not authorized to receive this purchase order.";
  if (response?.status === 404) return "This purchase order is not available in your hotel workspace.";
  if (response?.status === 409) return "This purchase order is no longer in a receivable state. Refresh the order list.";
  return response?.data?.error || (error instanceof Error ? error.message : "The receipt could not be loaded.");
}

export default function ControlledReceiptScreen({ route }: any) {
  const orderId = route?.params?.orderId as string | undefined;
  const { isLoaded: isClerkLoaded, isSignedIn, userId } = useAuth({ treatPendingAsSignedOut: false });
  const { startHostedAuth } = useHostedAuth();
  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [lines, setLines] = useState<ReceiptLineDraft[]>([]);
  const [evidenceUris, setEvidenceUris] = useState<string[]>([]);
  const [localDraft, setLocalDraft] = useState<LocalReceiptDraft | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const storageKey = useMemo(
    () => userId && orderId ? receiptDraftStorageKey(userId, orderId) : null,
    [userId, orderId],
  );

  const loadContext = useCallback(async () => {
    if (!orderId || !userId || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      // The v2 endpoint is Clerk-authenticated and tenant/role scoped. It
      // deliberately returns no supplier, price, invoice, or financing data.
      const { data } = await fieldAPI.receiptContext(orderId);
      const context = data.order as ReceiptOrder | undefined;
      if (!context || context.id !== orderId || !Array.isArray(context.items)) {
        throw new Error("The server returned an invalid receiving context.");
      }
      setOrder(context);

      const blankLines = createReceiptDraftLines(context);
      const savedText = storageKey ? await SecureStore.getItemAsync(storageKey) : null;
      if (savedText) {
        try {
          const saved = JSON.parse(savedText) as LocalReceiptDraft;
          if (saved.userId === userId && saved.orderId === orderId && saved.state === "LOCAL_DRAFT") {
            const savedLines = new Map(saved.lines.map((line) => [line.orderItemId, line]));
            setLines(blankLines.map((line) => savedLines.get(line.orderItemId) ?? line));
            setEvidenceUris(Array.isArray(saved.evidenceUris) ? saved.evidenceUris.slice(0, MAX_EVIDENCE_PHOTOS) : []);
            setLocalDraft(saved);
            setDraftSaved(true);
            return;
          }
        } catch {
          if (storageKey) await SecureStore.deleteItemAsync(storageKey);
        }
      }
      setLines(blankLines);
      setEvidenceUris([]);
      setLocalDraft(null);
      setDraftSaved(false);
    } catch (cause) {
      setError(messageFrom(cause));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, orderId, storageKey, userId]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const updateLine = (orderItemId: string, patch: Partial<ReceiptLineDraft>) => {
    setLines((current) => current.map((line) =>
      line.orderItemId === orderItemId ? { ...line, ...patch } : line
    ));
    setDraftSaved(false);
  };

  const capturePhoto = async () => {
    if (evidenceUris.length >= MAX_EVIDENCE_PHOTOS) {
      Alert.alert("Photo limit reached", `A receipt draft can hold up to ${MAX_EVIDENCE_PHOTOS} evidence photos.`);
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera access required", "Allow camera access to attach delivery evidence.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setEvidenceUris((current) => [...current, result.assets[0].uri].slice(0, MAX_EVIDENCE_PHOTOS));
        setDraftSaved(false);
      }
    } catch {
      Alert.alert("Photo unavailable", "The camera could not attach a photo. Please try again.");
    }
  };

  const saveDraft = async () => {
    if (!order || !userId || !storageKey || saving) return;
    const issue = validateReceiptDraft(order, lines);
    if (issue) {
      Alert.alert("Draft needs correction", issue);
      return;
    }
    const hasVariance = lines.some((line) => {
      const item = order.items.find((candidate) => candidate.id === line.orderItemId);
      return item ? line.receivedQuantity < item.remainingQuantity || line.acceptedQuantity < line.receivedQuantity : false;
    });
    if (hasVariance && evidenceUris.length === 0) {
      Alert.alert("Add photo evidence", "Attach at least one photo when items are missing, damaged, or rejected.");
      return;
    }

    setSaving(true);
    const nextDraft: LocalReceiptDraft = {
      id: localDraft?.id ?? createReceiptDraftId(),
      userId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      updatedAt: new Date().toISOString(),
      lines,
      evidenceUris,
      state: "LOCAL_DRAFT",
    };
    try {
      await SecureStore.setItemAsync(storageKey, JSON.stringify(nextDraft));
      setLocalDraft(nextDraft);
      setDraftSaved(true);
    } catch {
      Alert.alert("Draft not saved", "Secure local storage could not save this draft. No receipt was submitted.");
    } finally {
      setSaving(false);
    }
  };

  const startAgain = () => {
    if (!order) return;
    Alert.alert("Clear local draft?", "This removes this device's saved quantities and photo references. Nothing has been sent to the server.", [
      { text: "Keep draft", style: "cancel" },
      {
        text: "Clear draft", style: "destructive", onPress: async () => {
          if (storageKey) await SecureStore.deleteItemAsync(storageKey);
          setLines(createReceiptDraftLines(order));
          setEvidenceUris([]);
          setLocalDraft(null);
          setDraftSaved(false);
        },
      },
    ]);
  };

  const signIn = async () => {
    try {
      await startHostedAuth({ mode: "sign-in" });
    } catch {
      Alert.alert("Sign-in did not finish", "Complete HotelsVendors work-account sign-in, then reopen the receipt.");
    }
  };

  if (!orderId) {
    return <InfoState title="Purchase order required" message="Open receiving from an order in the Orders screen." />;
  }

  if (!isClerkLoaded || loading) {
    return <InfoState loading title="Checking secure receiving access" message="The purchase order is being checked against your work account." />;
  }

  if (!isSignedIn) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <ShieldCheck size={38} color={colors.primary} />
          <Text style={styles.heading}>Secure work sign-in required</Text>
          <Text style={styles.body}>Only authorized hotel receiving roles can open a purchase order for receipt.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={signIn}>
            <Text style={styles.primaryButtonText}>Sign in securely</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (error || !order) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <InfoState title="Receiving context unavailable" message={error || "The purchase order could not be loaded."} />
        <TouchableOpacity style={styles.secondaryButton} onPress={loadContext}>
          <Text style={styles.secondaryButtonText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const validationError = validateReceiptDraft(order, lines);
  const totalReceived = lines.reduce((sum, line) => sum + (Number(line.receivedQuantity) || 0), 0);
  const totalMissing = order.items.reduce((sum, item) => {
    const line = lines.find((candidate) => candidate.orderItemId === item.id);
    return sum + (line ? summarizeReceiptLine(item, line).missingQuantity : item.remainingQuantity);
  }, 0);
  const totalDamaged = lines.reduce((sum, line) => sum + Math.max(0, line.receivedQuantity - line.acceptedQuantity), 0);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>CONTROLLED RECEIVING</Text>
            <Text style={styles.heading}>{order.orderNumber}</Text>
          </View>
          <View style={styles.secureBadge}><ShieldCheck size={14} color={colors.success} /><Text style={styles.secureText}>Verified access</Text></View>
        </View>
        <Text style={styles.body}>Check each item against this authorized purchase order. Prices and financing details are not part of this receiving view.</Text>
        <View style={styles.notice}>
          <WifiOff size={16} color={colors.warning} />
          <Text style={styles.noticeText}>Offline draft only. Server submission is paused until idempotent receipt creation and durable evidence upload are available.</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Summary label="Received" value={totalReceived} />
        <Summary label="Missing" value={totalMissing} />
        <Summary label="Damaged / rejected" value={totalDamaged} />
      </View>

      {order.items.map((item) => {
        const line = lines.find((candidate) => candidate.orderItemId === item.id);
        if (!line) return null;
        const variance = summarizeReceiptLine(item, line);
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.itemHeader}>
              <View style={styles.flex}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.meta}>{item.product.sku} · {item.product.unitOfMeasure}</Text>
              </View>
              <Text style={styles.remaining}>{item.remainingQuantity} remaining</Text>
            </View>
            <QuantityInput
              label="Received in this delivery"
              value={line.receivedQuantity}
              max={item.remainingQuantity}
              onChange={(value) => updateLine(item.id, { receivedQuantity: value, acceptedQuantity: Math.min(line.acceptedQuantity, value) })}
            />
            <QuantityInput
              label="Accepted as usable"
              value={line.acceptedQuantity}
              max={line.receivedQuantity}
              onChange={(value) => updateLine(item.id, { acceptedQuantity: value })}
            />
            <View style={styles.varianceRow}>
              <Text style={styles.variance}>Missing: {variance.missingQuantity} {item.product.unitOfMeasure}</Text>
              <Text style={styles.variance}>Damaged/rejected: {variance.damagedOrRejectedQuantity} {item.product.unitOfMeasure}</Text>
            </View>
            {variance.damagedOrRejectedQuantity > 0 ? (
              <TextInput
                style={styles.input}
                value={line.rejectionReason}
                onChangeText={(value) => updateLine(item.id, { rejectionReason: value })}
                placeholder="Required reason for damaged or rejected quantity"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={`Reason for rejected quantity on ${item.product.name}`}
              />
            ) : null}
            {(variance.missingQuantity > 0 || variance.damagedOrRejectedQuantity > 0) ? (
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={line.conditionNotes}
                onChangeText={(value) => updateLine(item.id, { conditionNotes: value })}
                placeholder="Condition notes (optional)"
                placeholderTextColor={colors.textMuted}
                multiline
                accessibilityLabel={`Condition notes for ${item.product.name}`}
              />
            ) : null}
          </View>
        );
      })}

      <View style={styles.card}>
        <View style={styles.photoHeader}>
          <Camera size={20} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Photo evidence</Text>
            <Text style={styles.meta}>{evidenceUris.length} of {MAX_EVIDENCE_PHOTOS} attached</Text>
          </View>
          <TouchableOpacity style={styles.photoButton} onPress={capturePhoto} disabled={evidenceUris.length >= MAX_EVIDENCE_PHOTOS}>
            <Text style={styles.photoButtonText}>Take photo</Text>
          </TouchableOpacity>
        </View>
        {evidenceUris.length > 0 ? (
          <View style={styles.photoList}>
            {evidenceUris.map((uri, index) => (
              <View key={uri} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photo} accessibilityLabel={`Receipt evidence photo ${index + 1}`} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  onPress={() => { setEvidenceUris((current) => current.filter((_, i) => i !== index)); setDraftSaved(false); }}
                >
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.meta}>Capture the delivery condition. Photos remain local and are not uploaded yet.</Text>
        )}
      </View>

      {draftSaved ? (
        <View style={styles.savedBanner}>
          <CheckCircle2 size={18} color={colors.success} />
          <Text style={styles.savedText}>Saved securely on this device as a local draft. It is not a submitted receipt or GRN.</Text>
        </View>
      ) : null}

      {validationError ? <Text style={styles.validationText}>{validationError}</Text> : null}
      <TouchableOpacity style={[styles.primaryButton, (saving || !!validationError) && styles.disabledButton]} onPress={saveDraft} disabled={saving || !!validationError}>
        {saving ? <ActivityIndicator color="#fff" /> : <ShieldCheck size={18} color="#fff" />}
        <Text style={styles.primaryButtonText}>Save offline draft</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.syncButton, styles.disabledButton]} disabled>
        <UploadCloud size={18} color={colors.textMuted} />
        <Text style={styles.syncText}>Sync unavailable — server safeguards pending</Text>
      </TouchableOpacity>
      {localDraft ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={startAgain} disabled={saving}>
          <Text style={styles.secondaryButtonText}>Clear this local draft</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.disclaimer}>A draft never updates inventory, marks delivery accepted, or triggers financing. Final delivery also requires the server’s ETA clearance.</Text>
    </ScrollView>
  );
}

function InfoState({ title, message, loading = false }: { title: string; message: string; loading?: boolean }) {
  return (
    <View style={styles.infoState}>
      {loading ? <ActivityIndicator size="large" color={colors.primary} /> : <ShieldCheck size={34} color={colors.warning} />}
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

function QuantityInput({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const adjust = (delta: number) => onChange(Math.max(0, Math.min(max, value + delta)));
  return (
    <View style={styles.quantityRow}>
      <Text style={styles.quantityLabel}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepButton} onPress={() => adjust(-1)} disabled={value <= 0} accessibilityLabel={`Decrease ${label}`}>
          <Minus size={18} color={colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.quantityInput}
          value={String(value)}
          onChangeText={(raw) => {
            if (raw === "") { onChange(0); return; }
            if (/^\d+$/.test(raw)) onChange(Math.min(max, Number(raw)));
          }}
          keyboardType="number-pad"
          accessibilityLabel={label}
        />
        <TouchableOpacity style={styles.stepButton} onPress={() => adjust(1)} disabled={value >= max} accessibilityLabel={`Increase ${label}`}>
          <Plus size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 110, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  hero: { gap: spacing.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  flex: { flex: 1 },
  eyebrow: { ...typography.label, color: colors.textMuted, letterSpacing: 1.5 },
  heading: { ...typography.h2, color: colors.text },
  body: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  secureBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.success + "18", paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: radii.full },
  secureText: { ...typography.caption, color: colors.success, fontWeight: "700" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.warning + "18", padding: spacing.md, borderRadius: radii.md },
  noticeText: { ...typography.caption, color: colors.warning, lineHeight: 17, flex: 1 },
  summaryRow: { flexDirection: "row", gap: spacing.sm },
  summaryCard: { flex: 1, minHeight: 66, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  summaryValue: { ...typography.h3, color: colors.primary },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 3 },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  itemHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  itemName: { ...typography.body, color: colors.text, fontWeight: "700" },
  remaining: { ...typography.caption, color: colors.textSecondary },
  quantityRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  quantityLabel: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  stepButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  quantityInput: { minWidth: 48, paddingVertical: spacing.xs, color: colors.text, textAlign: "center", fontWeight: "700", borderBottomWidth: 1, borderColor: colors.primary },
  varianceRow: { gap: 4 },
  variance: { ...typography.caption, color: colors.warning },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, backgroundColor: colors.bg, ...typography.bodySmall },
  notesInput: { minHeight: 72, textAlignVertical: "top" },
  sectionTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
  photoHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  photoButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary },
  photoButtonText: { ...typography.caption, color: "#fff", fontWeight: "700" },
  photoList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoTile: { width: 88, height: 88, borderRadius: radii.md, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  removePhoto: { position: "absolute", right: 3, top: 3, backgroundColor: "rgba(0,0,0,0.72)", borderRadius: radii.full, padding: 4 },
  savedBanner: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.success + "18" },
  savedText: { ...typography.bodySmall, color: colors.success, flex: 1 },
  validationText: { ...typography.bodySmall, color: colors.error },
  primaryButton: { minHeight: 48, flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary },
  primaryButtonText: { ...typography.body, color: "#fff", fontWeight: "700" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { ...typography.body, color: colors.text },
  syncButton: { minHeight: 46, flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  syncText: { ...typography.caption, color: colors.textMuted, textAlign: "center" },
  disabledButton: { opacity: 0.55 },
  disclaimer: { ...typography.caption, color: colors.textMuted, lineHeight: 17, textAlign: "center", marginTop: spacing.xs },
  infoState: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", gap: spacing.md, padding: spacing.xl },
});
