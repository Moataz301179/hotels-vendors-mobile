/**
 * CategoryGrid Demo Screen — HOVIN Mobile
 * Showcase the CategoryGrid component
 */

import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { CategoryGrid, CategoryGridSection } from "@/components/CategoryGrid";
import { ArrowRight } from "lucide-react-native";

export default function CategoryGridDemoScreen({ navigation }: any) {
  const handleCategoryPress = (category: any) => {
    console.log("Category pressed:", category.name);
    // navigation.navigate("CatalogTab", { category: category.slug });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Categories</Text>
          <Text style={styles.headerSubtitle}>Browse products by category</Text>
        </View>

        <CategoryGridSection
          title="All Categories"
          onCategoryPress={handleCategoryPress}
          columns={2}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>More categories coming soon</Text>
          <View style={styles.footerArrow}>
            <ArrowRight size={16} color={colors.primary} />
          </View>
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
  scrollContent: {
    paddingBottom: spacing.xxxl * 2,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  footerArrow: {
    padding: spacing.xs,
  },
});