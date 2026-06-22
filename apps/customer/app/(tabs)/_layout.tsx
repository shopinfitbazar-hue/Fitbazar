import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/styles/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={String(color)} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          borderTopColor: colors.line,
          backgroundColor: colors.surface,
          minHeight: 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home-outline") }} />
      <Tabs.Screen name="search" options={{ title: "Categories", tabBarIcon: tabIcon("grid-outline") }} />
      <Tabs.Screen name="wishlist" options={{ title: "Wishlist", tabBarIcon: tabIcon("heart-outline") }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: tabIcon("bag-outline") }} />
      <Tabs.Screen name="profile" options={{ title: "Account", tabBarIcon: tabIcon("person-outline") }} />
    </Tabs>
  );
}
