import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { normalizeCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { publicProductVisibilityFilter, publicVendorVisibilityFilter } from "@/lib/public-storefront";

export const PUBLIC_CATALOG_REVALIDATE_SECONDS = 300;
export const PUBLIC_SEARCH_REVALIDATE_SECONDS = 120;
export const PUBLIC_VENDOR_REVALIDATE_SECONDS = 300;

export type PublicProductQueryInput = {
  sort: string;
  tag?: string;
  category?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  size: string[];
  color: string[];
  q?: string;
  limit: number;
  page: number;
  featured?: boolean;
};

export type PublicSearchQueryInput = {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  rating?: number;
  inStock?: boolean;
  tag?: string;
  sort: string;
  page: number;
  limit: number;
};

export type PublicVendorQueryInput = {
  limit: number;
  page: number;
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value || ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function asArray(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function readParam(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
) {
  if (params instanceof URLSearchParams) return params.get(key) || undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function readAllParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
) {
  if (params instanceof URLSearchParams) return params.getAll(key);
  return asArray(params[key]);
}

function stableKey(value: unknown) {
  return JSON.stringify(value);
}

export function productQueryKey(input: PublicProductQueryInput) {
  return stableKey(input);
}

export function searchQueryKey(input: PublicSearchQueryInput) {
  return stableKey(input);
}

export function vendorQueryKey(input: PublicVendorQueryInput) {
  return stableKey(input);
}

export function parsePublicProductQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): PublicProductQueryInput {
  const minDiscount = readParam(params, "minDiscount");
  const minPrice = readParam(params, "minPrice");
  const maxPrice = readParam(params, "maxPrice");
  const featured = readParam(params, "featured");

  return {
    sort: readParam(params, "sort") || "newest",
    tag: readParam(params, "tag"),
    category: normalizeCategory(readParam(params, "category") || null) || undefined,
    minDiscount: minDiscount ? clampNumber(minDiscount, 0, 0, 95) : undefined,
    minPrice: minPrice ? clampNumber(minPrice, 0, 0, 500000) : undefined,
    maxPrice: maxPrice ? clampNumber(maxPrice, 0, 0, 500000) : undefined,
    size: readAllParams(params, "size").slice(0, 12),
    color: readAllParams(params, "color").slice(0, 12),
    q: readParam(params, "q")?.trim().slice(0, 80) || undefined,
    limit: clampNumber(readParam(params, "limit"), 12, 1, 48),
    page: clampNumber(readParam(params, "page"), 1, 1, 500),
    featured: featured === "true" ? true : undefined,
  };
}

export function parsePublicSearchQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): PublicSearchQueryInput {
  return {
    q: readParam(params, "q")?.trim().slice(0, 80) || "",
    category: normalizeCategory(readParam(params, "category") || null) || undefined,
    minPrice: readParam(params, "minPrice") ? clampNumber(readParam(params, "minPrice"), 0, 0, 500000) : undefined,
    maxPrice: readParam(params, "maxPrice") ? clampNumber(readParam(params, "maxPrice"), 0, 0, 500000) : undefined,
    size: readParam(params, "size")?.trim().slice(0, 40) || undefined,
    color: readParam(params, "color")?.trim().slice(0, 40) || undefined,
    rating: readParam(params, "rating") ? clampNumber(readParam(params, "rating"), 0, 0, 5) : undefined,
    inStock: readParam(params, "inStock") === "true" ? true : undefined,
    tag: readParam(params, "tag"),
    sort: readParam(params, "sort") || "newest",
    page: clampNumber(readParam(params, "page"), 1, 1, 500),
    limit: clampNumber(readParam(params, "limit"), 12, 1, 48),
  };
}

export function parsePublicVendorQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): PublicVendorQueryInput {
  return {
    limit: clampNumber(readParam(params, "limit"), 10, 1, 48),
    page: clampNumber(readParam(params, "page"), 1, 1, 500),
  };
}

function productSelect() {
  return {
    id: true,
    slug: true,
    name: true,
    description: true,
    price: true,
    compareAtPrice: true,
    discountPct: true,
    images: true,
    category: true,
    sizes: true,
    colors: true,
    totalSold: true,
    isFestivalSale: true,
    isYearRoundSale: true,
    vendor: {
      select: {
        id: true,
        shopName: true,
        slug: true,
        logo: true,
      },
    },
    reviews: {
      select: {
        rating: true,
      },
    },
    _count: {
      select: {
        reviews: true,
      },
    },
  } satisfies Prisma.ProductSelect;
}

function buildProductWhere(input: PublicProductQueryInput): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...publicProductVisibilityFilter,
  };

  if (input.category) where.category = input.category;
  if (input.tag === "festival_sale") where.isFestivalSale = true;
  else if (input.tag === "year_round_sale") where.isYearRoundSale = true;
  if (input.featured) where.isFeatured = true;
  if (input.minDiscount !== undefined) where.discountPct = { gte: input.minDiscount };
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    where.price = {
      ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
      ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
    };
  }
  if (input.size.length > 0) where.sizes = { hasSome: input.size };
  if (input.color.length > 0) where.colors = { hasSome: input.color };
  if (input.q) {
    where.OR = [
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
      { category: { contains: input.q, mode: "insensitive" } },
      { tags: { hasSome: [input.q.toLowerCase()] } },
    ];
  }

  return where;
}

function buildProductOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput {
  if (sort === "totalSold" || sort === "popularity") return { totalSold: "desc" };
  if (sort === "price_asc") return { price: "asc" };
  if (sort === "price_desc") return { price: "desc" };
  if (sort === "discount") return { discountPct: "desc" };
  return { createdAt: "desc" };
}

async function queryPublicProducts(input: PublicProductQueryInput) {
  const where = buildProductWhere(input);
  const orderBy = buildProductOrderBy(input.sort);

  const [products, total, facets] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: productSelect(),
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: publicProductVisibilityFilter,
      select: {
        category: true,
        sizes: true,
        colors: true,
      },
      take: 500,
    }),
  ]);

  return {
    products,
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
    filters: {
      categories: Array.from(new Set(facets.map((item) => item.category).filter(Boolean))).sort(),
      sizes: Array.from(new Set(facets.flatMap((item) => item.sizes))).sort(),
      colors: Array.from(new Set(facets.flatMap((item) => item.colors))).sort(),
    },
    queryKey: productQueryKey(input),
  };
}

function buildSearchWhere(input: PublicSearchQueryInput): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...publicProductVisibilityFilter,
    OR: [
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
      { category: { contains: input.q, mode: "insensitive" } },
      { tags: { hasSome: [input.q.toLowerCase()] } },
    ],
  };

  if (input.category) where.category = input.category;
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    where.price = {
      ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
      ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
    };
  }
  if (input.size) where.sizes = { has: input.size };
  if (input.color) where.colors = { has: input.color };
  if (input.rating) where.reviews = { some: { rating: { gte: input.rating } } };
  if (input.inStock) where.stock = { gt: 0 };
  if (input.tag === "festival_sale") where.isFestivalSale = true;
  else if (input.tag === "year_round_sale") where.isYearRoundSale = true;

  return where;
}

async function queryPublicSearch(input: PublicSearchQueryInput) {
  if (!input.q) {
    return {
      products: [],
      vendors: [],
      categories: [],
      total: 0,
      page: input.page,
      totalPages: 0,
      queryKey: searchQueryKey(input),
    };
  }

  const where = buildSearchWhere(input);
  const orderBy =
    input.sort === "totalSold"
      ? { totalSold: "desc" as const }
      : input.sort === "price_asc"
        ? { price: "asc" as const }
        : input.sort === "price_desc"
          ? { price: "desc" as const }
          : input.sort === "rating"
            ? { reviews: { _count: "desc" as const } }
            : { createdAt: "desc" as const };

  const [products, total, vendors, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
      select: productSelect(),
    }),
    prisma.product.count({ where }),
    prisma.vendor.findMany({
      where: {
        ...publicVendorVisibilityFilter,
        OR: [
          { shopName: { contains: input.q, mode: "insensitive" } },
          { category: { contains: input.q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        shopName: true,
        slug: true,
        logo: true,
        category: true,
      },
    }),
    prisma.category.findMany({
      where: {
        name: { contains: input.q, mode: "insensitive" },
      },
      take: 5,
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return {
    products,
    vendors,
    categories,
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
    queryKey: searchQueryKey(input),
  };
}

async function queryPublicVendors(input: PublicVendorQueryInput) {
  const where: Prisma.VendorWhereInput = {
    ...publicVendorVisibilityFilter,
  };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select: {
        id: true,
        shopName: true,
        slug: true,
        logo: true,
        banner: true,
        description: true,
        category: true,
        zone: true,
        district: true,
        isPartnered: true,
        isTopShop: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        reviews: {
          where: { isVisible: true },
          select: { rating: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        products: {
          _count: "desc",
        },
      },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    vendors,
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
    queryKey: vendorQueryKey(input),
  };
}

export async function getCachedPublicProducts(input: PublicProductQueryInput) {
  return unstable_cache(() => queryPublicProducts(input), ["public-products", productQueryKey(input)], {
    revalidate: PUBLIC_CATALOG_REVALIDATE_SECONDS,
    tags: ["public-products"],
  })();
}

export async function getCachedPublicSearch(input: PublicSearchQueryInput) {
  return unstable_cache(() => queryPublicSearch(input), ["public-search", searchQueryKey(input)], {
    revalidate: PUBLIC_SEARCH_REVALIDATE_SECONDS,
    tags: ["public-search"],
  })();
}

export async function getCachedPublicVendors(input: PublicVendorQueryInput) {
  return unstable_cache(() => queryPublicVendors(input), ["public-vendors", vendorQueryKey(input)], {
    revalidate: PUBLIC_VENDOR_REVALIDATE_SECONDS,
    tags: ["public-vendors"],
  })();
}

export function publicCatalogCacheHeaders(revalidateSeconds = PUBLIC_CATALOG_REVALIDATE_SECONDS) {
  return {
    "Cache-Control": `public, s-maxage=${revalidateSeconds}, stale-while-revalidate=${revalidateSeconds * 6}`,
  };
}
