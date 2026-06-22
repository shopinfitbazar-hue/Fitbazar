import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const menuItems: Array<{ label: string; path: string; icon: IconName }> = [
  { label: "My Orders", path: "/orders", icon: "receipt-outline" },
  { label: "Wishlist", path: "/wishlist", icon: "heart-outline" },
  { label: "Notifications", path: "/notifications", icon: "notifications-outline" },
  { label: "Personal Details", path: "/account", icon: "person-outline" },
  { label: "Saved Addresses", path: "/addresses", icon: "location-outline" },
  { label: "Coupons", path: "/coupons", icon: "ticket-outline" },
  { label: "Referrals", path: "/referrals", icon: "gift-outline" },
  { label: "Customer Support", path: "/support", icon: "chatbubble-ellipses-outline" },
  { label: "Recently Viewed", path: "/recently-viewed", icon: "time-outline" },
];

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const wishlist = useQuery({
    queryKey: ["mobile-wishlist"],
    queryFn: () => api.mobileWishlist(),
    enabled: Boolean(user),
  });
  const notifications = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () => api.mobileNotifications(),
    enabled: Boolean(user),
  });
  const unreadNotifications = notifications.data?.notifications.filter((item) => !item.isRead).length ?? 0;

  if (!user) {
    return (
      <Screen>
        <View style={styles.hero}>
          <Text style={styles.title}>Your FitBazar</Text>
          <Text style={styles.subtitle}>Sign in for wishlist, faster checkout, order tracking, and support.</Text>
        </View>
        <PrimaryButton onPress={() => router.push("/login")}>Login</PrimaryButton>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user.name || user.email).slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>{user.name || "FitBazar Customer"}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{wishlist.data?.wishlist.length ?? 0}</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{unreadNotifications}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => router.push(item.path)}
            style={styles.menuItem}
          >
            <View style={styles.menuLabel}>
              <Ionicons name={item.icon} size={20} color={colors.goldDark} />
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
          </Pressable>
        ))}
      </View>

      <PrimaryButton loading={isLoading} onPress={logout} tone="light">
        Logout
      </PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    minHeight: 76,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: colors.inkMuted,
    fontWeight: "800",
  },
  hero: {
    gap: spacing.sm,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.inkMuted,
    lineHeight: 20,
  },
  profileCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "900",
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  email: {
    color: colors.inkMuted,
  },
  menu: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  menuItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.lg,
  },
  menuText: {
    color: colors.ink,
    fontWeight: "800",
  },
  menuLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
