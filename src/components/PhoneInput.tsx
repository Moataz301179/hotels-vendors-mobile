/**
 * Phone Input — Egyptian mobile with fixed 🇪🇬 +20 prefix
 * User types the local number starting with 0 (010/011/012/015…)
 * e.g. "01060001828"; normalizePhone() converts to +201060001828.
 */

import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, spacing, radii, typography } from "@/theme";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  fontSize?: number;
}

export default function PhoneInput({
  value,
  onChangeText,
  placeholder = "10X XXX XXXX",
  fontSize = 18,
}: PhoneInputProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.prefix}>
        <Text style={styles.flag}>🇪🇬</Text>
        <Text style={styles.countryCode}>+20</Text>
      </View>
      <TextInput
        style={[styles.input, { fontSize }]}
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^\d]/g, "").slice(0, 11))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.lg,
  },
  flag: { fontSize: 18 },
  countryCode: { ...typography.label, color: colors.textSecondary, letterSpacing: 0.2 },
  input: {
    flex: 1,
    padding: spacing.lg,
    color: colors.text,
    letterSpacing: 0.5,
  },
});
