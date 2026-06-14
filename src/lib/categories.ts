const categoryAliases: Record<string, string> = {
  men: "Men",
  mens: "Men",
  mensfashion: "Men",
  mensfashionnepal: "Men",
  male: "Men",
  "mens-fashion-nepal": "Men",
  women: "Women",
  womens: "Women",
  womensfashion: "Women",
  womensfashionnepal: "Women",
  woman: "Women",
  female: "Women",
  ladies: "Women",
  "womens-fashion-nepal": "Women",
  kids: "Kids",
  kid: "Kids",
  children: "Kids",
  childrens: "Kids",
  ethnic: "Ethnic Wear",
  ethnicwear: "Ethnic Wear",
  "ethnic-wear": "Ethnic Wear",
  traditional: "Ethnic Wear",
  traditionalwear: "Ethnic Wear",
  kurta: "Ethnic Wear",
  sports: "Sportswear",
  sportswear: "Sportswear",
  activewear: "Sportswear",
  accessories: "Accessories",
  accessory: "Accessories",
  jewellery: "Accessories",
  jewelry: "Accessories",
  watches: "Accessories",
  watch: "Accessories",
  bags: "Accessories",
  bag: "Accessories",
  wallets: "Accessories",
  wallet: "Accessories",
  footwear: "Footwear",
  shoes: "Footwear",
  shoe: "Footwear",
  sneakers: "Footwear",
  sneaker: "Footwear",
  streetwear: "Streetwear",
  "streetwear-nepal": "Streetwear",
  hoodies: "Hoodies",
  hoodie: "Hoodies",
  "hoodies-nepal": "Hoodies",
  sale: "Sale",
  "all-sale": "Sale",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export type FashionCategoryIconKey =
  | "men"
  | "women"
  | "kids"
  | "ethnic"
  | "sportswear"
  | "footwear"
  | "accessories"
  | "bags"
  | "watches"
  | "streetwear"
  | "hoodies"
  | "sale";

export type FashionCategoryLink = {
  label: string;
  shortLabel: string;
  href: string;
  category?: string;
  slug: string;
  iconKey: FashionCategoryIconKey;
  description: string;
};

export const fashionCategoryLinks: FashionCategoryLink[] = [
  {
    label: "Men's Fashion",
    shortLabel: "Men",
    href: "/collections/mens-fashion-nepal",
    category: "Men",
    slug: "mens-fashion-nepal",
    iconKey: "men",
    description: "Shirts, hoodies, streetwear, shoes",
  },
  {
    label: "Women's Fashion",
    shortLabel: "Women",
    href: "/collections/womens-fashion-nepal",
    category: "Women",
    slug: "womens-fashion-nepal",
    iconKey: "women",
    description: "Daily wear, festive outfits, accessories",
  },
  {
    label: "Kids",
    shortLabel: "Kids",
    href: "/collections/kids",
    category: "Kids",
    slug: "kids",
    iconKey: "kids",
    description: "Comfortable outfits for children",
  },
  {
    label: "Ethnic Wear",
    shortLabel: "Ethnic",
    href: "/collections/ethnic",
    category: "Ethnic Wear",
    slug: "ethnic",
    iconKey: "ethnic",
    description: "Kurtas, festive and traditional looks",
  },
  {
    label: "Sportswear",
    shortLabel: "Sportswear",
    href: "/collections/sportswear",
    category: "Sportswear",
    slug: "sportswear",
    iconKey: "sportswear",
    description: "Active layers and gym-ready pieces",
  },
  {
    label: "Footwear",
    shortLabel: "Shoes",
    href: "/collections/footwear",
    category: "Footwear",
    slug: "footwear",
    iconKey: "footwear",
    description: "Sneakers, sandals, and everyday shoes",
  },
  {
    label: "Accessories",
    shortLabel: "Accessories",
    href: "/collections/accessories",
    category: "Accessories",
    slug: "accessories",
    iconKey: "accessories",
    description: "Jewellery, watches, bags, finishing pieces",
  },
  {
    label: "Bags & Wallets",
    shortLabel: "Bags",
    href: "/products?category=Accessories&q=bag",
    category: "Accessories",
    slug: "bags-wallets",
    iconKey: "bags",
    description: "Carry essentials for daily style",
  },
  {
    label: "Watches",
    shortLabel: "Watches",
    href: "/products?category=Accessories&q=watch",
    category: "Accessories",
    slug: "watches",
    iconKey: "watches",
    description: "Everyday and occasion watches",
  },
  {
    label: "Streetwear",
    shortLabel: "Streetwear",
    href: "/collections/streetwear-nepal",
    slug: "streetwear-nepal",
    iconKey: "streetwear",
    description: "Oversized fits, hoodies, urban layers",
  },
  {
    label: "Hoodies",
    shortLabel: "Hoodies",
    href: "/collections/hoodies-nepal",
    slug: "hoodies-nepal",
    iconKey: "hoodies",
    description: "Warm layers and casual comfort",
  },
  {
    label: "Sale",
    shortLabel: "Sale",
    href: "/collections/sale",
    slug: "sale",
    iconKey: "sale",
    description: "Discounted fashion picks",
  },
];

export const desktopFashionNavLinks = fashionCategoryLinks.filter((item) =>
  ["mens-fashion-nepal", "womens-fashion-nepal", "kids", "ethnic", "footwear", "accessories", "sale"].includes(item.slug),
);

const categoryPathAliases: Record<string, string> = {
  men: "/collections/mens-fashion-nepal",
  mens: "/collections/mens-fashion-nepal",
  mensfashion: "/collections/mens-fashion-nepal",
  mensfashionnepal: "/collections/mens-fashion-nepal",
  women: "/collections/womens-fashion-nepal",
  womens: "/collections/womens-fashion-nepal",
  womensfashion: "/collections/womens-fashion-nepal",
  womensfashionnepal: "/collections/womens-fashion-nepal",
  ethnicwear: "/collections/ethnic",
  ethnic: "/collections/ethnic",
  traditionalwear: "/collections/ethnic",
  traditional: "/collections/ethnic",
  sports: "/collections/sportswear",
  sportswear: "/collections/sportswear",
  activewear: "/collections/sportswear",
  shoes: "/collections/footwear",
  shoe: "/collections/footwear",
  sneakers: "/collections/footwear",
  sneaker: "/collections/footwear",
  footwear: "/collections/footwear",
  accessories: "/collections/accessories",
  accessory: "/collections/accessories",
  jewellery: "/collections/accessories",
  jewelry: "/collections/accessories",
  watches: "/products?category=Accessories&q=watch",
  watch: "/products?category=Accessories&q=watch",
  bags: "/products?category=Accessories&q=bag",
  bag: "/products?category=Accessories&q=bag",
  wallets: "/products?category=Accessories&q=bag",
  wallet: "/products?category=Accessories&q=bag",
  streetwear: "/collections/streetwear-nepal",
  streetwearnepal: "/collections/streetwear-nepal",
  hoodies: "/collections/hoodies-nepal",
  hoodie: "/collections/hoodies-nepal",
  hoodiesnepal: "/collections/hoodies-nepal",
  sale: "/collections/sale",
  allsale: "/collections/sale",
};

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

export function collectionHrefForCategory(name: string) {
  const key = normalizeKey(name);
  const normalizedKey = normalizeKey(normalizeCategory(name));
  return categoryPathAliases[key] ?? categoryPathAliases[normalizedKey] ?? `/collections/${categorySlug(name)}`;
}

export function isFashionCategoryName(name: string | null | undefined) {
  if (!name) return false;
  const key = normalizeKey(name);
  const normalizedKey = normalizeKey(normalizeCategory(name));
  return Boolean(categoryPathAliases[key] || categoryPathAliases[normalizedKey]);
}
