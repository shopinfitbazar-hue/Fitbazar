import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/api/client";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/styles/theme";

const sortOptions = [
  { label: "Popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price", value: "price_asc" },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const category = typeof params.category === "string" ? params.category : undefined;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const request = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      category,
      sort,
      limit: 30,
    }),
    [category, debouncedQuery, sort],
  );

  const results = useQuery({
    queryKey: ["search", request],
    queryFn: () => api.search(request),
  });

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{category || "Categories"}</Text>
        <Text style={styles.subtitle}>{results.data?.total ?? 0} products</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={colors.inkMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search jackets, watches, bags..."
          placeholderTextColor={colors.inkMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {query ? (
          <Pressable accessibilityLabel="Clear search" accessibilityRole="button" onPress={() => setQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.inkMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sortRow}>
        {sortOptions.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => setSort(option.value)}
            style={[styles.sort, sort === option.value && styles.sortActive]}
          >
            <Text style={[styles.sortText, sort === option.value && styles.sortTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>

      {results.isLoading ? (
        <ActivityIndicator color={colors.gold} />
      ) : results.data?.products.length ? (
        <View style={styles.grid}>
          {results.data.products.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </View>
      ) : (
        <EmptyState title="No products found" message="Try a different style, category, or brand." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  header: {
    gap: spacing.xs,
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
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    minHeight: 46,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  sortRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sort: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  sortActive: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  sortText: {
    color: colors.ink,
    fontWeight: "800",
  },
  sortTextActive: {
    color: colors.surface,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
});
