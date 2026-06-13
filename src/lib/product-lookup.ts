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

export type ProductLookupCandidate = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  tags?: string[];
  totalSold?: number;
};

export function normalizeProductLookupTerm(value: string) {
  return slugify(value).replace(/(.)\1{2,}/g, "$1");
}

function levenshteinDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previous = rows[0];
    rows[0] = rightIndex;

    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const temp = rows[leftIndex];
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      rows[leftIndex] = Math.min(
        rows[leftIndex] + 1,
        rows[leftIndex - 1] + 1,
        previous + cost,
      );
      previous = temp;
    }
  }

  return rows[left.length];
}

function candidateTerms(candidate: ProductLookupCandidate) {
  return Array.from(
    new Set(
      [
        candidate.slug,
        candidate.name,
        candidate.category || "",
        ...(candidate.tags || []),
      ]
        .flatMap((value) => productAliasTerms(value.replace(/-/g, " ")))
        .map(normalizeProductLookupTerm)
        .filter(Boolean),
    ),
  );
}

function scoreTerm(queryTerm: string, productTerm: string) {
  if (queryTerm === productTerm) return 2;
  if (queryTerm.length >= 4 && (productTerm.startsWith(queryTerm) || queryTerm.startsWith(productTerm))) return 1.4;

  const longest = Math.max(queryTerm.length, productTerm.length);
  if (longest < 5) return 0;

  const similarity = 1 - levenshteinDistance(queryTerm, productTerm) / longest;
  return similarity >= 0.62 ? similarity : 0;
}

export function scoreProductLookupCandidate(identifier: string, candidate: ProductLookupCandidate) {
  const queryTerms = productAliasTerms(identifier).map(normalizeProductLookupTerm).filter(Boolean);
  if (queryTerms.length < 2) return 0;

  const terms = candidateTerms(candidate);
  if (!terms.length) return 0;

  return queryTerms.reduce((score, queryTerm) => {
    const bestTermScore = Math.max(...terms.map((term) => scoreTerm(queryTerm, term)));
    return score + bestTermScore;
  }, 0);
}

export function pickBestProductLookupCandidate<T extends ProductLookupCandidate>(identifier: string, candidates: T[]) {
  const scored = candidates
    .map((candidate) => ({
      candidate,
      score: scoreProductLookupCandidate(identifier, candidate),
    }))
    .filter((item) => item.score >= 3.2)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.candidate.totalSold || 0) - (left.candidate.totalSold || 0);
    });

  return scored[0]?.candidate ?? null;
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
