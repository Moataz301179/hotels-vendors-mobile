/**
 * HOVIN Field — Logistics & Tracking
 *
 * GPS-guided dispatching for the field operator. Shows the live shipment
 * queue with per-order status, the operator's live GPS coordinates (expo-location)
 * and a haversine distance to the next destination, a routing/progress view,
 * and a Proof-of-Delivery (POD) entry point that reuses the existing POD screen.
 *
 * If GPS or the backend is unavailable, the screen degrades gracefully to a
 * clearly-labelled demo/graceless-note state rather than failing hard.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator, Linking, Alert,
} from "react-native";
import * as Location from "expo-location";
import {
  Navigation, MapPin, Truck, PackageCheck, Navigation2, Camera, WifiOff, Clock,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fieldAPI } from "@/api";
import { fmtMoney, fmtDate } from "@/utils/format";

interface Shipment {
  id: string;
  orderNumber: string;
  status: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelCity?: string;
  lat: number;
  lng: number;
  orderTotal: number;
  itemCount: number;
  eta?: string;
}

const DEMO_SHIPMENTS: Shipment[] = [
  {
    id: "demo-s1", orderNumber: "PO-10234", status: "READY",
    hotelName: "Grand Nile Tower", hotelCity: "Cairo", lat: 30.0411, lng: 31.2297,
    orderTotal: 18400, itemCount: 12, eta: new Date(Date.now() + 3600000).toISOString(),
  },
  {
    id: "demo-s2", orderNumber: "PO-10235", status: "IN_TRANSIT",
    hotelName: "Sofitel Winter Palace", hotelCity: "Luxor", lat: 25.6969, lng: 32.6436,
    orderTotal: 6200, itemCount: 6, eta: new Date(Date.now() + 7200000).toISOString(),
  },
];

/** Approximate great-circle distance between two coordinates (km). */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export default function LogisticsTrackingScreen({ navigation }: any) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsUnavailable, setGpsUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPosition = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsUnavailable(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGps({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setGpsUnavailable(false);
    } catch {
      setGpsUnavailable(true);
    }
  }, []);

  const fetchShipments = useCallback(async (silent = false) => {
    try {
      const { data } = await fieldAPI.logistics();
      if (data.success && data.data) {
        setShipments(data.data.shipments ?? data.data.trips ?? []);
        setDemoMode(false);
      } else {
        setDemoMode(true);
        if (!silent) setShipments(DEMO_SHIPMENTS);
      }
    } catch {
      setDemoMode(true);
      if (!silent) setShipments(DEMO_SHIPMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosition();
    fetchShipments();
  }, [loadPosition, fetchShipments]);

  // Keep GPS fresh while the operator is on the screen.
  useEffect(() => {
    if (gpsUnavailable) return;
    const t = setInterval(loadPosition, 20000);
    return () => clearInterval(t);
  }, [gpsUnavailable, loadPosition]);

  /** Open turn-by-turn guidance in the OS maps app (graceful no-op fallback). */
  const startNavigation = (s: Shipment) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Navigation unavailable", "Could not open the maps app on this device.")
    );
  };

  const statusColor = (s: string) =>
    s === "DELIVERED" ? colors.success : s === "IN_TRANSIT" ? "#D4AF37" : colors.info;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Loading shipments…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchShipments(false); loadPosition(); }}
          tintColor={colors.primary}
        />
      }
    >
      {demoMode ? (
        <View style={styles.demoBanner}>
          <WifiOff size={14} color={colors.warning} />
          <Text style={styles.demoBannerText}>Offline demo data — backend unreachable.</Text>
        </View>
      ) : null}

      {/* GPS status card */}
      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Navigation2 size={18} color={colors.primary} />
          <Text style={styles.gpsTitle}>Operator Position</Text>
        </View>
        {gps ? (
          <Text style={styles.gpsCoords}>
            {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.gpsCoords}>
            {gpsUnavailable ? "GPS unavailable — enable location for live routing" : "Acquiring GPS…"}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Live Shipments</Text>

      {shipments.length === 0 ? (
        <View style={styles.emptyCard}>
          <Truck size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No active shipments</Text>
        </View>
      ) : (
        shipments.map((s) => {
          const distance =
            gps && !gpsUnavailable
              ? haversineKm(gps.lat, gps.lng, s.lat, s.lng).toFixed(1)
              : null;
          const sc = statusColor(s.status);
          const delivered = s.status === "DELIVERED";

          return (
            <View key={s.id} style={styles.shipmentCard}>
              <View style={styles.shipHeader}>
                <View style={styles.shipInfo}>
                  <Text style={styles.orderNum}>{s.orderNumber}</Text>
                  <Text style={styles.muted}>{s.hotelName || "Hotel"}{s.hotelCity ? ` · ${s.hotelCity}` : ""}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc + "22" }]}>
                  <Text style={[styles.badgeText, { color: sc }]}>{s.status.replace("_", " ")}</Text>
                </View>
              </View>

              <View style={styles.shipMeta}>
                <View style={styles.metaRow}>
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{s.hotelAddress || `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`}</Text>
                </View>
                <View style={styles.metaRow}>
                  <PackageCheck size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{s.itemCount} items · {fmtMoney(s.orderTotal)}</Text>
                </View>
                {s.eta ? (
                  <View style={styles.metaRow}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.metaText}>ETA {fmtDate(s.eta)}</Text>
                  </View>
                ) : null}
              </View>

              {distance !== null && (
                <View style={styles.distanceRow}>
                  <Navigation size={14} color={colors.primary} />
                  <Text style={styles.distanceText}>{distance} km from operator</Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.navBtn} onPress={() => startNavigation(s)}>
                  <Navigation2 size={15} color="#fff" />
                  <Text style={styles.navBtnText}>Route</Text>
                </TouchableOpacity>
                {!delivered && (
                  <TouchableOpacity
                    style={styles.podBtn}
                    onPress={() => navigation.navigate("PODScreen", { stopId: s.id, tripId: s.id })}
                  >
                    <Camera size={15} color={colors.primary} />
                    <Text style={styles.podBtnText}>Capture POD</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: spacing.md },
  centerText: { ...typography.body, color: colors.textMuted },
  demoBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.warning + "18", padding: spacing.sm, borderRadius: radii.md,
  },
  demoBannerText: { ...typography.caption, color: colors.warning, flex: 1 },
  gpsCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.xs,
  },
  gpsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  gpsTitle: { ...typography.h3, color: colors.text },
  gpsCoords: { ...typography.bodySmall, color: colors.textSecondary, fontVariant: ["tabular-nums"] },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  shipmentCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  shipHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  shipInfo: { flex: 1, marginRight: spacing.md },
  orderNum: { ...typography.h3, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full },
  badgeText: { ...typography.caption, fontWeight: "700", textTransform: "uppercase" },
  shipMeta: { gap: spacing.xs },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  distanceRow: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.primary + "12", padding: spacing.sm, borderRadius: radii.md,
  },
  distanceText: { ...typography.bodySmall, color: colors.primary, fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  navBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: radii.md,
  },
  navBtnText: { ...typography.body, color: "#fff", fontWeight: "600" },
  podBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.primary + "14", paddingVertical: spacing.sm, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.primary + "44",
  },
  podBtnText: { ...typography.body, color: colors.primary, fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, alignItems: "center", gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textMuted },
});
