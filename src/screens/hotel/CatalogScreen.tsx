/**
 * Catalog Screen — Hotel Buyer
 * Sourced from canonical categories in @/categories
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl, Image,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { productAPI } from "@/api";
import { useCartStore } from "@/store/cart";
import { getCategoryLabel } from "@/categories";
import type { Product } from "@/types";

/** Prisma-style category options for server-side filtering */
const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "F_AND_B", label: "F&B" },
  { value: "CONSUMABLES", label: "OS&E" },
  { value: "GUEST_SUPPLIES", label: "Guest Supplies" },
  { value: "FFE", label: "FFE" },
  { value: "SERVICES", label: "Engineering" },
];

export default function CatalogScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const addItem = useCartStore((s) => s.addItem);

  const fetchProducts = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category !== "ALL") params.category = category;
      const { data } = await productAPI.list(params);
      if (data.success && data.data) setProducts(data.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [category]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImageText}>📦</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardSku}>{item.sku}</Text>
        <Text style={styles.cardPrice}>EGP {item.price.toLocaleString()} / {item.unit}</Text>
        <Text style={styles.cardSupplier}>{item.supplierName || "—"}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addItem({
          productId: item.id, name: item.name, price: item.price,
          unit: item.unit, supplierId: item.supplierId, imageUrl: item.imageUrl,
        })}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={fetchProducts}
          returnKeyType="search"
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORY_OPTIONS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.catChip, category === cat.value && styles.catChipActive]}
            onPress={() => setCategory(cat.value)}
          >
            <Text style={[styles.catLabel, category === cat.value && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? "Loading..." : "No products found"}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: { padding: spacing.lg, paddingBottom: spacing.sm },
  searchInput: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, color: colors.text, fontSize: 15 },
  categories: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  catChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  catLabel: { ...typography.bodySmall, color: colors.textSecondary },
  catLabelActive: { color: colors.primary, fontWeight: "600" },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardImage: { width: 56, height: 56, borderRadius: radii.sm, marginRight: spacing.md },
  cardImagePlaceholder: { backgroundColor: colors.bgInput, alignItems: "center", justifyContent: "center" },
  cardImageText: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardName: { ...typography.h3, color: colors.text },
  cardSku: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardPrice: { ...typography.body, color: colors.primary, fontWeight: "600", marginTop: spacing.sm },
  cardSupplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  addButtonText: { color: colors.bg, fontSize: 22, fontWeight: "600" },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 2 },
});
