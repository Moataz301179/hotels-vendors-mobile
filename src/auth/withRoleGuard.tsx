/**
 * withRoleGuard — Mobile Role-Based Access Control
 * INVO Mobile App
 *
 * Wraps any screen component to enforce role-based access.
 * Redirects unauthorized users to their role's home screen.
 *
 * Usage:
 *   export default withRoleGuard(AdminScreen, ["ADMIN"]);
 *   export default withRoleGuard(FactoringScreen, ["SUPPLIER", "FACTORING"]);
 *   export default withRoleGuard(OrderDetailScreen); // any authenticated user
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types";

interface WithRoleGuardOptions {
  /** Roles allowed to access this screen. Omit to allow any authenticated user. */
  allowedRoles?: UserRole[];
  /** Custom message when access is denied */
  accessDeniedMessage?: string;
  /** Custom fallback screen (instead of default AccessDenied) */
  fallback?: React.ComponentType;
}

const defaultAccessDeniedMessage =
  "This section is only accessible to authorized users. Contact your administrator if you believe this is an error.";

/**
 * Higher-order component that wraps a screen with role-based access control.
 * If the user's role is not in allowedRoles, renders an access denied screen.
 * If allowedRoles is omitted, any authenticated user can access the screen.
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: WithRoleGuardOptions = {}
): React.ComponentType<P> {
  const { allowedRoles, accessDeniedMessage, fallback: FallbackComponent } = options;

  function GuardedComponent(props: P) {
    const { role, isAuthenticated, isLoading } = useAuthStore();

    // Still loading auth state — show nothing or loading
    if (isLoading) {
      return null;
    }

    // Not authenticated — won't reach here normally (AppNavigator handles auth)
    if (!isAuthenticated) {
      return null;
    }

    // No role restriction — allow access
    if (!allowedRoles || allowedRoles.length === 0) {
      return <Component {...props} />;
    }

    // Check role
    if (role && allowedRoles.includes(role)) {
      return <Component {...props} />;
    }

    // Render fallback if provided
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    // Default: Access Denied
    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🚫</Text>
        </View>
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>
          {accessDeniedMessage || defaultAccessDeniedMessage}
        </Text>
        <Text style={styles.roleHint}>Your role: {role || "Unknown"}</Text>
      </View>
    );
  }

  GuardedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name || "Component"})`;
  return GuardedComponent;
}

/**
 * Route configuration: maps URL screens to required roles.
 * Import this from AppNavigator.tsx to enforce role-based routing.
 */
export const ROLE_ROUTE_MAP: Record<string, UserRole[]> = {
  // Auth screens — no role restriction
  Login: [],
  Register: [],
  Otp: [],
  OtpLogin: [],
  ForgotPassword: [],

  // Hotel Buyer screens
  HotelMain: ["HOTEL", "ADMIN"],
  HotelHomeScreen: ["HOTEL", "ADMIN"],
  CatalogScreen: ["HOTEL", "SUPPLIER", "ADMIN"],
  CartScreen: ["HOTEL", "ADMIN"],
  OrdersScreen: ["HOTEL", "ADMIN"],
  InvoicesScreen: ["HOTEL", "ADMIN"],
  InvoiceDetailScreen: ["HOTEL", "ADMIN"],
  PaymentScreen: ["HOTEL", "ADMIN"],
  HotelCashflowScreen: ["HOTEL", "ADMIN"],
  HotelCreditScreen: ["HOTEL", "ADMIN"],
  HotelFinancingScreen: ["HOTEL", "ADMIN"],
  ScheduledOrdersScreen: ["HOTEL", "ADMIN"],
  InventoryBalanceScreen: ["HOTEL", "ADMIN"],

  // Supplier screens
  SupplierMain: ["SUPPLIER", "ADMIN"],
  SupplierDashboardScreen: ["SUPPLIER", "ADMIN"],
  SupplierOrdersScreen: ["SUPPLIER", "ADMIN"],
  SupplierCatalogScreen: ["SUPPLIER", "ADMIN"],
  OrderDetailScreen: ["HOTEL", "SUPPLIER", "SHIPPING", "ADMIN"],
  GrnScreen: ["SUPPLIER", "ADMIN"],
  ProfileScreen: ["HOTEL", "SUPPLIER", "SHIPPING", "ADMIN"],
  OlivActivationScreen: ["SUPPLIER", "ADMIN"],
  OlivKycStatusScreen: ["SUPPLIER", "ADMIN"],
  InvoiceUploadScreen: ["SUPPLIER", "ADMIN"],
  CreditFacilityScreen: ["SUPPLIER", "FACTORING", "ADMIN"],
  FactoringHistoryScreen: ["SUPPLIER", "FACTORING", "ADMIN"],
  MarketplaceScreen: ["SUPPLIER", "FACTORING", "ADMIN"],
  FactoringOfferDetailScreen: ["SUPPLIER", "FACTORING", "ADMIN"],

  // Shipping/Carrier screens
  ShippingMain: ["SHIPPING", "ADMIN"],
  DriverDeliveryScreen: ["SHIPPING", "ADMIN"],
  PODScreen: ["SHIPPING", "ADMIN"],

  // Shared screens
  NotificationCenterScreen: ["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"],
  OnboardingProgressScreen: ["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"],
  AiAssistantScreen: ["HOTEL", "SUPPLIER", "SHIPPING", "FACTORING", "ADMIN"],
  CategoryGridDemoScreen: ["HOTEL", "SUPPLIER", "ADMIN"],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0c0c12",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(220,38,38,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#a0a0b0",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  roleHint: {
    fontSize: 12,
    color: "#7a7a92",
    marginTop: 16,
    fontFamily: "monospace",
  },
});