const categoryAliases: Record<string, string> = {
  men: "Men",
  male: "Men",
  women: "Women",
  woman: "Women",
  female: "Women",
  kids: "Kids",
  kid: "Kids",
  children: "Kids",
  ethnic: "Ethnic Wear",
  ethnicwear: "Ethnic Wear",
  "ethnic-wear": "Ethnic Wear",
  sports: "Sportswear",
  sportswear: "Sportswear",
  accessories: "Accessories",
  accessory: "Accessories",
  footwear: "Footwear",
  traditional: "Traditional",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function normalizeCategory(value: string | null | undefined) {
  if (!value) return "";
  const normalized = normalizeKey(value);
  return categoryAliases[normalized] ?? value.trim();
}

export function categoryQueryValue(value: string) {
  const normalized = normalizeCategory(value);
  return normalized || value;
}

export function categorySlug(value: string) {
  const normalized = normalizeCategory(value);
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
