import { Component, type ErrorInfo, type ReactNode } from "react";
import { Stack } from "expo-router";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { AppProviders } from "@/providers/AppProviders";
import { colors } from "@/styles/theme";

type BoundaryState = {
  error: Error | null;
};

class RootErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[mobile] Root render failed", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>FitBazar could not start</Text>
        <Text style={styles.errorBody}>Please close and reopen the app. If this continues, install the newest APK build.</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ error: null })} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <RootErrorBoundary>
        <AppProviders>
          <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.paper },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: "800" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "FitBazar Login", presentation: "modal" }} />
            <Stack.Screen name="signup" options={{ title: "Create Account", presentation: "modal" }} />
            <Stack.Screen name="product/[slug]" options={{ title: "Product Details" }} />
            <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
            <Stack.Screen name="orders" options={{ title: "My Orders" }} />
            <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
            <Stack.Screen name="account" options={{ title: "Personal Details" }} />
            <Stack.Screen name="addresses" options={{ title: "Saved Addresses" }} />
            <Stack.Screen name="coupons" options={{ title: "Coupons" }} />
            <Stack.Screen name="referrals" options={{ title: "Refer a Friend" }} />
            <Stack.Screen name="support" options={{ title: "Customer Support" }} />
            <Stack.Screen name="recently-viewed" options={{ title: "Recently Viewed" }} />
            <Stack.Screen name="order-success" options={{ headerShown: false }} />
          </Stack>
        </AppProviders>
      </RootErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: colors.paper,
    padding: 24,
  },
  errorTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  errorBody: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
  },
  errorButtonText: {
    color: colors.surface,
    fontWeight: "900",
  },
});
