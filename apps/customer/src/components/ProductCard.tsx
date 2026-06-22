import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PublicProductSummary } from "@fitbazar/shared-types";
import { money } from "@/utils/format";
import { colors, radius, shadow, spacing } from "@/styles/theme";
import { IMAGE_PLACEHOLDER, optimizedImageUrl } from "@/utils/image";

export function ProductCard({ product, compact = false }: { product: PublicProductSummary; compact?: boolean }) {
  const image = product.images?.[0];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/product/${product.slug}`)}
      style={({ pressed }) => [styles.card, compact && styles.compact, pressed && styles.pressed]}
    >
      <View style={styles.media}>
        {image ? (
          <Image cachePolicy="memory-disk" contentFit="cover" placeholder={{ blurhash: IMAGE_PLACEHOLDER }} source={optimizedImageUrl(image, 420)} style={styles.image} transition={120} />
        ) : <View style={[styles.image, styles.placeholder]} />}
        {product.discountPct ? <View style={styles.saleBadge}><Text style={styles.saleText}>-{product.discountPct}%</Text></View> : null}
        <View style={styles.heart}><Ionicons name="heart-outline" size={17} color={colors.ink} /></View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.name}>
          {product.name}
        </Text>
        <Text style={styles.vendor} numberOfLines={1}>
          {product.vendor?.shopName || "FitBazar"}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {product.compareAtPrice ? <Text style={styles.compare}>{money(product.compareAtPrice)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadow,
  },
  compact: {
    width: "48%",
  },
  pressed: {
    opacity: 0.9,
  },
  image: {
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: colors.mist,
  },
  media: { position: "relative" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  name: {
    minHeight: 40,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  vendor: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  priceRow: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  compare: { color: colors.inkMuted, fontSize: 11, textDecorationLine: "line-through" },
  saleBadge: { position: "absolute", top: spacing.sm, left: spacing.sm, borderRadius: 4, backgroundColor: colors.danger, paddingHorizontal: 6, paddingVertical: 3 },
  saleText: { color: colors.surface, fontSize: 10, fontWeight: "900" },
  heart: { position: "absolute", top: spacing.sm, right: spacing.sm, width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.92)" },
});
