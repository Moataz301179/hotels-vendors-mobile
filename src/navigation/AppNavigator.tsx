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
import { useNotificationStore } from "@/store/notifications";
import {
  Home, ShoppingBasket, Package, ShoppingCart, FileText,
  LayoutDashboard, ClipboardList, Layers, BarChart3, User, Bot,
} from "lucide-react-native";

// Auth screens
import LoginScreen from "@/screens/auth/LoginScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";
import OtpScreen from "@/screens/auth/OtpScreen";
import OtpLoginScreen from "@/screens/auth/OtpLoginScreen";

// Hotel screens
import HotelHomeScreen from "@/screens/hotel/HotelHomeScreen";
import CatalogScreen from "@/screens/hotel/CatalogScreen";
import CartScreen from "@/screens/hotel/CartScreen";
import OrdersScreen from "@/screens/hotel/OrdersScreen";
import InvoicesScreen from "@/screens/hotel/InvoicesScreen";
import InvoiceDetailScreen from "@/screens/hotel/InvoiceDetailScreen";
import PaymentScreen from "@/screens/hotel/PaymentScreen";
import NotificationCenterScreen from "@/screens/NotificationCenterScreen";
import AiAssistantScreen from "@/screens/AiAssistantScreen";
import HotelCreditScreen from "@/screens/hotel/HotelCreditScreen";
import HotelCashflowScreen from "@/screens/hotel/HotelCashflowScreen";
import HotelFinancingScreen from "@/screens/hotel/HotelFinancingScreen";
import ScheduledOrdersScreen from "@/screens/hotel/ScheduledOrdersScreen";
import InventoryBalanceScreen from "@/screens/hotel/InventoryBalanceScreen";

// Supplier screens
import SupplierDashboardScreen from "@/screens/supplier/SupplierDashboardScreen";
import SupplierOrdersScreen from "@/screens/supplier/SupplierOrdersScreen";
import SupplierCatalogScreen from "@/screens/supplier/SupplierCatalogScreen";
import GrnScreen from "@/screens/supplier/GrnScreen";
import OrderDetailScreen from "@/screens/supplier/OrderDetailScreen";
import ProfileScreen from "@/screens/supplier/ProfileScreen";
import OlivActivationScreen from "@/screens/supplier/OlivActivationScreen";
import OlivKycStatusScreen from "@/screens/supplier/OlivKycStatusScreen";
import InvoiceUploadScreen from "@/screens/supplier/InvoiceUploadScreen";
import CreditFacilityScreen from "@/screens/supplier/CreditFacilityScreen";
import FactoringHistoryScreen from "@/screens/supplier/FactoringHistoryScreen";
import MarketplaceScreen from "@/screens/supplier/MarketplaceScreen";
import FactoringOfferDetailScreen from "@/screens/supplier/FactoringOfferDetailScreen";

const Stack = createNativeStackNavigator();
const FinanceStackNav = createNativeStackNavigator();
const HotelFinanceStackNav = createNativeStackNavigator();
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
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder, paddingBottom: 4, height: 70 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" as const },
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home" component={HotelHomeScreen}
        options={{ title: "INVO", tabBarLabel: "Home", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }}
      />
      <Tab.Screen
        name="CatalogTab" component={CatalogScreen}
        options={{ title: "Catalog", tabBarLabel: "Catalog", tabBarIcon: ({ color, size }) => <ShoppingBasket size={size} color={color} /> }}
      />
      <Tab.Screen
        name="CartTab" component={CartScreen}
        options={{ title: "Cart", tabBarLabel: "Cart", tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} /> }}
      />
      <Tab.Screen
        name="OrdersTab" component={OrdersScreen}
        options={{ title: "Orders", tabBarLabel: "Orders", tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} /> }}
      />
      <Tab.Screen
        name="InvoicesTab" component={InvoicesScreen}
        options={{ title: "Invoices", tabBarLabel: "Invoices", tabBarIcon: ({ color, size }) => <FileText size={size} color={color} /> }}
      />
      <Tab.Screen
        name="FinanceTab" component={HotelFinanceStack}
        options={{ title: "Finance", tabBarLabel: "Finance", tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} /> }}
      />
      <Tab.Screen
        name="AssistantTab" component={AiAssistantScreen}
        options={{ title: "AI Assistant", tabBarLabel: "Assistant", tabBarIcon: ({ color, size }) => <Bot size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function HotelFinanceStack() {
  return (
    <HotelFinanceStackNav.Navigator screenOptions={stackScreenOptions}>
      <HotelFinanceStackNav.Screen name="HotelCashflow" component={HotelCashflowScreen} options={{ title: "Cashflow" }} />
      <HotelFinanceStackNav.Screen name="HotelCredit" component={HotelCreditScreen} options={{ title: "Credit Overview" }} />
      <HotelFinanceStackNav.Screen name="HotelFinancing" component={HotelFinancingScreen} options={{ title: "Financing" }} />
      <HotelFinanceStackNav.Screen name="ScheduledOrders" component={ScheduledOrdersScreen} options={{ title: "Scheduled Orders" }} />
      <HotelFinanceStackNav.Screen name="InventoryBalance" component={InventoryBalanceScreen} options={{ title: "Inventory Balance" }} />
    </HotelFinanceStackNav.Navigator>
  );
}

function FinanceStack() {
  return (
    <FinanceStackNav.Navigator screenOptions={stackScreenOptions}>
      <FinanceStackNav.Screen name="OlivActivation" component={OlivActivationScreen} options={{ title: "Oliv Financing" }} />
      <FinanceStackNav.Screen name="OlivKycStatus" component={OlivKycStatusScreen} options={{ title: "KYC Status" }} />
      <FinanceStackNav.Screen name="InvoiceUpload" component={InvoiceUploadScreen} options={{ title: "Upload Invoice" }} />
      <FinanceStackNav.Screen name="CreditFacility" component={CreditFacilityScreen} options={{ title: "Credit Facility" }} />
       <FinanceStackNav.Screen name="FactoringHistory" component={FactoringHistoryScreen} options={{ title: "Factoring History" }} />
       <FinanceStackNav.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: "Factoring Marketplace" }} />
       <FinanceStackNav.Screen name="FactoringOfferDetail" component={FactoringOfferDetailScreen} options={{ title: "Offer Details" }} />
     </FinanceStackNav.Navigator>
  );
}

function SupplierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder, paddingBottom: 4, height: 70 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "600" as const },
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="DashboardTab" component={SupplierDashboardScreen}
        options={{
          title: "Vendor Central", tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab" component={SupplierOrdersScreen}
        options={{
          title: "Orders", tabBarLabel: "Orders",
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CatalogTab" component={SupplierCatalogScreen}
        options={{
          title: "Catalog", tabBarLabel: "Catalog",
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="FinanceTab" component={FinanceStack}
        options={{
          title: "Finance", tabBarLabel: "Finance",
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab" component={ProfileScreen}
        options={{
          title: "Profile", tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AssistantTab" component={AiAssistantScreen}
        options={{
          title: "AI Assistant", tabBarLabel: "Assistant",
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      />
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
            <Stack.Screen name="Otp" component={OtpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OtpLogin" component={OtpLoginScreen} options={{ headerShown: false }} />
          </>
         ) : role === "SUPPLIER" ? (
          <>
            <Stack.Screen name="SupplierMain" component={SupplierTabs} options={{ headerShown: false }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
            <Stack.Screen name="SupplierGrn" component={GrnScreen} options={{ title: "Goods Received (GRN)" }} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ title: "Notifications" }} />
          </>
        ) : (
           <>
             <Stack.Screen name="HotelMain" component={HotelTabs} options={{ headerShown: false }} />
             <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: "Order" }} />
             <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "Invoice" }} />
             <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ title: "Payment", presentation: "modal" }} />
             <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} options={{ title: "Notifications" }} />
             <Stack.Screen name="HotelCashflow" component={HotelCashflowScreen} options={{ title: "Cashflow" }} />
             <Stack.Screen name="HotelCredit" component={HotelCreditScreen} options={{ title: "Credit Overview" }} />
             <Stack.Screen name="HotelFinancing" component={HotelFinancingScreen} options={{ title: "Financing" }} />
             <Stack.Screen name="ScheduledOrders" component={ScheduledOrdersScreen} options={{ title: "Scheduled Orders" }} />
             <Stack.Screen name="InventoryBalance" component={InventoryBalanceScreen} options={{ title: "Inventory Balance" }} />
           </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
