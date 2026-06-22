import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicProductSummary } from "@fitbazar/shared-types";
import { api } from "@/api/client";
import { ProductCard } from "@/components/ProductCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/state/auth";
import { useRecentlyViewed } from "@/state/recentlyViewed";
import { colors, radius, spacing } from "@/styles/theme";
import { money } from "@/utils/format";
import { IMAGE_PLACEHOLDER, optimizedImageUrl, prefetchImages } from "@/utils/image";

type ProductDetailResponse = {
  product: PublicProductSummary & {
    reviews?: Array<{ id?: string; rating?: number; comment?: string | null; user?: { name?: string | null } }>;
  };
  similarProducts: PublicProductSummary[];
  alsoBoughtProducts: PublicProductSummary[];
};

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const addRecentlyViewed = useRecentlyViewed((state) => state.add);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedSize, setSelectedSize] = useState<string | undefined>();

  const detail = useQuery({
    queryKey: ["product", slug],
    enabled: Boolean(slug),
    queryFn: () => api.get<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug || "")}`),
  });

  const product = detail.data?.product;
  const image = product?.images?.[activeImageIndex] || product?.images?.[0];
  const rating = useMemo(() => {
    const reviews = product?.reviews ?? [];
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [product]);

  useEffect(() => {
    if (product) {
      void addRecentlyViewed(product);
      void prefetchImages(product.images.slice(1, 4), 900);
      setSelectedColor((current) => current || product.colors?.[0]);
      setSelectedSize((current) => current || product.sizes?.[0]);
    }
  }, [product, addRecentlyViewed]);

  const addToCart = useMutation({
    mutationFn: async (destination: "cart" | "checkout") => {
      if (!product) return null;
      if (!user) {
        router.push("/login");
        return null;
      }
      const response = await api.addMobileCartItem({ productId: product.id, quantity: 1, size: selectedSize, color: selectedColor });
      return { response, destination };
    },
    onSuccess: (result) => {
      if (result) {
        router.push(result.destination === "checkout" ? "/checkout" : "/cart");
      }
    },
    onError: (error) => {
      Alert.alert("Could not add item", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const addToWishlist = useMutation({
    mutationFn: async () => {
      if (!product) return null;
      if (!user) {
        router.push("/login");
        return null;
      }
      return api.addMobileWishlistItem({ productId: product.id });
    },
    onSuccess: async (response) => {
      if (!response) return;
      await queryClient.invalidateQueries({ queryKey: ["mobile-wishlist"] });
      Alert.alert("Saved", "This product is in your wishlist.");
    },
    onError: (error) => {
      Alert.alert("Could not save item", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const submitReview = useMutation({
    mutationFn: () => api.createMobileReview({ productId: product?.id || "", rating: reviewRating, comment: reviewComment }),
    onSuccess: async () => {
      setReviewComment("");
      await queryClient.invalidateQueries({ queryKey: ["product", slug] });
      Alert.alert("Review submitted", "Thank you for reviewing your purchase.");
    },
    onError: (error) => Alert.alert("Could not submit review", error instanceof Error ? error.message : "Please try again."),
  });

  if (detail.isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.gold} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Text style={styles.title}>Product not found</Text>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.gallery}>
        {image ? <Image cachePolicy="memory-disk" contentFit="contain" placeholder={{ blurhash: IMAGE_PLACEHOLDER }} source={optimizedImageUrl(image, 960, 78)} style={styles.image} transition={120} /> : <View style={[styles.image, styles.placeholder]} />}
        <Pressable accessibilityLabel="Save to wishlist" accessibilityRole="button" onPress={() => addToWishlist.mutate()} style={styles.galleryAction}><Ionicons name="heart-outline" size={21} color={colors.ink} /></Pressable>
        {product.images.length > 1 ? <View style={styles.galleryDots}>{product.images.slice(0, 5).map((_, index) => <Pressable key={index} accessibilityLabel={`Show image ${index + 1}`} onPress={() => setActiveImageIndex(index)} style={[styles.galleryDot, index === activeImageIndex && styles.galleryDotActive]} />)}</View> : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.vendor}>{product.vendor?.shopName || "FitBazar"}</Text>
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {product.compareAtPrice ? <Text style={styles.compare}>{money(product.compareAtPrice)}</Text> : null}
          {rating ? <Text style={styles.rating}>{rating} stars</Text> : null}
        </View>

        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

        {product.colors?.length ? (
          <View style={styles.optionBlock}>
            <Text style={styles.optionTitle}>Colors</Text>
            <View style={styles.optionRow}>
              {product.colors.map((color) => (
                <Pressable key={color} accessibilityRole="button" onPress={() => setSelectedColor(color)} style={[styles.optionPill, selectedColor === color && styles.optionPillActive]}><Text style={[styles.optionText, selectedColor === color && styles.optionTextActive]}>{color}</Text></Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {product.sizes?.length ? (
          <View style={styles.optionBlock}>
            <Text style={styles.optionTitle}>Sizes</Text>
            <View style={styles.optionRow}>
              {product.sizes.map((size) => (
                <Pressable key={size} accessibilityRole="button" onPress={() => setSelectedSize(size)} style={[styles.optionPill, selectedSize === size && styles.optionPillActive]}><Text style={[styles.optionText, selectedSize === size && styles.optionTextActive]}>{size}</Text></Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={addToCart.isPending} style={styles.addButton} onPress={() => addToCart.mutate("cart")}><Ionicons name="bag-add-outline" size={19} color={colors.surface} /><Text style={styles.addButtonText}>{addToCart.isPending ? "Adding..." : "Add to Cart"}</Text></Pressable>
          <Pressable accessibilityRole="button" style={styles.buyNow} onPress={() => addToCart.mutate("checkout")}>
            <Text style={styles.buyNowText}>Buy Now</Text>
          </Pressable>
        </View>

        <View style={styles.reviewBlock}>
          <Text style={styles.optionTitle}>Customer Reviews</Text>
          {product.reviews?.slice(0, 4).map((review, index) => (
            <View key={review.id || String(index)} style={styles.reviewCard}>
              <Text style={styles.reviewRating}>{"★".repeat(Number(review.rating || 0))}</Text>
              {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
              <Text style={styles.reviewAuthor}>{review.user?.name || "Verified customer"}</Text>
            </View>
          ))}
          {user ? <View style={styles.reviewForm}>
            <View style={styles.ratingRow}>{[1,2,3,4,5].map((value) => <Pressable key={value} onPress={() => setReviewRating(value)}><Text style={[styles.ratingStar, value <= reviewRating && styles.ratingStarActive]}>★</Text></Pressable>)}</View>
            <TextInput value={reviewComment} onChangeText={setReviewComment} placeholder="Share your experience after delivery" placeholderTextColor={colors.inkMuted} multiline style={styles.reviewInput}/>
            <PrimaryButton loading={submitReview.isPending} onPress={() => submitReview.mutate()}>Submit Review</PrimaryButton>
          </View> : null}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>You may also like</Text>
      </View>
      <FlatList
        horizontal
        data={detail.data?.similarProducts ?? []}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.relatedList}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
  },
  image: {
    width: "100%",
    aspectRatio: 0.95,
    backgroundColor: colors.mist,
  },
  gallery: { position: "relative", backgroundColor: colors.surface },
  galleryAction: { position: "absolute", top: spacing.md, right: spacing.md, width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: "rgba(255,255,255,0.94)" },
  galleryDots: { position: "absolute", left: 0, right: 0, bottom: spacing.md, flexDirection: "row", justifyContent: "center", gap: 6 },
  galleryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  galleryDotActive: { width: 18, backgroundColor: colors.ink },
  placeholder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  vendor: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
  },
  metaRow: {
    minHeight: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  price: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  compare: {
    color: colors.inkMuted,
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  rating: {
    color: colors.success,
    fontWeight: "800",
  },
  description: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 23,
  },
  reviewBlock: { gap: spacing.sm },
  reviewCard: { gap: spacing.xs, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, padding: spacing.md },
  reviewRating: { color: colors.goldDark, fontWeight: "900" },
  reviewComment: { color: colors.ink, lineHeight: 20 },
  reviewAuthor: { color: colors.inkMuted, fontSize: 12 },
  reviewForm: { gap: spacing.sm, marginTop: spacing.sm },
  ratingRow: { flexDirection: "row", gap: spacing.sm },
  ratingStar: { color: colors.line, fontSize: 30 },
  ratingStarActive: { color: colors.gold },
  reviewInput: { minHeight: 90, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, color: colors.ink, padding: spacing.md, textAlignVertical: "top" },
  optionBlock: {
    gap: spacing.sm,
  },
  optionTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  optionPill: {
    minHeight: 34,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    color: colors.ink,
    fontWeight: "800",
  },
  optionPillActive: { borderColor: colors.ink, backgroundColor: colors.ink },
  optionTextActive: { color: colors.surface },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addButton: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.ink },
  addButtonText: { color: colors.surface, fontWeight: "900" },
  buyNow: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
  },
  buyNowText: {
    color: colors.surface,
    fontWeight: "900",
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  relatedList: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
