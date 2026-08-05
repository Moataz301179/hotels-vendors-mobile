/**
 * Cart Screen — Hotel Buyer
 */

import React from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useCartStore } from "@/store/cart";
import { orderAPI } from "@/api";
import type { CartItem } from "@/types";

export default function CartScreen({ navigation }: any) {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    try {
      const { data } = await orderAPI.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
      });
      if (data.success) {
        clearCart();
        Alert.alert("Order Placed", "Your order has been submitted for approval.");
        navigation.navigate("OrdersTab");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to place order");
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>EGP {item.price.toLocaleString()} / {item.unit}</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.productId)}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>}
      />

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>EGP {totalPrice().toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handlePlaceOrder}>
            <Text style={styles.checkoutBtnText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  itemInfo: { flex: 1, marginRight: spacing.md },
  itemName: { ...typography.h3, color: colors.text },
  itemPrice: { ...typography.bodySmall, color: colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: colors.text, fontSize: 18, fontWeight: "600" },
  qtyText: { ...typography.body, color: colors.text, fontWeight: "600", minWidth: 24, textAlign: "center" },
  removeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginLeft: spacing.sm },
  removeBtnText: { color: colors.error, fontSize: 16 },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  totalLabel: { ...typography.h3, color: colors.textSecondary },
  totalValue: { ...typography.h2, color: colors.primary },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.lg, alignItems: "center" },
  checkoutBtnText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 3 },
});
