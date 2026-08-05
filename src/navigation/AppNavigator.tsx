/**
 * App Navigation
 * Role-based routing: Auth → Hotel Buyer tabs / Supplier tabs
 */

import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";

// Auth screens
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";

// Hotel screens
import HotelHomeScreen from "@/screens/hotel/HotelHomeScreen";
import CatalogScreen from "@/screens/hotel/CatalogScreen";
import CartScreen from "@/screens/hotel/CartScreen";
import OrdersScreen from "@/screens/hotel/OrdersScreen";
import InvoicesScreen from "@/screens/hotel/InvoicesScreen";

// Supplier screens
import SupplierDashboardScreen from "@/screens/supplier/SupplierDashboardScreen";
import SupplierOrdersScreen from "@/screens/supplier/SupplierOrdersScreen";
import OlivActivationScreen from "@/screens/supplier/OlivActivationScreen";
import InvoiceUploadScreen from "@/screens/supplier/InvoiceUploadScreen";
import CreditFacilityScreen from "@/screens/supplier/CreditFacilityScreen";
import FactoringHistoryScreen from "@/screens/supplier/FactoringHistoryScreen";

const Stack = createNativeStackNavigator();
const FinanceStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "600" as const },
  contentStyle: { backgroundColor: colors.bg },
};

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "600" as const },
};

function HotelTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder, paddingBottom: 4 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" as const },
      }}
    >
      <Tab.Screen name="Home" component={HotelHomeScreen} options={{ title: "INVO", tabBarLabel: "Home" }} />
      <Tab.Screen name="CatalogTab" component={CatalogScreen} options={{ title: "Catalog", tabBarLabel: "Catalog" }} />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ title: "Cart", tabBarLabel: "Cart" }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: "Orders", tabBarLabel: "Orders" }} />
      <Tab.Screen name="InvoicesTab" component={InvoicesScreen} options={{ title: "Invoices", tabBarLabel: "Invoices" }} />
    </Tab.Navigator>
  );
}

function FinanceStack() {
  return (
    <FinanceStackNav.Navigator screenOptions={stackScreenOptions}>
      <FinanceStackNav.Screen name="OlivActivation" component={OlivActivationScreen} options={{ title: "Oliv Financing" }} />
      <FinanceStackNav.Screen name="InvoiceUpload" component={InvoiceUploadScreen} options={{ title: "Upload Invoice" }} />
      <FinanceStackNav.Screen name="CreditFacility" component={CreditFacilityScreen} options={{ title: "Credit Facility" }} />
      <FinanceStackNav.Screen name="FactoringHistory" component={FactoringHistoryScreen} options={{ title: "Factoring History" }} />
    </FinanceStackNav.Navigator>
  );
}

function SupplierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder, paddingBottom: 4 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" as const },
      }}
    >
      <Tab.Screen name="Dashboard" component={SupplierDashboardScreen} options={{ title: "Vendor Central" }} />
      <Tab.Screen name="Orders" component={SupplierOrdersScreen} options={{ title: "Orders" }} />
      <Tab.Screen name="Finance" component={FinanceStack} options={{ title: "Finance", tabBarLabel: "Finance" }} />
      <Tab.Screen name="Invoices" component={InvoiceUploadScreen} options={{ title: "Invoices", tabBarLabel: "Invoices" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, role, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : role === "SUPPLIER" ? (
          <Stack.Screen name="SupplierMain" component={SupplierTabs} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="HotelMain" component={HotelTabs} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
