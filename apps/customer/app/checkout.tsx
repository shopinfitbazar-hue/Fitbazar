import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CheckoutPayloadDto } from "@fitbazar/shared-types";
import { api } from "@/api/client";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";
import { money } from "@/utils/format";

const initialAddress = { name: "", phone: "", line1: "", zone: "Kathmandu", district: "Kathmandu", pincode: "44600", email: "" };

export default function CheckoutScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [address, setAddress] = useState(initialAddress);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const cart = useQuery({ queryKey: ["mobile-cart"], queryFn: () => api.mobileCart(), enabled: Boolean(user) });
  const addresses = useQuery({ queryKey: ["mobile-addresses"], queryFn: () => api.mobileAddresses(), enabled: Boolean(user) });
  const items = cart.data?.items ?? [];
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const total = Math.max(0, subtotal - (appliedCoupon?.discountAmount || 0));

  useEffect(() => {
    if (!user) return;
    setAddress((current) => ({ ...current, name: user.name || "", phone: user.phone || "", email: user.email || "" }));
  }, [user]);
  useEffect(() => {
    const saved = addresses.data?.addresses.find((item) => item.isDefault) || addresses.data?.addresses[0];
    if (saved) setAddress((current) => ({ ...current, name: saved.name, phone: saved.phone, line1: saved.line1, zone: saved.zone, district: saved.district }));
  }, [addresses.data]);

  const applyCoupon = useMutation({
    mutationFn: () => api.validateCoupon(couponCode.trim().toUpperCase(), subtotal),
    onSuccess: ({ coupon }) => setAppliedCoupon({ code: coupon.code, discountAmount: coupon.discountAmount }),
    onError: (error) => Alert.alert("Coupon not available", error instanceof Error ? error.message : "Try another code."),
  });
  const checkout = useMutation({
    mutationFn: async () => {
      if (!items.length) throw new Error("Your cart is empty.");
      if (!address.name || !address.phone || !address.line1 || !address.zone || !address.district || !address.pincode) throw new Error("Please complete your shipping address.");
      const payload: CheckoutPayloadDto = {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity, size: item.size, color: item.color })),
        address,
        paymentMethod: "COD",
        deliveryMethod: "standard",
        couponCode: appliedCoupon?.code,
        idempotencyKey: `customer-app-${Date.now()}`,
      };
      return api.mobileCheckout(payload);
    },
    onSuccess: async (response) => {
      await api.clearMobileCart().catch(() => undefined);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["mobile-cart"] }), queryClient.invalidateQueries({ queryKey: ["mobile-orders"] })]);
      router.replace({ pathname: "/order-success", params: { order: response.orders[0]?.orderNumber || "FITBAZAR" } });
    },
    onError: (error) => Alert.alert("Checkout failed", error instanceof Error ? error.message : "Please try again."),
  });

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {(["name", "phone", "line1", "district", "zone", "pincode"] as const).map((field) => <TextInput key={field} onChangeText={(value) => setAddress((current) => ({ ...current, [field]: value }))} placeholder={field === "line1" ? "Street address" : field[0].toUpperCase() + field.slice(1)} placeholderTextColor={colors.inkMuted} style={styles.input} value={address[field]} />)}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Method</Text>
        <View style={styles.optionRow}><Ionicons name="radio-button-on" size={20} color={colors.ink} /><View style={styles.optionCopy}><Text style={styles.optionTitle}>Standard Shipping</Text><Text style={styles.optionMeta}>3-5 business days</Text></View><Text style={styles.free}>Free</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.optionRow}><Ionicons name="radio-button-on" size={20} color={colors.ink} /><Text style={styles.optionTitle}>Cash on Delivery</Text></View>
        <View style={styles.disabledRow}><Ionicons name="radio-button-off" size={20} color={colors.inkMuted} /><Text style={styles.disabledText}>Khalti Wallet</Text><Text style={styles.soon}>Soon</Text></View>
        <View style={styles.disabledRow}><Ionicons name="radio-button-off" size={20} color={colors.inkMuted} /><Text style={styles.disabledText}>Credit / Debit Card</Text><Text style={styles.soon}>Soon</Text></View>
      </View>
      <View style={styles.couponRow}><TextInput autoCapitalize="characters" onChangeText={setCouponCode} placeholder="Coupon code" placeholderTextColor={colors.inkMuted} style={[styles.input, styles.couponInput]} value={couponCode} /><Pressable accessibilityRole="button" disabled={!couponCode.trim() || applyCoupon.isPending} onPress={() => applyCoupon.mutate()} style={styles.applyButton}><Text style={styles.applyText}>Apply</Text></Pressable></View>
      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{money(subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.free}>Free</Text></View>
        {appliedCoupon ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Coupon {appliedCoupon.code}</Text><Text style={styles.discount}>-{money(appliedCoupon.discountAmount)}</Text></View> : null}
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{money(total)}</Text></View>
      </View>
      <PrimaryButton disabled={!items.length} loading={checkout.isPending} onPress={() => checkout.mutate()}>Place Order</PrimaryButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.sm },
  title: { color: colors.ink, fontSize: 23, fontWeight: "900" },
  section: { gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: spacing.md },
  optionRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  disabledRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.sm, opacity: 0.6 },
  optionCopy: { flex: 1 },
  optionTitle: { flex: 1, color: colors.ink, fontWeight: "800" },
  optionMeta: { color: colors.inkMuted, fontSize: 11 },
  disabledText: { flex: 1, color: colors.inkMuted, fontWeight: "700" },
  soon: { color: colors.inkMuted, fontSize: 10, fontWeight: "800" },
  free: { color: colors.success, fontSize: 12, fontWeight: "900" },
  couponRow: { flexDirection: "row", gap: spacing.sm },
  couponInput: { flex: 1 },
  applyButton: { width: 84, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.ink },
  applyText: { color: colors.surface, fontWeight: "900" },
  summary: { gap: spacing.sm },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: colors.inkMuted },
  summaryValue: { color: colors.ink, fontWeight: "800" },
  discount: { color: colors.success, fontWeight: "900" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  totalLabel: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  totalValue: { color: colors.ink, fontSize: 21, fontWeight: "900" },
});
