import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { PublicProductSummary } from "@fitbazar/shared-types";
import { api } from "@/api/client";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { useRecentlyViewed } from "@/state/recentlyViewed";
import { colors, radius, shadow, spacing } from "@/styles/theme";
import { IMAGE_PLACEHOLDER, optimizedImageUrl, prefetchImages } from "@/utils/image";

const fallbackCategories = ["Men", "Women", "Watches", "Shoes", "Bags", "Accessories"];

function normalizeCategory(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll ? <Pressable accessibilityRole="button" onPress={onViewAll}><Text style={styles.link}>View all</Text></Pressable> : null}
    </View>
  );
}

function ProductGrid({ products }: { products: PublicProductSummary[] }) {
  return <View style={styles.productGrid}>{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} compact />)}</View>;
}

export default function HomeScreen() {
  const recentlyViewed = useRecentlyViewed((state) => state.products);
  const featured = useQuery({ queryKey: ["products", "featured"], queryFn: () => api.products({ featured: true, limit: 10 }) });
  const popular = useQuery({ queryKey: ["products", "popular"], queryFn: () => api.products({ sort: "popular", limit: 10 }) });
  const categoryData = useQuery({ queryKey: ["categories"], queryFn: () => api.get<{ categories: Array<{ id: string; name: string }> }>("/api/categories") });
  const recommendedCategory = recentlyViewed[0]?.category;
  const recommended = useQuery({
    queryKey: ["products", "recommended", recommendedCategory],
    queryFn: () => api.products({ category: recommendedCategory, sort: "popular", limit: 8 }),
    enabled: Boolean(recommendedCategory),
  });

  const featuredProducts = featured.data?.products ?? [];
  const popularProducts = popular.data?.products ?? [];
  const visualProducts = [...featuredProducts, ...popularProducts];
  const categoryNames = (categoryData.data?.categories.map((item) => item.name).filter(Boolean) || fallbackCategories).slice(0, 8);
  const heroProduct = featuredProducts[0] || popularProducts[0];

  useEffect(() => {
    const urls = [...featuredProducts.slice(0, 6), ...popularProducts.slice(0, 4)].map((product) => product.images?.[0]);
    void prefetchImages(urls, 480);
  }, [featured.data, popular.data]);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Open account" accessibilityRole="button" onPress={() => router.push("/profile")} style={styles.iconButton}>
          <Ionicons name="menu-outline" size={23} color={colors.ink} />
        </Pressable>
        <View style={styles.brand}>
          <Image source={require("../../assets/icon.png")} style={styles.brandMark} />
          <Text style={styles.logo}>FIT BAZAR</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityLabel="Notifications" accessibilityRole="button" onPress={() => router.push("/notifications")} style={styles.actionButton}><Ionicons name="notifications-outline" size={21} color={colors.ink} /></Pressable>
          <Pressable accessibilityLabel="Shopping cart" accessibilityRole="button" onPress={() => router.push("/cart")} style={styles.actionButton}><Ionicons name="bag-handle-outline" size={21} color={colors.ink} /></Pressable>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/search")} style={styles.search}>
        <Ionicons name="search-outline" size={18} color={colors.inkMuted} />
        <Text style={styles.searchText}>Search for products, brands and more...</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => heroProduct ? router.push(`/product/${heroProduct.slug}`) : router.push("/search")} style={styles.hero}>
        {heroProduct?.images?.[0] ? (
          <Image cachePolicy="memory-disk" contentFit="cover" contentPosition="right center" placeholder={{ blurhash: IMAGE_PLACEHOLDER }} source={optimizedImageUrl(heroProduct.images[0], 900, 76)} style={styles.heroImage} transition={120} />
        ) : null}
        <View style={styles.heroVeil} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>Premium Collection</Text>
          <Text style={styles.heroTitle}>Discover Style That Defines You</Text>
          <Text style={styles.heroBody}>Premium quality products for every occasion.</Text>
          <View style={styles.heroButton}><Text style={styles.heroButtonText}>Shop Now</Text></View>
        </View>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
        {categoryNames.map((category) => {
          const normalized = normalizeCategory(category);
          const product = visualProducts.find((entry) => normalizeCategory(entry.category || "").includes(normalized) || normalized.includes(normalizeCategory(entry.category || "")));
          return (
            <Pressable key={category} accessibilityRole="button" onPress={() => router.push({ pathname: "/search", params: { category } })} style={styles.category}>
              <View style={styles.categoryCircle}>
                {product?.images?.[0] ? <Image cachePolicy="memory-disk" contentFit="cover" source={optimizedImageUrl(product.images[0], 160)} style={styles.categoryImage} /> : <Ionicons name="shirt-outline" size={25} color={colors.ink} />}
              </View>
              <Text numberOfLines={1} style={styles.categoryText}>{category.replace("'s Fashion", "")}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionHeader title="Featured Products" onViewAll={() => router.push("/search")} />
      {featuredProducts.length ? <ProductGrid products={featuredProducts} /> : <Text style={styles.muted}>{featured.isLoading ? "Loading products..." : "Products are being curated."}</Text>}

      <SectionHeader title="Popular Products" onViewAll={() => router.push("/search")} />
      {popularProducts.length ? <ProductGrid products={popularProducts} /> : <Text style={styles.muted}>{popular.isLoading ? "Loading products..." : "Products are being curated."}</Text>}

      {recentlyViewed.length ? <><SectionHeader title="Recently Viewed" onViewAll={() => router.push("/recently-viewed")} /><ProductGrid products={recentlyViewed} /></> : null}
      {recommended.data?.products.length ? <><SectionHeader title="Recommended for You" /><ProductGrid products={recommended.data.products} /></> : null}

      <View style={styles.trustRow}>
        <View style={styles.trustItem}><Ionicons name="ribbon-outline" size={22} color={colors.goldDark}/><Text style={styles.trustText}>100% Original</Text></View>
        <View style={styles.trustItem}><Ionicons name="lock-closed-outline" size={22} color={colors.goldDark}/><Text style={styles.trustText}>Secure Payments</Text></View>
        <View style={styles.trustItem}><Ionicons name="refresh-outline" size={22} color={colors.goldDark}/><Text style={styles.trustText}>Easy Returns</Text></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xs, gap: spacing.md },
  header: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandMark: { width: 30, height: 30, borderRadius: 4 },
  logo: { color: colors.ink, fontSize: 18, fontWeight: "900", letterSpacing: 0 },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerActions: { flexDirection: "row" },
  actionButton: { width: 36, height: 38, alignItems: "center", justifyContent: "center" },
  search: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.mist, paddingHorizontal: spacing.md },
  searchText: { flex: 1, color: colors.inkMuted, fontSize: 12 },
  hero: { minHeight: 190, overflow: "hidden", borderRadius: radius.md, backgroundColor: "#EDE3D7", ...shadow },
  heroImage: { position: "absolute", top: 0, right: 0, bottom: 0, width: "66%" },
  heroVeil: { position: "absolute", top: 0, left: 0, bottom: 0, width: "68%", backgroundColor: "rgba(245,238,229,0.90)" },
  heroCopy: { maxWidth: "64%", gap: 6, padding: spacing.lg },
  heroEyebrow: { color: colors.goldDark, fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { color: colors.ink, fontSize: 22, fontWeight: "900", lineHeight: 27 },
  heroBody: { color: colors.inkMuted, fontSize: 11, lineHeight: 16 },
  heroButton: { width: 92, minHeight: 34, alignItems: "center", justifyContent: "center", marginTop: 4, borderRadius: radius.sm, backgroundColor: colors.ink },
  heroButtonText: { color: colors.surface, fontSize: 12, fontWeight: "900" },
  categoryList: { gap: spacing.md, paddingVertical: spacing.xs, paddingRight: spacing.lg },
  category: { width: 62, alignItems: "center", gap: 5 },
  categoryCircle: { width: 52, height: 52, overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: 26, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  categoryImage: { width: "100%", height: "100%" },
  categoryText: { width: 66, color: colors.ink, fontSize: 10, fontWeight: "700", textAlign: "center" },
  sectionHeader: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  link: { color: colors.goldDark, fontSize: 12, fontWeight: "800" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  muted: { color: colors.inkMuted },
  trustRow: { flexDirection: "row", gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  trustItem: { flex: 1, minHeight: 70, alignItems: "center", justifyContent: "center", gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.line, padding: spacing.xs },
  trustText: { color: colors.ink, fontSize: 10, fontWeight: "800", textAlign: "center" },
});
