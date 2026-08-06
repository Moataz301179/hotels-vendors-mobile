/**
 * Order Detail — PO number, status, delivery, tracking, GRN, invoices
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";
import { orderStatusColor, orderStatusLabel, fmtMoney, fmtDate } from "@/utils/format";
import { ChevronRight, Package, Calendar, MapPin, ClipboardCheck, FileText, Truck, Clock, CheckCircle, XCircle } from "lucide-react-native";

interface OrderDetail {
  id: string;
  orderNumber: string;
  poNumber?: string | null;
  status: string;
  currency: string;
  deliveryDate?: string | null;
  deliveryAddress?: string | null;
  deliveryInstructions?: string | null;
  shippingMethod?: string | null;
  estimatedDelivery?: string | null;
  subtotal?: number | string | null;
  vatAmount?: number | string | null;
  total?: number | string | null;
  shippingCost?: number | string | null;
  createdAt: string;
  hotel?: { id: string; name: string; city?: string | null };
  items: {
    id: string;
    quantity: number;
    receivedQuantity?: number | null;
    unitPrice?: number | string | null;
    product: { id: string; name: string; sku?: string | null; unitOfMeasure?: string | null };
  }[];
  invoices: { id: string; invoiceNumber: string; total?: number | string | null; status: string; etaStatus?: string | null }[];
  tripStops: {
    id: string;
    stopOrder: number;
    status: string;
    estimatedArrival?: string | null;
    actualArrival?: string | null;
    arrivedAt?: string | null;
    trip: { tripNumber: string; driverName?: string | null; driverPhone?: string | null; vehiclePlate?: string | null; status: string; arrivalDate?: string | null };
  }[];
  goodsReceiptNotes: { id: string; grnNumber: string; status: string; receivedAt: string; vehiclePlate?: string | null; deliveryNoteRef?: string | null; notes?: string | null }[];
}

const STATUS_STEPS = ["APPROVED", "CONFIRMED", "IN_TRANSIT", "DELIVERED"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, accent, icon }: { label: string; value?: string | null; accent?: boolean; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, accent && { color: colors.primary }]}>{value}</Text>
    </View>
  );
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supplierAPI.order(id);
      if (data.success && data.data) setOrder(data.data.order);
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const inTransit = order.tripStops.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: orderStatusColor(order.status) + "22" }]}>
          <Text style={[styles.badgeText, { color: orderStatusColor(order.status) }]}>{orderStatusLabel(order.status)}</Text>
        </View>
      </View>

      <Text style={styles.hotelName}>{order.hotel?.name || "Hotel"}{order.hotel?.city ? ` · ${order.hotel.city}` : ""}</Text>

      {order.poNumber ? (
        <View style={styles.poBox}>
          <FileText size={14} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
          <Text style={styles.poLabel}>PO NUMBER</Text>
          <Text style={styles.poValue}>{order.poNumber}</Text>
        </View>
      ) : null}

      <Section title="Delivery">
        <Row label="Delivery date" value={fmtDate(order.deliveryDate)} icon={<Calendar size={16} color={colors.textMuted} />} />
        <Row label="Address" value={order.deliveryAddress} icon={<MapPin size={16} color={colors.textMuted} />} />
        <Row label="Shipping method" value={order.shippingMethod} icon={<Truck size={16} color={colors.textMuted} />} />
        <Row label="Instructions" value={order.deliveryInstructions} icon={<Package size={16} color={colors.textMuted} />} />
      </Section>

      <Section title="Items">
        {order.items.map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.product.name}</Text>
              {it.product.sku ? <Text style={styles.muted}>SKU: {it.product.sku}</Text> : null}
            </View>
            <Text style={styles.itemQty}>
              {it.quantity} × {it.product.unitOfMeasure || "pc"}
              {it.receivedQuantity != null ? ` (rcvd ${it.receivedQuantity})` : ""}
            </Text>
          </View>
        ))}
        <View style={styles.totalBox}>
          <Row label="Subtotal" value={fmtMoney(order.subtotal)} />
          {order.shippingCost ? <Row label="Shipping" value={fmtMoney(order.shippingCost)} /> : null}
          {order.vatAmount ? <Row label="VAT" value={fmtMoney(order.vatAmount)} /> : null}
          <Row label="Total" value={fmtMoney(order.total)} accent />
        </View>
      </Section>

      <Section title="Order Timeline">
        {STATUS_STEPS.map((step) => {
          const idx = STATUS_STEPS.indexOf(step);
          const reached = STATUS_STEPS.indexOf(order.status as never) >= idx;
          return (
            <View key={step} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: reached ? colors.success : colors.border }]} />
              <Text style={[styles.timelineText, { color: reached ? colors.text : colors.textMuted }]}>{orderStatusLabel(step)}</Text>
            </View>
          );
        })}
      </Section>

      {inTransit ? (
        <Section title="Tracking">
            {order.tripStops.map((stop) => (
            <View key={stop.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                  <Truck size={18} color={colors.textSecondary} />
                  <Text style={styles.cardTitle}>{stop.trip.tripNumber}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: orderStatusColor(stop.status) + "22" }]}>
                  <Text style={[styles.badgeText, { color: orderStatusColor(stop.status) }]}>{orderStatusLabel(stop.status)}</Text>
                </View>
              </View>
              <Row label="Driver" value={stop.trip.driverName} icon={<Package size={16} color={colors.textMuted} />} />
              <Row label="Driver phone" value={stop.trip.driverPhone} icon={<Package size={16} color={colors.textMuted} />} />
              <Row label="Vehicle" value={stop.trip.vehiclePlate} icon={<Truck size={16} color={colors.textMuted} />} />
              <Row label="ETA" value={fmtDate(stop.estimatedArrival || stop.trip.arrivalDate)} icon={<Clock size={16} color={colors.textMuted} />} />
              {stop.arrivedAt ? <Row label="Arrived" value={fmtDate(stop.arrivedAt)} icon={<CheckCircle size={16} color={colors.success} />} /> : null}
            </View>
          ))}
        </Section>
      ) : null}

      {order.goodsReceiptNotes.length > 0 ? (
        <Section title="Goods Received (GRN)">
          {order.goodsReceiptNotes.map((g) => (
            <View key={g.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                  <ClipboardCheck size={18} color={colors.textSecondary} />
                  <Text style={styles.cardTitle}>{g.grnNumber}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: orderStatusColor(g.status) + "22" }]}>
                  <Text style={[styles.badgeText, { color: orderStatusColor(g.status) }]}>{orderStatusLabel(g.status)}</Text>
                </View>
              </View>
              <Row label="Received" value={fmtDate(g.receivedAt)} icon={<Calendar size={16} color={colors.textMuted} />} />
              <Row label="Vehicle" value={g.vehiclePlate} icon={<Truck size={16} color={colors.textMuted} />} />
              <Row label="Delivery note" value={g.deliveryNoteRef} icon={<MapPin size={16} color={colors.textMuted} />} />
            </View>
          ))}
        </Section>
      ) : null}

      {order.invoices.length > 0 ? (
        <Section title="Invoices">
          {order.invoices.map((inv) => (
            <View key={inv.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                  <FileText size={18} color={colors.textSecondary} />
                  <Text style={styles.cardTitle}>{inv.invoiceNumber}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: orderStatusColor(inv.status) + "22" }]}>
                  <Text style={[styles.badgeText, { color: orderStatusColor(inv.status) }]}>{orderStatusLabel(inv.status)}</Text>
                </View>
              </View>
              <Row label="Amount" value={fmtMoney(inv.total)} accent icon={<FileText size={16} color={colors.textMuted} />} />
              {inv.etaStatus ? <Row label="ETA" value={inv.etaStatus} icon={<CheckCircle size={16} color={colors.textMuted} />} /> : null}
            </View>
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  backLink: { color: colors.primary, ...typography.bodySmall },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNumber: { ...typography.h2, color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { ...typography.label, textTransform: "uppercase" },
  hotelName: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  poBox: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary + "44", borderRadius: radii.md, padding: spacing.md, marginTop: spacing.lg },
  poLabel: { ...typography.caption, color: colors.textMuted, letterSpacing: 1 },
  poValue: { ...typography.h3, color: colors.primary, marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  rowLabel: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  rowValue: { ...typography.bodySmall, color: colors.text, flex: 1.6, textAlign: "right" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { ...typography.body, color: colors.text },
  itemQty: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: spacing.md },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  totalBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.bgCard, borderRadius: radii.md },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineText: { ...typography.body },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.text },
});
