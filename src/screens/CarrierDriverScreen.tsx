/**
 * CarrierDriverScreen — INVO Mobile
 * Driver dispatch console: active job queue, pickup/drop-off,
 * barcode scanning, ePOD signature, GPS tracking.
 */

import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import {
  Truck, MapPin, Package, CheckCircle2,
  Navigation, Clock, Barcode, Camera,
} from "lucide-react-native";

interface DeliveryJob {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  hotelName: string;
  status: "assigned" | "en_route_pickup" | "at_pickup" | "in_transit" | "at_dropoff" | "completed";
  eta: string;
  distance: string;
  items: number;
  eWaybillNumber?: string;
}

interface CarrierDriverProps {
  driverName: string;
  driverId: string;
  jobs: DeliveryJob[];
  activeJobId?: string;
  onStatusChange?: (jobId: string, status: string) => void;
  onScanPackage?: (jobId: string) => void;
  onCaptureSignature?: (jobId: string) => void;
}

const JOB_STEPS = [
  { status: "assigned", label: "Assigned", icon: Clock },
  { status: "en_route_pickup", label: "En Route", icon: Navigation },
  { status: "at_pickup", label: "At Pickup", icon: Package },
  { status: "in_transit", label: "In Transit", icon: Truck },
  { status: "at_dropoff", label: "At Hotel", icon: MapPin },
  { status: "completed", label: "Delivered", icon: CheckCircle2 },
] as const;

export function CarrierDriverScreen({
  driverName, jobs, activeJobId,
  onStatusChange, onScanPackage, onCaptureSignature,
}: CarrierDriverProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(activeJobId || null);
  const [updating, setUpdating] = useState(false);

  const activeJob = jobs.find((j) => j.id === selectedJob) || jobs[0];
  const currentStep = JOB_STEPS.findIndex((s) => s.status === activeJob?.status);

  const advanceStatus = useCallback(async () => {
    if (!activeJob) return;
    if (activeJob.status === "completed") return;

    setUpdating(true);
    const nextIdx = currentStep + 1;
    if (nextIdx >= JOB_STEPS.length) return;

    const nextStatus = JOB_STEPS[nextIdx].status;

    if (nextStatus === "at_pickup" || nextStatus === "at_dropoff") {
      Alert.alert(
        nextStatus === "at_pickup" ? "Scan Packages" : "Confirm Delivery",
        nextStatus === "at_pickup"
          ? "Scan barcodes on all packages before proceeding."
          : "Confirm all items delivered and capture recipient signature.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Scan & Continue",
            onPress: () => {
              onScanPackage?.(activeJob.id);
              onStatusChange?.(activeJob.id, nextStatus);
            },
          },
        ]
      );
    } else if (nextStatus === "completed") {
      Alert.alert("Capture ePOD Signature", "Please have the hotel receiver sign to confirm delivery.", [
        { text: "Capture", onPress: () => {
          onCaptureSignature?.(activeJob.id);
          onStatusChange?.(activeJob.id, "completed");
        }},
      ]);
    } else {
      onStatusChange?.(activeJob.id, nextStatus);
    }
    setUpdating(false);
  }, [activeJob, currentStep, onStatusChange, onScanPackage, onCaptureSignature]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Driver header */}
      <View style={styles.driverHeader}>
        <View style={styles.driverAvatar}>
          <Truck size={24} color={colors.primary} />
        </View>
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverStatus}>
            {activeJob ? `${activeJob.status.replace(/_/g, " ")}` : "No active job"}
          </Text>
        </View>
        <View style={styles.jobCount}>
          <Text style={styles.jobCountText}>{jobs.filter((j) => j.status !== "completed").length} active</Text>
        </View>
      </View>

      {/* Active job */}
      {activeJob && (
        <View style={styles.activeJob}>
          <Text style={styles.sectionLabel}>ACTIVE JOB</Text>
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.jobOrder}>{activeJob.orderNumber}</Text>
                <Text style={styles.jobHotel}>{activeJob.hotelName}</Text>
              </View>
              <View style={styles.etaBadge}>
                <Clock size={12} color="#10b981" />
                <Text style={styles.etaText}>{activeJob.eta}</Text>
              </View>
            </View>

            {/* Progress steps */}
            <View style={styles.stepsRow}>
              {JOB_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <View key={step.status} style={styles.stepItem}>
                    <View style={[styles.stepDot, done && styles.stepDone, active && styles.stepActive]} />
                    {i < JOB_STEPS.length - 1 && (
                      <View style={[styles.stepLine, done && styles.stepLineDone]} />
                    )}
                    <Text style={styles.stepLabel}>{step.label}</Text>
                  </View>
                );
              })}
            </View>

            {/* Addresses */}
            <View style={styles.addresses}>
              <View style={styles.addressRow}>
                <MapPin size={14} color="#2563eb" />
                <Text style={styles.addressText} numberOfLines={1}>{activeJob.pickupAddress}</Text>
              </View>
              <View style={styles.addressRow}>
                <MapPin size={14} color="#10b981" />
                <Text style={styles.addressText} numberOfLines={1}>{activeJob.dropoffAddress}</Text>
              </View>
            </View>

            {/* e-Waybill */}
            {activeJob.eWaybillNumber && (
              <View style={styles.eWaybill}>
                <Barcode size={14} color={colors.textMuted} />
                <Text style={styles.eWaybillText}>e-Waybill: {activeJob.eWaybillNumber}</Text>
              </View>
            )}

            {/* Advance button */}
            {activeJob.status !== "completed" && (
              <TouchableOpacity style={styles.advanceBtn} onPress={advanceStatus} disabled={updating} activeOpacity={0.8}>
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.advanceBtnText}>
                    {currentStep === 1 ? "Arrived at Pickup" :
                     currentStep === 2 ? "Confirm Pickup & Scan" :
                     currentStep === 3 ? "Arrived at Hotel" :
                     currentStep === 4 ? "Complete Delivery" : "Start Route"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Job queue */}
      {jobs.length > 1 && (
        <View style={styles.queue}>
          <Text style={styles.sectionLabel}>JOB QUEUE ({jobs.length})</Text>
          {jobs.filter((j) => j.id !== activeJob?.id).map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.queueItem}
              onPress={() => setSelectedJob(job.id)}
            >
              <View style={styles.queueLeft}>
                <Text style={styles.queueOrder}>{job.orderNumber}</Text>
                <Text style={styles.queueHotel}>{job.hotelName}</Text>
              </View>
              <View style={styles.queueRight}>
                <Text style={styles.queueStatus}>{job.status.replace(/_/g, " ")}</Text>
                <Text style={styles.queueItems}>{job.items} items</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  driverHeader: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    padding: spacing.md, borderRadius: radii.xl,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: radii.lg,
    backgroundColor: "rgba(37,99,235,0.12)", alignItems: "center", justifyContent: "center",
  },
  driverInfo: { flex: 1 },
  driverName: { ...typography.h3, color: colors.text },
  driverStatus: { ...typography.caption, color: colors.textMuted },
  jobCount: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radii.full, backgroundColor: "rgba(37,99,235,0.12)",
  },
  jobCountText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  activeJob: { gap: spacing.sm },
  sectionLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  jobCard: {
    borderRadius: radii.xl, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: "rgba(37,99,235,0.15)", padding: spacing.lg,
  },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  jobOrder: { ...typography.h3, color: colors.text, fontWeight: "700" },
  jobHotel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  etaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radii.full, backgroundColor: "rgba(16,185,129,0.12)",
  },
  etaText: { ...typography.caption, color: "#10b981", fontWeight: "600" },
  stepsRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  stepItem: { flex: 1, alignItems: "center" },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 2, borderColor: "rgba(255,255,255,0.15)",
  },
  stepDone: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  stepActive: { width: 14, height: 14, borderColor: "#2563eb", backgroundColor: colors.bg, borderWidth: 3 },
  stepLine: { width: "100%", height: 2, backgroundColor: "rgba(255,255,255,0.08)", position: "absolute", top: 5, left: "50%" },
  stepLineDone: { backgroundColor: "#2563eb" },
  stepLabel: { ...typography.caption, color: colors.textMuted, fontSize: 9, marginTop: 4, textAlign: "center" },
  addresses: { gap: spacing.sm, marginBottom: spacing.sm },
  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addressText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  eWaybill: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    padding: spacing.sm, borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.03)", marginBottom: spacing.md,
  },
  eWaybillText: { ...typography.caption, color: colors.textMuted },
  advanceBtn: {
    padding: spacing.md, borderRadius: radii.lg,
    backgroundColor: "#2563eb", alignItems: "center",
  },
  advanceBtnText: { ...typography.body, color: "#fff", fontWeight: "700" },
  queue: { gap: spacing.sm },
  queueItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: spacing.md, borderRadius: radii.lg,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)",
  },
  queueLeft: { flex: 1 },
  queueOrder: { ...typography.body, color: colors.text, fontWeight: "500" },
  queueHotel: { ...typography.caption, color: colors.textMuted },
  queueRight: { alignItems: "flex-end" },
  queueStatus: { ...typography.caption, color: colors.textSecondary },
  queueItems: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
});