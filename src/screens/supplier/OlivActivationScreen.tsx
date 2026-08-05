/**
 * Oliv Activation — In-App KYC Onboarding
 *
 * The mobile app IS the Oliv onboarding channel (no external redirects).
 * Collects company KYC, signatory, and bank details, then submits to
 * POST /api/v1/oliv/onboard-supplier which stores the application as
 * an olivOnboardingAudit record (olivStatus: PENDING) — the proof of
 * referral volume for Oliv Phase 2 qualification.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { olivAPI } from "@/api";
import { useAuthStore } from "@/store/auth";
import { colors, spacing, radii, typography } from "@/theme";
import { openOlivOnboarding } from "@/utils/olivLink";
import { isValidEgyptianPhone, normalizePhone } from "@/utils/phone";

const BENEFITS = [
  { title: "Same Day Approval", icon: "⚡", desc: "Get credit decision within hours of application" },
  { title: "48h Funding", icon: "💸", desc: "Funds disbursed to your account in 48 hours" },
  { title: "No Collateral", icon: "🛡️", desc: "Unsecured credit based on your ETA tax records" },
];

type Step = "intro" | "company" | "signatory" | "bank" | "done";

export default function OlivActivationScreen() {
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("intro");
  const [loading, setLoading] = useState(false);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [olivPhone, setOlivPhone] = useState(user?.phone || "");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Step 1 — Company
  const [company, setCompany] = useState({
    legalName: "",
    commercialRegisterNumber: "",
    taxRegistrationNumber: "",
    crIssueDate: "",
    crExpiryDate: "",
    street: "",
    building: "",
    city: "",
    governorate: "",
    postalCode: "",
    phone: "",
    email: user?.email || "",
  });

  // Step 2 — Signatory
  const [signatory, setSignatory] = useState({
    fullName: user?.name || "",
    nationalId: "",
    nationalIdExpiry: "",
    position: "Managing Director",
    phone: "",
    email: user?.email || "",
  });

  // Step 3 — Bank + consents
  const [bank, setBank] = useState({ bankName: "", accountNumber: "", iban: "" });
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  const upd =
    <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (field: keyof T, value: string) =>
      setter((prev) => ({ ...prev, [field]: value }));

  const updCompany = upd(setCompany);
  const updSignatory = upd(setSignatory);
  const updBank = upd(setBank);

  const companyValid =
    company.legalName.trim() &&
    company.commercialRegisterNumber.trim() &&
    company.taxRegistrationNumber.trim() &&
    company.crIssueDate.trim() &&
    company.crExpiryDate.trim() &&
    company.street.trim() &&
    company.building.trim() &&
    company.city.trim() &&
    company.governorate.trim() &&
    company.postalCode.trim() &&
    company.phone.trim() &&
    /\S+@\S+\.\S+/.test(company.email);

  const signatoryValid =
    signatory.fullName.trim() &&
    signatory.nationalId.trim() &&
    signatory.nationalIdExpiry.trim() &&
    signatory.phone.trim() &&
    /\S+@\S+\.\S+/.test(signatory.email);

  const bankValid =
    bank.bankName.trim() && bank.accountNumber.trim() && bank.iban.trim();
  const allConsented = consent1 && consent2 && consent3;

  const handleSubmit = async () => {
    if (!user?.id || !user?.tenantId) {
      Alert.alert("Session expired", "Please sign in again.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await olivAPI.onboardSupplier({
        userId: user.id,
        tenantId: user.tenantId,
        company: {
          legalName: company.legalName.trim(),
          commercialRegisterNumber: company.commercialRegisterNumber.trim(),
          taxRegistrationNumber: company.taxRegistrationNumber.trim(),
          crIssueDate: company.crIssueDate.trim(),
          crExpiryDate: company.crExpiryDate.trim(),
          companyType: "LLC",
          address: {
            street: company.street.trim(),
            building: company.building.trim(),
            city: company.city.trim(),
            governorate: company.governorate.trim(),
            postalCode: company.postalCode.trim(),
          },
          phone: company.phone.trim(),
          email: company.email.trim(),
        },
        signatory: {
          fullName: signatory.fullName.trim(),
          nationalId: signatory.nationalId.trim(),
          nationalIdExpiry: signatory.nationalIdExpiry.trim(),
          position: signatory.position.trim() || "Managing Director",
          phone: signatory.phone.trim(),
          email: signatory.email.trim(),
        },
        bankAccount: {
          bankName: bank.bankName.trim(),
          accountNumber: bank.accountNumber.trim(),
          iban: bank.iban.trim(),
        },
        consents: {
          businessData: consent1,
          taxRecords: consent2,
          bankDetails: consent3,
        },
      });

      if (data.success) {
        setOnboardingId(data.onboardingId || null);
        setStep("done");
      } else {
        Alert.alert("Error", data.error || "Submission failed");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Something went wrong. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueOnOliv = async () => {
    const normalized = normalizePhone(olivPhone);
    if (!isValidEgyptianPhone(normalized)) {
      setPhoneError("Enter a valid Egyptian mobile number, e.g. 0101 234 5678");
      return;
    }
    setPhoneError(null);
    try {
      await openOlivOnboarding({
        phone: normalized,
        name: user?.name || undefined,
        email: user?.email || undefined,
      });
      Alert.alert(
        "Opening Oliv",
        "Referral code CHV000 and your mobile number were copied to the clipboard — paste them into the Oliv form if they don't auto-fill."
      );
    } catch {
      Alert.alert(
        "Could not open Oliv",
        "Referral code CHV000 and your number are on your clipboard. Open oliv.finance and paste them in the referral field."
      );
    }
  };

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType = "default",
    required = true,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
    required?: boolean;
  }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {required && <Text style={styles.req}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );

  const ConsentRow = ({
    checked,
    onToggle,
    label,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
  }) => (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const StepDots = ({ current }: { current: number }) => (
    <View style={styles.dotsRow}>
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.dot, n <= current && styles.dotActive]} />
      ))}
    </View>
  );

  /* ───────────── INTRO ───────────── */
  if (step === "intro") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <Text style={styles.logo}>Oliv</Text>
          <Text style={styles.poweredBy}>Powered by HotelsVendors</Text>
        </View>

        <Text style={styles.headline}>Get Up to EGP 10M Credit Line</Text>
        <Text style={styles.subtext}>
          Same-day approval with your ETA tax UUID. Funds disbursed in 48 hours.
          No collateral required.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.phoneBlock}>
          <Text style={styles.fieldLabel}>
            Mobile number Oliv will pre-fill <Text style={styles.req}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={olivPhone}
            onChangeText={(t) => {
              setOlivPhone(t.replace(/[^\d+]/g, "").slice(0, 15));
              setPhoneError(null);
            }}
            placeholder="+20 10X XXX XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
          {phoneError && <Text style={styles.err}>{phoneError}</Text>}
          <Text style={styles.helper}>
            Your referral code CHV000 is included automatically.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.activateBtn}
          onPress={handleContinueOnOliv}
          activeOpacity={0.8}
        >
          <Text style={styles.activateBtnText}>Get the Oliv App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inAppLink}
          onPress={() => setStep("company")}
          activeOpacity={0.8}
        >
          <Text style={styles.inAppLinkText}>Or apply in-app with 3 short steps</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ───────────── SUCCESS ───────────── */
  if (step === "done") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.doneIconWrap}>
          <Text style={styles.doneIcon}>✓</Text>
        </View>
        <Text style={styles.headline}>Application Submitted</Text>
        <Text style={styles.subtext}>
          Your Oliv financing application has been received. Oliv reviews most
          applications within 24 hours and will contact you to complete the
          mandatory e-KYC (VLens) step.
        </Text>
        {onboardingId && (
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Application Reference</Text>
            <Text style={styles.refValue}>{onboardingId}</Text>
          </View>
        )}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Once approved, you can upload invoices and request factoring directly
            from this app — funds land in your bank account within 48 hours.
          </Text>
        </View>
      </ScrollView>
    );
  }

  /* ───────────── FORM STEPS ───────────── */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === "company" && (
          <>
            <StepDots current={1} />
            <Text style={styles.stepTitle}>Company Information</Text>
            <Text style={styles.stepSub}>
              Exactly as shown on your Commercial Register and tax card.
            </Text>

            <Field label="Legal Company Name" value={company.legalName} onChange={(v) => updCompany("legalName", v)} placeholder="e.g. Nile Trading Co." />
            <Field label="Commercial Register (CR) Number" value={company.commercialRegisterNumber} onChange={(v) => updCompany("commercialRegisterNumber", v)} placeholder="CR number" />
            <Field label="Tax Registration Number" value={company.taxRegistrationNumber} onChange={(v) => updCompany("taxRegistrationNumber", v)} placeholder="9-digit tax number" keyboardType="number-pad" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="CR Issue Date" value={company.crIssueDate} onChange={(v) => updCompany("crIssueDate", v)} placeholder="DD/MM/YYYY" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="CR Expiry Date" value={company.crExpiryDate} onChange={(v) => updCompany("crExpiryDate", v)} placeholder="DD/MM/YYYY" />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Registered Address</Text>
            <View style={styles.row2}>
              <View style={{ flex: 2 }}>
                <Field label="Street" value={company.street} onChange={(v) => updCompany("street", v)} placeholder="Street name" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Building" value={company.building} onChange={(v) => updCompany("building", v)} placeholder="No." />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={company.city} onChange={(v) => updCompany("city", v)} placeholder="Cairo" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Governorate" value={company.governorate} onChange={(v) => updCompany("governorate", v)} placeholder="Cairo" />
              </View>
            </View>
            <Field label="Postal Code" value={company.postalCode} onChange={(v) => updCompany("postalCode", v)} placeholder="11511" keyboardType="number-pad" />

            <Text style={styles.sectionLabel}>Contact</Text>
            <Field label="Company Phone" value={company.phone} onChange={(v) => updCompany("phone", v)} placeholder="+20 10X XXX XXXX" keyboardType="phone-pad" />
            <Field label="Company Email" value={company.email} onChange={(v) => updCompany("email", v)} placeholder="company@example.com" keyboardType="email-address" />

            <TouchableOpacity
              style={[styles.activateBtn, !companyValid && styles.activateBtnDisabled]}
              onPress={() => companyValid && setStep("signatory")}
              disabled={!companyValid}
              activeOpacity={0.8}
            >
              <Text style={styles.activateBtnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "signatory" && (
          <>
            <StepDots current={2} />
            <Text style={styles.stepTitle}>Authorized Signatory</Text>
            <Text style={styles.stepSub}>
              The person legally authorized to sign financing agreements.
            </Text>

            <Field label="Full Name (as per National ID)" value={signatory.fullName} onChange={(v) => updSignatory("fullName", v)} placeholder="Full legal name" />
            <Field label="National ID Number" value={signatory.nationalId} onChange={(v) => updSignatory("nationalId", v)} placeholder="14-digit national ID" keyboardType="number-pad" />
            <Field label="National ID Expiry" value={signatory.nationalIdExpiry} onChange={(v) => updSignatory("nationalIdExpiry", v)} placeholder="DD/MM/YYYY" />
            <Field label="Position" value={signatory.position} onChange={(v) => updSignatory("position", v)} placeholder="Managing Director" required={false} />
            <Field label="Mobile Number" value={signatory.phone} onChange={(v) => updSignatory("phone", v)} placeholder="+20 10X XXX XXXX" keyboardType="phone-pad" />
            <Field label="Email" value={signatory.email} onChange={(v) => updSignatory("email", v)} placeholder="you@example.com" keyboardType="email-address" />

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep("company")} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.activateBtn, { flex: 1, marginTop: 0 }, !signatoryValid && styles.activateBtnDisabled]}
                onPress={() => signatoryValid && setStep("bank")}
                disabled={!signatoryValid}
                activeOpacity={0.8}
              >
                <Text style={styles.activateBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === "bank" && (
          <>
            <StepDots current={3} />
            <Text style={styles.stepTitle}>Bank Account & Consents</Text>
            <Text style={styles.stepSub}>
              Where Oliv will disburse your funds.
            </Text>

            <Field label="Bank Name" value={bank.bankName} onChange={(v) => updBank("bankName", v)} placeholder="e.g. CBE, NSGB, QNB" />
            <Field label="Account Number" value={bank.accountNumber} onChange={(v) => updBank("accountNumber", v)} placeholder="Account number" keyboardType="number-pad" />
            <Field label="IBAN" value={bank.iban} onChange={(v) => updBank("iban", v)} placeholder="EG00 0000 0000 0000 0000 0000 000" />

            <View style={styles.consentSection}>
              <Text style={styles.consentHeader}>Data Sharing Consents (PDPL)</Text>
              <ConsentRow checked={consent1} onToggle={() => setConsent1(!consent1)} label="I authorize HotelsVendors to share my business registration data with Oliv Finance for credit assessment" />
              <ConsentRow checked={consent2} onToggle={() => setConsent2(!consent2)} label="I authorize HotelsVendors to share my tax records with Oliv Finance" />
              <ConsentRow checked={consent3} onToggle={() => setConsent3(!consent3)} label="I authorize HotelsVendors to share my bank account details with Oliv Finance" />
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep("signatory")} activeOpacity={0.8}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.activateBtn, { flex: 1, marginTop: 0 }, (!bankValid || !allConsented) && styles.activateBtnDisabled]}
                onPress={handleSubmit}
                disabled={!bankValid || !allConsented || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.bg} size="small" />
                ) : (
                  <Text style={styles.activateBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  brandRow: { alignItems: "center", marginTop: spacing.xl },
  logo: { fontSize: 36, fontWeight: "600", color: colors.primary, letterSpacing: -1 },
  poweredBy: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  headline: { ...typography.h1, color: colors.text, textAlign: "center", marginTop: spacing.lg },
  subtext: { ...typography.body, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },
  benefits: { gap: spacing.md },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  benefitIcon: { fontSize: 28 },
  benefitTextCol: { flex: 1 },
  benefitTitle: { ...typography.h3, color: colors.text },
  benefitDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  stepTitle: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  stepSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: -spacing.sm },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textTransform: "uppercase", marginTop: spacing.sm },
  dotsRow: { flexDirection: "row", gap: spacing.sm, justifyContent: "center", marginTop: spacing.lg },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  field: { gap: spacing.xs },
  fieldLabel: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: "600" },
  req: { color: colors.error },
  phoneBlock: { gap: spacing.xs, marginTop: spacing.sm },
  err: { ...typography.caption, color: colors.error },
  helper: { ...typography.caption, color: colors.textMuted },
  inAppLink: { alignItems: "center", paddingVertical: spacing.md },
  inAppLinkText: { ...typography.bodySmall, color: colors.textSecondary, textDecorationLine: "underline" },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  row2: { flexDirection: "row", gap: spacing.md },
  rowBtns: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  backBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  backBtnText: { ...typography.h3, color: colors.textSecondary },
  consentSection: { gap: spacing.md, marginTop: spacing.sm },
  consentHeader: { ...typography.label, color: colors.textSecondary, textTransform: "uppercase" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { fontSize: 14, fontWeight: "600", color: colors.bg },
  checkLabel: { flex: 1, ...typography.bodySmall, color: colors.text, lineHeight: 20 },
  activateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  activateBtnDisabled: { opacity: 0.4 },
  activateBtnText: { ...typography.h3, color: colors.bg, fontWeight: "600" },
  doneIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "20",
    borderWidth: 1,
    borderColor: colors.primary + "40",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: spacing.xxxl,
  },
  doneIcon: { fontSize: 40, color: colors.primary, fontWeight: "600" },
  refCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  refLabel: { ...typography.caption, color: colors.textMuted, textTransform: "uppercase" },
  refValue: { ...typography.body, color: colors.primary, fontWeight: "600" },
  noteCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  noteText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, textAlign: "center" },
});
