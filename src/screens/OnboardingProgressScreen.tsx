/**
 * OnboardingProgressScreen
 * Shows onboarding checklist and allows marking steps complete.
 * Mobile = companion view (read + quick actions, not full wizard).
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  Circle,
  Hotel,
  Store,
  Truck,
  Landmark,
  Building,
  Phone,
  FileText,
  Package,
  CreditCard,
  MapPin,
  Upload,
  ShoppingCart,
  ChevronRight,
} from "lucide-react-native";
import { colors } from "@/theme";
import { onboardingAPI } from "@/api";

interface OnboardingStep {
  stepKey: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const ROLE_ICONS: Record<string, React.ElementType> = {
  HOTEL: Hotel,
  SUPPLIER: Store,
  SHIPPING: Truck,
  FACTORING: Landmark,
};

const STEP_ICONS: Record<string, React.ElementType> = {
  profile_complete: Building,
  phone_verified: Phone,
  kyc_level1: FileText,
  kyc_level2: FileText,
  property_added: Hotel,
  eta_setup: CreditCard,
  first_order: ShoppingCart,
  product_listed: Package,
  oliv_activated: CreditCard,
  zones_selected: MapPin,
  documents_uploaded: Upload,
};

export default function OnboardingProgressScreen({ navigation }: any) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [role, setRole] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const { data } = await onboardingAPI.getProgress();
      if (data.success && data.data) {
        setRole(data.data.platformRole);
        setSteps(data.data.steps || []);
        setProgressPercent(data.data.progressPercent || 0);
      }
    } catch (err) {
      console.error("Failed to fetch onboarding progress:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProgress();
  }, [fetchProgress]);

  const handleMarkComplete = async (stepKey: string) => {
    setCompleting(stepKey);
    try {
      await onboardingAPI.updateStep(stepKey, true);
      setSteps((prev) =>
        prev.map((s) => (s.stepKey === stepKey ? { ...s, completed: true } : s))
      );
      // Recalculate progress
      const updated = steps.map((s) => (s.stepKey === stepKey ? { ...s, completed: true } : s));
      const required = updated.filter((s) => s.required);
      const completedRequired = required.filter((s) => s.completed);
      setProgressPercent(required.length > 0 ? Math.round((completedRequired.length / required.length) * 100) : 0);
    } catch (err) {
      console.error("Failed to mark step complete:", err);
    } finally {
      setCompleting(null);
    }
  };

  const RoleIcon = ROLE_ICONS[role] || Hotel;
  const completedCount = steps.filter((s) => s.completed).length;
  const requiredCount = steps.filter((s) => s.required).length;
  const requiredCompleted = steps.filter((s) => s.required && s.completed).length;
  const allRequiredComplete = requiredCompleted === requiredCount;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.roleIcon, { backgroundColor: colors.primary }]}>
            <RoleIcon size={24} color="#fff" />
          </View>
          <Text style={styles.title}>Welcome to INVO</Text>
          <Text style={styles.subtitle}>Complete these steps to unlock the full experience</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {completedCount} of {steps.length} steps
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map((step) => {
            const StepIcon = STEP_ICONS[step.stepKey] || FileText;

            return (
              <View
                key={step.stepKey}
                style={[
                  styles.stepCard,
                  step.completed && styles.stepCardCompleted,
                ]}
              >
                <View style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      step.completed
                        ? styles.stepIconCompleted
                        : { backgroundColor: "rgba(255,255,255,0.03)" },
                    ]}
                  >
                    {step.completed ? (
                      <CheckCircle2 size={20} color="#22c55e" />
                    ) : (
                      <StepIcon size={18} color="rgba(255,255,255,0.3)" />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text
                        style={[
                          styles.stepLabel,
                          step.completed && styles.stepLabelCompleted,
                        ]}
                      >
                        {step.label}
                      </Text>
                      {step.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>

                    {step.completed ? (
                      <View style={styles.completedRow}>
                        <CheckCircle2 size={12} color="#22c55e" />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.markButton}
                        onPress={() => handleMarkComplete(step.stepKey)}
                        disabled={completing === step.stepKey}
                      >
                        {completing === step.stepKey ? (
                          <ActivityIndicator size={11} color={colors.primary} />
                        ) : (
                          <Circle size={11} color={colors.primary} />
                        )}
                        <Text style={[styles.markButtonText, { color: colors.primary }]}>
                          Mark Complete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            You can complete these steps at any time from your Profile. Some steps require document verification which may take 1-2 business days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 16,
  },
  stepCardCompleted: {
    borderColor: "rgba(34,197,94,0.2)",
    backgroundColor: "rgba(34,197,94,0.05)",
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconCompleted: {
    backgroundColor: "rgba(34,197,94,0.1)",
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  stepLabelCompleted: {
    color: "#22c55e",
  },
  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  requiredText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  stepDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  completedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  completedText: {
    fontSize: 11,
    color: "#22c55e",
  },
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignSelf: "flex-start",
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
