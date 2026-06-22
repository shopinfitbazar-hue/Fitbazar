import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/styles/theme";

export default function OrderSuccessScreen() {
  const { order } = useLocalSearchParams<{ order?: string }>();
  return (
    <View style={styles.screen}>
      <View style={styles.icon}><Ionicons name="checkmark" size={48} color={colors.surface}/></View>
      <Text style={styles.title}>Order Placed Successfully!</Text>
      <Text style={styles.subtitle}>Thank you for your order. Your order has been placed and is being processed.</Text>
      <View style={styles.details}>
        <View style={styles.row}><Text style={styles.label}>Order ID</Text><Text style={styles.value}>{order || "FITBAZAR"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Order Date</Text><Text style={styles.value}>{new Date().toLocaleDateString()}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Payment Method</Text><Text style={styles.value}>Cash on Delivery</Text></View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/orders")} style={styles.primary}><Text style={styles.primaryText}>Track Order</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.secondary}><Text style={styles.secondaryText}>Continue Shopping</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, backgroundColor: colors.paper, padding: spacing.xl },
  icon: { width: 88, height: 88, alignItems: "center", justifyContent: "center", borderRadius: 44, backgroundColor: colors.success },
  title: { color: colors.success, fontSize: 25, fontWeight: "900", textAlign: "center" },
  subtitle: { maxWidth: 340, color: colors.inkMuted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  details: { width: "100%", gap: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  label: { color: colors.inkMuted, fontSize: 13 },
  value: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "900", textAlign: "right" },
  primary: { width: "100%", minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.ink },
  primaryText: { color: colors.surface, fontWeight: "900" },
  secondary: { minHeight: 44, justifyContent: "center" },
  secondaryText: { color: colors.goldDark, fontWeight: "900" },
});
