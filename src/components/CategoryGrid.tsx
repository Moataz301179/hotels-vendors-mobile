/**
 * CategoryGrid — HOVIN Mobile
 * Displays hotel procurement categories matching web's canonical taxonomy.
 * Single source of truth: @/categories/index.ts
 */

import React from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  FlatList, Dimensions,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { HOTEL_CATEGORIES, type HotelCategory } from "@/categories";
import { Utensils, Sparkles, Wrench, Sofa, Briefcase, Bath,
         Shirt, Droplets, Monitor, Shield } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.1;

/** Icon map for the canonical hotel categories */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  fb: Utensils,
  hk: Sparkles,
  ffe: Sofa,
  ose: Briefcase,
  gra: Bath,
  lin: Shirt,
  eng: Wrench,
  spa: Droplets,
  it: Monitor,
  sec: Shield,
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  featureCount: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

/**
 * Builds the display category list from the canonical taxonomy.
 * Unsplash images are keyed by category id for easy updates.
 */
const CATEGORY_IMAGES: Record<string, string> = {
  fb: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
  hk: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop",
  ffe: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop",
  ose: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=400&fit=crop",
  gra: "https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=400&h=400&fit=crop",
  lin: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop",
  eng: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
  it:  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop",
  sec: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop",
};

function buildCategories(): Category[] {
  return HOTEL_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.label,
    slug: c.code.toLowerCase(),
    imageUrl: CATEGORY_IMAGES[c.id] || "",
    featureCount: c.examples.length,
    icon: CATEGORY_ICONS[c.id] || Wrench,
  }));
}

const CATEGORIES = buildCategories();

interface CategoryGridProps {
  onCategoryPress?: (category: Category) => void;
  columns?: number;
  showFeatures?: boolean;
}

export function CategoryGrid({
  onCategoryPress,
  columns = COLUMNS,
  showFeatures = true,
}: CategoryGridProps) {
  const itemWidth = (SCREEN_WIDTH - spacing.lg * (columns + 1)) / columns;
  const itemHeight = itemWidth * 1.1;

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.card, { width: itemWidth, height: itemHeight }]}
      onPress={() => onCategoryPress?.(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
        <View style={styles.iconContainer}>
          <item.icon size={28} color={colors.text} />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        {showFeatures && (
          <View style={styles.features}>
            <Text style={styles.featureLabel}>
              {item.featureCount} {item.featureCount === 1 ? "product" : "products"}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.gradient} />
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={CATEGORIES}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={columns}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

export function CategoryGridSection({
  title = "Categories",
  onCategoryPress,
  columns = COLUMNS,
}: {
  title?: string;
  onCategoryPress?: (category: Category) => void;
  columns?: number;
}) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <CategoryGrid onCategoryPress={onCategoryPress} columns={columns} />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { marginBottom: spacing.xxl },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  container: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    position: "relative", borderRadius: radii.lg, overflow: "hidden",
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  image: { ...StyleSheet.absoluteFill },
  gradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10,14,26,0.55)",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: spacing.lg, justifyContent: "space-between",
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: "rgba(10,14,26,0.6)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  name: {
    ...typography.h3, color: colors.text, fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  features: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
  },
  featureLabel: {
    ...typography.caption, color: "rgba(242,244,248,0.85)", fontWeight: "500",
  },
});

export default CategoryGrid;
