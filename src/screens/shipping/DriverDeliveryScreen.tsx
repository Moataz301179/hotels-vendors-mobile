/**
 * Driver Delivery List Screen — Shows assigned deliveries for today
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { Truck, MapPin, Clock, Package, CheckCircle, Camera, Signature } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface DeliveryStop {
  id: string;
  stopNumber: number;
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  estimatedArrival: string;
  status: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  itemCount: number;
}

interface TripData {
  tripId: string;
  tripNumber: string;
  driverName: string;
  vehiclePlate: string;
  scheduledDate: string;
  status: string;
  stops: DeliveryStop[];
  completedStops: number;
  totalStops: number;
}

export default function DriverDeliveryScreen({ navigation }: any) {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrip = async () => {
    try {
      const { data: res } = await api.get("/shipping/driver/today");
      if (res.success) setTrip(res.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchTrip(); }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return colors.success;
      case "ARRIVED": return colors.info;
      case "IN_TRANSIT": return colors.warning;
      case "FAILED": return colors.error;
      default: return colors.textMuted;
    }
  };

  const progress = trip ? (trip.completedStops / Math.max(trip.totalStops, 1)) * 100 : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrip(); }} tintColor={colors.primary} />}
    >
      {/* Trip Header */}
      {trip && (
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Truck size={20} color={colors.primary} />
            <View>
              <Text style={styles.tripNumber}>{trip.tripNumber}</Text>
              <Text style={styles.tripDate}>{new Date(trip.scheduledDate).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={styles.vehicleBadge}>
            <Text style={styles.vehicleText}>{trip.vehiclePlate}</Text>
          </View>
        </View>
      )}

      {/* Progress Bar */}
      {trip && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Delivery Progress</Text>
            <Text style={styles.progressCount}>{trip.completedStops}/{trip.totalStops}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {/* Delivery List */}
      <Text style={styles.sectionTitle}>Today&apos;s Deliveries</Text>
      {trip?.stops?.length ? trip.stops.map((stop) => (
        <TouchableOpacity
          key={stop.id}
          style={[styles.stopCard, stop.status === "DELIVERED" && styles.stopCardCompleted]}
          onPress={() => navigation.navigate("PODScreen", { stopId: stop.id, tripId: trip.tripId })}
        >
          <View style={styles.stopHeader}>
            <View style={[styles.stopNumber, { backgroundColor: statusColor(stop.status) + "20" }]}>
              <Text style={[styles.stopNumberText, { color: statusColor(stop.status) }]}>{stop.stopNumber}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.hotelName}>{stop.hotelName}</Text>
              <Text style={styles.hotelAddress}>{stop.hotelAddress || stop.hotelCity}</Text>
            </View>
            {stop.status === "DELIVERED" ? (
              <CheckCircle size={20} color={colors.success} />
            ) : (
              <MapPin size={16} color={colors.textMuted} />
            )}
          </View>

          <View style={styles.stopDetails}>
            <View style={styles.detailItem}>
              <Package size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{stop.itemCount} items</Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{new Date(stop.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.orderTotal}>EGP {stop.orderTotal.toLocaleString()}</Text>
            </View>
          </View>

          {stop.status !== "DELIVERED" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.podBtn}
                onPress={() => navigation.navigate("PODScreen", { stopId: stop.id, tripId: trip.tripId })}
              >
                <Camera size={14} color="#fff" />
                <Text style={styles.podBtnText}>Capture POD</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      )) : (
        <View style={styles.emptyCard}>
          <Truck size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No deliveries today</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  tripHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  tripInfo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tripNumber: { ...typography.body, color: colors.text, fontWeight: "600" },
  tripDate: { ...typography.caption, color: colors.textMuted },
  vehicleBadge: { backgroundColor: colors.primary + "20", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
  vehicleText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  progressCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  progressLabel: { ...typography.bodySmall, color: colors.textSecondary },
  progressCount: { ...typography.body, color: colors.text, fontWeight: "600" },
  progressBg: { height: 6, backgroundColor: colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: colors.success, borderRadius: 3 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  stopCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  stopCardCompleted: { opacity: 0.6 },
  stopHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  stopNumber: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  stopNumberText: { ...typography.body, fontWeight: "700" },
  stopInfo: { flex: 1 },
  hotelName: { ...typography.body, color: colors.text, fontWeight: "600" },
  hotelAddress: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  stopDetails: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { ...typography.bodySmall, color: colors.textSecondary },
  orderTotal: { ...typography.body, color: colors.primary, fontWeight: "600" },
  actionRow: { marginTop: spacing.md },
  podBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: radii.sm },
  podBtnText: { ...typography.body, color: "#fff", fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.xxl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
});
