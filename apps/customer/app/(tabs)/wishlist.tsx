import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { colors, radius, spacing } from "@/styles/theme";
import { money } from "@/utils/format";
import { IMAGE_PLACEHOLDER, optimizedImageUrl } from "@/utils/image";

export default function WishlistScreen() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const wishlist = useQuery({
    queryKey: ["mobile-wishlist"],
    queryFn: () => api.mobileWishlist(),
    enabled: Boolean(user),
  });
  const removeItem = useMutation({
    mutationFn: (id: string) => api.removeMobileWishlistItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mobile-wishlist"] }),
    onError: (error) => {
      Alert.alert("Could not remove item", error instanceof Error ? error.message : "Please try again.");
    },
  });

  if (!user) {
    return (
      <Screen>
        <EmptyState title="Login to view wishlist" message="Saved products are attached to your FitBazar account." />
        <PrimaryButton onPress={() => router.push("/login")}>Login</PrimaryButton>
      </Screen>
    );
  }

  const items = wishlist.data?.wishlist ?? [];

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Wishlist</Text>

      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => router.push(`/product/${item.product.slug}`)}
              style={styles.card}
            >
              {item.product.images[0] ? <Image cachePolicy="memory-disk" contentFit="cover" placeholder={{ blurhash: IMAGE_PLACEHOLDER }} source={optimizedImageUrl(item.product.images[0], 240)} style={styles.image} transition={100} /> : <View style={styles.image} />}
              <View style={styles.body}>
                <Text numberOfLines={2} style={styles.name}>
                  {item.product.name}
                </Text>
                <Text style={styles.vendor}>{item.product.vendor?.shopName || "FitBazar"}</Text>
                <Text style={styles.price}>{money(item.product.price)}</Text>
                <Pressable accessibilityRole="button" onPress={() => removeItem.mutate(item.id)} style={styles.remove}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState title={wishlist.isLoading ? "Loading wishlist" : "No saved products"} message="Save products from product detail pages." />
      )}
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
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  image: {
    width: 88,
    height: 106,
    borderRadius: radius.sm,
    backgroundColor: colors.mist,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  vendor: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  price: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  remove: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    backgroundColor: colors.mist,
    paddingHorizontal: spacing.md,
  },
  removeText: {
    color: colors.ink,
    fontWeight: "800",
  },
});
