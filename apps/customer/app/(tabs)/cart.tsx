import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";
import { money } from "@/utils/format";
import { IMAGE_PLACEHOLDER, optimizedImageUrl } from "@/utils/image";

export default function CartScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const cart = useQuery({ queryKey: ["mobile-cart"], queryFn: () => api.mobileCart(), enabled: Boolean(user) });
  const items = cart.data?.items ?? [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const updateItem = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity < 1) await api.removeMobileCartItem(id);
      else await api.updateMobileCartItem(id, quantity);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mobile-cart"] }),
    onError: (error) => Alert.alert("Cart update failed", error instanceof Error ? error.message : "Please try again."),
  });

  if (!user) {
    return <Screen><EmptyState title="Login to view cart" message="Your cart and checkout are connected to your FitBazar account." /><PrimaryButton onPress={() => router.push("/login")}>Login</PrimaryButton></Screen>;
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}><Text style={styles.title}>Shopping Cart</Text><Text style={styles.count}>{items.length} items</Text></View>
      {items.length ? <View style={styles.list}>{items.map((item) => (
        <View key={item.id} style={styles.item}>
          {item.image ? <Image cachePolicy="memory-disk" contentFit="cover" placeholder={{ blurhash: IMAGE_PLACEHOLDER }} source={optimizedImageUrl(item.image, 220)} style={styles.itemImage} transition={100} /> : <View style={styles.itemImage} />}
          <View style={styles.itemBody}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemMeta}>{[item.size, item.color].filter(Boolean).join(" | ") || item.vendorName}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>{money(item.price * item.quantity)}</Text>
              <View style={styles.quantityControl}>
                <Pressable accessibilityLabel={item.quantity === 1 ? "Remove item" : "Decrease quantity"} accessibilityRole="button" disabled={updateItem.isPending} onPress={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })} style={styles.quantityButton}><Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={16} color={colors.ink} /></Pressable>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Pressable accessibilityLabel="Increase quantity" accessibilityRole="button" disabled={updateItem.isPending} onPress={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })} style={styles.quantityButton}><Ionicons name="add" size={16} color={colors.ink} /></Pressable>
              </View>
            </View>
          </View>
        </View>
      ))}</View> : <EmptyState title={cart.isLoading ? "Loading cart" : "Your cart is empty"} message="Add products from the marketplace to begin checkout." />}

      {items.length ? <View style={styles.summary}>
        <View style={styles.row}><Text style={styles.label}>Subtotal</Text><Text style={styles.value}>{money(subtotal)}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Shipping</Text><Text style={styles.free}>Calculated at checkout</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{money(subtotal)}</Text></View>
      </View> : null}

      <PrimaryButton disabled={!items.length} onPress={() => router.push("/checkout")}>Proceed to Checkout</PrimaryButton>
      <Pressable accessibilityRole="button" onPress={() => router.push("/search")} style={styles.continueButton}><Text style={styles.continueText}>Continue Shopping</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.ink, fontSize: 23, fontWeight: "900" },
  count: { color: colors.inkMuted, fontSize: 12, fontWeight: "700" },
  list: { gap: spacing.sm },
  item: { flexDirection: "row", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface, paddingVertical: spacing.md },
  itemImage: { width: 76, height: 92, borderRadius: radius.sm, backgroundColor: colors.mist },
  itemBody: { flex: 1, justifyContent: "space-between", gap: spacing.xs },
  itemName: { color: colors.ink, fontSize: 14, fontWeight: "900", lineHeight: 20 },
  itemMeta: { color: colors.inkMuted, fontSize: 11 },
  itemFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  itemPrice: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  quantityControl: { height: 34, flexDirection: "row", alignItems: "center", overflow: "hidden", borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  quantityButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  quantityText: { minWidth: 24, color: colors.ink, fontWeight: "900", textAlign: "center" },
  summary: { gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.inkMuted },
  value: { color: colors.ink, fontWeight: "800" },
  free: { color: colors.success, fontSize: 12, fontWeight: "800" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.sm },
  totalLabel: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  totalValue: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  continueButton: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  continueText: { color: colors.goldDark, fontWeight: "900" },
});
