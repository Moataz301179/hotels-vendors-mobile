/**
 * CategoryGrid — Invo Mobile
 * Photo + overlay + features grid for product categories
 */

import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { Hotel, Utensils, Sparkles, Wrench, Building2, Truck } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMNS = 2;
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.1;

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  featureCount: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  gradient?: [string, string];
}

const CATEGORIES: Category[] = [
  {
    id: "housekeeping",
    name: "Housekeeping",
    slug: "housekeeping",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop",
    featureCount: 12,
    icon: Sparkles,
    gradient: ["#059669", "#047857"],
  },
  {
    id: "food-beverage",
    name: "Food & Beverage",
    slug: "f&b",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
    featureCount: 24,
    icon: Utensils,
    gradient: ["#F59E0B", "#D97706"],
  },
  {
    id: "amenities",
    name: "Guest Amenities",
    slug: "amenities",
    imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=400&fit=crop",
    featureCount: 18,
    icon: Hotel,
    gradient: ["#6366F1", "#4F46E5"],
  },
  {
    id: "engineering",
    name: "Engineering",
    slug: "engineering",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop",
    featureCount: 15,
    icon: Wrench,
    gradient: ["#DC2626", "#B91C1C"],
  },
  {
    id: "capital-equipment",
    name: "Capital Equipment",
    slug: "capital-equipment",
    imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=400&fit=crop",
    featureCount: 8,
    icon: Building2,
    gradient: ["#312E81", "#1E1B4B"],
  },
  {
    id: "logistics",
    name: "Logistics & Supply",
    slug: "logistics",
    imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop",
    featureCount: 10,
    icon: Truck,
    gradient: ["#0891B2", "#0E7490"],
  },
];

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
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
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
            <View style={styles.featureDots}>
              {[...Array(Math.min(item.featureCount, 5))].map((_, i) => (
                <View key={i} style={styles.featureDot} />
              ))}
              {item.featureCount > 5 && (
                <Text style={styles.moreText}>+{item.featureCount - 5}</Text>
              )}
            </View>
          </View>
        )}
      </View>
      <View style={[styles.gradient, { backgroundColor: item.gradient?.[0] }]} />
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
  sectionContainer: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    position: "relative",
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: "rgba(10,14,26,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  name: {
    ...typography.h3,
    color: colors.text,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  features: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureLabel: {
    ...typography.caption,
    color: "rgba(242,244,248,0.85)",
    fontWeight: "500",
  },
  featureDots: {
    flexDirection: "row",
    gap: 2,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  moreText: {
    ...typography.caption,
    color: "rgba(242,244,248,0.6)",
    marginLeft: spacing.xs,
  },
});

export default CategoryGrid;