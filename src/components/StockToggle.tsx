/**
 * StockToggle — INVO Mobile
 * Fast stock status toggle for supplier inventory
 *
 * One-tap switch between In Stock / Out of Stock.
 * Updates product status immediately via API with optimistic UI.
 */

import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";

interface StockToggleProps {
  productId: string;
  productName: string;
  initialStock: number;
  initialInStock: boolean;
  onToggle?: (newStatus: boolean) => void;
}

export function StockToggle({
  productId,
  productName,
  initialStock,
  initialInStock,
  onToggle,
}: StockToggleProps) {
  const [inStock, setInStock] = useState(initialInStock);
  const [stock, setStock] = useState(initialStock);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    const newStatus = !inStock;
    setInStock(newStatus);
    setLoading(true);

    try {
      const { data } = await supplierAPI.inventory({
        productId,
        inStock: newStatus,
      } as any);

      if (!data?.success) {
        setInStock(!newStatus); // revert
      } else {
        onToggle?.(newStatus);
        // Update stock from server response
        if (data.data?.stockQuantity !== undefined) {
          setStock(data.data.stockQuantity);
        }
      }
    } catch {
      setInStock(!newStatus); // revert on error
    } finally {
      setLoading(false);
    }
  }, [inStock, productId, onToggle]);

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{productName}</Text>
        <Text style={styles.stockCount}>
          {stock} {stock === 1 ? "unit" : "units"} available
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.toggle,
          inStock ? styles.toggleOn : styles.toggleOff,
          loading && styles.toggleDisabled,
        ]}
        onPress={handleToggle}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={inStock ? "#10B981" : colors.textMuted} />
        ) : (
          <>
            <View style={[styles.toggleDot, inStock ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.toggleLabel, inStock ? styles.labelOn : styles.labelOff]}>
              {inStock ? "In Stock" : "Out of Stock"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  productName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
  },
  stockCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    minWidth: 120,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.3)",
  },
  toggleOff: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: "#10B981",
  },
  dotOff: {
    backgroundColor: colors.textMuted,
  },
  toggleLabel: {
    ...typography.bodySmall,
    fontWeight: "600",
  },
  labelOn: {
    color: "#10B981",
  },
  labelOff: {
    color: colors.textMuted,
  },
});