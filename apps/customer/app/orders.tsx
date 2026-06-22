import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";
import { money, shortDate } from "@/utils/format";

export default function OrdersScreen() {
  const user = useAuthStore((state) => state.user);
  const orders = useQuery({
    queryKey: ["mobile-orders"],
    queryFn: () => api.mobileOrders({ pageSize: 20 }),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <Screen>
        <EmptyState title="Login to track orders" message="Order tracking is available after you sign in." />
        <PrimaryButton onPress={() => router.push("/login")}>Login</PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Orders</Text>

      {orders.isLoading ? <ActivityIndicator color={colors.gold} /> : null}

      {orders.data?.orders.length ? (
        <View style={styles.list}>
          {orders.data.orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.number}>{order.orderNumber}</Text>
                <Text style={styles.status}>{order.status}</Text>
              </View>
              <Text style={styles.vendor}>{order.vendor?.shopName || "FitBazar vendor"}</Text>
              <View style={styles.row}>
                <Text style={styles.date}>{shortDate(order.createdAt)}</Text>
                <Text style={styles.amount}>{money(order.totalAmount)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : !orders.isLoading ? (
        <EmptyState title="No orders yet" message="Your FitBazar orders will appear here after checkout." />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  row: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  number: {
    flex: 1,
    color: colors.ink,
    fontWeight: "900",
  },
  status: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "900",
  },
  vendor: {
    color: colors.inkMuted,
  },
  date: {
    color: colors.inkMuted,
  },
  amount: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
});
