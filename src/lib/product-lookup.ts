import type { Prisma } from "@prisma/client";
import { publicProductVisibilityFilter } from "./public-storefront";
import { slugify } from "./slug";

export function productAliasTerms(identifier: string) {
  return identifier
    .split(/[-\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .slice(0, 4);
}

export function publicProductIdentityWhere(identifier: string): Prisma.ProductWhereInput {
  const normalizedSlug = slugify(identifier);

  return {
    ...publicProductVisibilityFilter,
    OR: [{ slug: identifier }, { slug: normalizedSlug }, { id: identifier }],
  };
}

export function publicProductAliasWhere(identifier: string): Prisma.ProductWhereInput | null {
  const terms = productAliasTerms(identifier);
  if (terms.length < 2) return null;

  return {
    ...publicProductVisibilityFilter,
    AND: terms.map((term) => ({
      name: { contains: term, mode: "insensitive" as const },
    })),
  };
}
