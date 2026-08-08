/**
 * Supplier Catalog — inventory list with search, categories, low-stock filter,
 * plus quick actions for add, import, sync.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";
import { fmtMoney, orderStatusColor } from "@/utils/format";
import * as DocumentPicker from "expo-document-picker";
import {
  ChevronRight, Package, Search, AlertTriangle, FileUp, Upload,
  RefreshCw, Tag, BarChart3, Download,
} from "lucide-react-native";

import { getCategoryLabel } from "@/categories";

type FilterType = "all" | "low-stock" | "out-of-stock";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice?: number | string | null;
  stockQuantity: number;
  unitOfMeasure?: string | null;
  inStock: boolean;
  minOrderQty?: number | null;
  inventorySnapshots?: { occupancyRate?: number | null }[] | null;
}

const CATEGORIES = ["ALL", "F_AND_B", "CONSUMABLES", "GUEST_SUPPLIES", "FFE", "SERVICES"];

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All",
  F_AND_B: "F&B",
  CONSUMABLES: "Consumables",
  GUEST_SUPPLIES: "Guest Supplies",
  FFE: "Furnishings",
  SERVICES: "Services",
};

export default function SupplierCatalogScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [category, setCategory] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

   const fetchProducts = useCallback(async () => {
     try {
       const params = search ? { search } : undefined;
       const { data } = await supplierAPI.inventory(params);
       if (data.success && data.data) {
         let list = data.data.products || [];
         if (filter === "low-stock") {
           list = list.filter((p: Product) => p.stockQuantity > 0 && p.inventorySnapshots?.[0]?.occupancyRate !== undefined && (p.inventorySnapshots?.[0]?.occupancyRate ?? 0) < 0.3);
         } else if (filter === "out-of-stock") {
           list = list.filter((p: Product) => p.stockQuantity === 0);
         }
         if (category !== "ALL") {
           list = list.filter((p: Product) => p.category === category);
         }
         setProducts(list);
       }
     } catch {} finally {
       setRefreshing(false);
     }
   }, [search, filter, category]);

  const handleImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
          "application/csv",
        ],
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      if (file.size && file.size > 10 * 1024 * 1024) {
        Alert.alert("Error", "File too large. Maximum size is 10MB.");
        return;
      }

      Alert.alert("Import", `Importing ${file.name}…`, [{ text: "OK" }]);
      const { data } = await supplierAPI.catalogImport(file);
      if (data.success && data.data) {
        Alert.alert(
          "Import Complete",
          `${data.data.totalRows} rows found, ${data.data.validRows} valid, ${data.data.errorRows} errors. AI enrichment is running in the background.`,
        );
      } else {
        Alert.alert("Error", data.error || "Import failed");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not import file");
    }
  }, []);

  const handleAiUpload = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        multiple: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      Alert.alert("AI Upload", `${result.assets.length} images selected. AI processing…`, [{ text: "OK" }]);
      const { data } = await supplierAPI.aiUpload([]);
      if (data.success && data.data) {
        Alert.alert("Success", `${data.data.createdCount} products created from AI analysis.`);
        fetchProducts();
      } else {
        Alert.alert("Error", data.error || "AI upload failed");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not upload images");
    }
  }, [fetchProducts]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await supplierAPI.catalogImportTemplate();
      Alert.alert("Template", "Excel template downloaded. Edit and import back.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not download template");
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredCount = products.length;
  const lowStockCount = products.filter((p) => p.stockQuantity === 0).length;

  const renderItem = ({ item }: { item: Product }) => {
    const stockLevel = item.stockQuantity <= 0 ? "out" : item.stockQuantity <= (item.minOrderQty || 10) ? "low" : "ok";
    const stockColor = stockLevel === "ok" ? colors.success : stockLevel === "low" ? colors.warning : colors.error;

    return (
         <TouchableOpacity
           style={styles.card}
            onPress={() => Alert.alert("Product", `SKU: ${item.sku}\nPrice: ${fmtMoney(item.unitPrice)}\nStock: ${item.stockQuantity}`)}
            activeOpacity={0.7}>
         <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={styles.rowGap}>
              <Text style={styles.muted}>SKU: {item.sku}</Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primaryMuted + "33" }]}>
                <Tag size={10} color={colors.primary} />
                <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category] || item.category}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.stockIndicator, { backgroundColor: stockColor + "22" }]}>
            <View style={[styles.stockDot, { backgroundColor: stockColor, width: 8, height: 8 }]} />
            <Text style={[styles.stockText, { color: stockColor }]}>
              {item.stockQuantity > 0 ? `${item.stockQuantity} ${item.unitOfMeasure || "pc"}` : "Out of stock"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>{fmtMoney(item.unitPrice)}</Text>
          {item.inventorySnapshots?.[0]?.occupancyRate != null && (
            <View style={styles.occupancyContainer}>
              <BarChart3 size={12} color={colors.textMuted} />
              <Text style={styles.occupancyText}>
                {Math.round((item.inventorySnapshots[0].occupancyRate) * 100)}% occupancy
              </Text>
            </View>
          )}
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        category === item && styles.categoryChipActive,
      ]}
      onPress={() => setCategory(item)}
    >
      <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
        {CATEGORY_LABELS[item] || item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by SKU, name…"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, filter !== "all" && styles.filterBtnActive]}
          onPress={() => setFilter(filter === "all" ? "low-stock" : filter === "low-stock" ? "out-of-stock" : "all")}
        >
          <AlertTriangle size={18} color={filter !== "all" ? colors.warning : colors.textMuted} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item}
        renderItem={renderCategory}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}
      />

      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>
          {filter === "all" ? "All products" : filter === "low-stock" ? "Low stock" : "Out of stock"}
          {` · ${filteredCount}`}
        </Text>
        {lowStockCount > 0 && (
          <View style={styles.alertBadge}>
            <AlertTriangle size={12} color={colors.error} />
            <Text style={styles.alertText}>{lowStockCount} out of stock</Text>
          </View>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color={colors.textMuted} />
            <Text style={styles.empty}>
              {search ? `No products matching "${search}"` : "No products in your catalog"}
            </Text>
            <TouchableOpacity
             style={styles.emptyBtn}
             onPress={handleImport}
            >
               <FileUp size={18} color={colors.bg} />
               <Text style={styles.emptyBtnText}>Import from Excel/CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.textMuted }]}
            onPress={() => fetchProducts()}
          >
            <RefreshCw size={20} color={colors.bg} />
            <Text style={styles.actionBtnText}>Sync</Text>
          </TouchableOpacity>
        </View>
        }
      />

      <View style={styles.actionBar}>
        <TouchableOpacity
             style={styles.actionBtn}
             onPress={handleImport}
        >
             <FileUp size={20} color={colors.bg} />
             <Text style={styles.actionBtnText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
             style={[styles.actionBtn, { backgroundColor: colors.success }]}
             onPress={handleAiUpload}
        >
           <Upload size={20} color={colors.bg} />
           <Text style={styles.actionBtnText}>AI Upload</Text>
         </TouchableOpacity>
         <TouchableOpacity
           style={styles.actionBtn}
           onPress={handleDownloadTemplate}
         >
           <Download size={20} color={colors.bg} />
           <Text style={styles.actionBtnText}>Template</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    height: 36,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.warning + "22",
    borderColor: colors.warning + "44",
  },
  categoryList: {
    maxHeight: 44,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  categoryListContent: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  categoryChip: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.bg,
    fontWeight: "600",
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.error + "11",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  alertText: {
    ...typography.caption,
    color: colors.error,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  productInfo: { flex: 1, marginRight: spacing.md },
  rowGap: { gap: 2 },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  muted: {
    ...typography.caption,
    color: colors.textMuted,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    marginTop: 2,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary,
  },
  stockIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  stockDot: { borderRadius: 4 },
  stockText: {
    ...typography.caption,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700",
  },
  occupancyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  occupancyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyBtnText: {
    ...typography.bodySmall,
    color: colors.bg,
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  actionBtnText: {
    ...typography.label,
    color: colors.bg,
  },
});
