import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

dotenv.config({ path: ".env.local" });

process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";

const ws = require("ws");
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = false;

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("Missing DIRECT_URL for Prisma seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const users = [
  { email: "admin@fitbazar.com", password: "Admin@123", role: Role.ADMIN, name: "Fit Bazar Admin", phone: "9800000001" },
  { email: "vendor@fitbazar.com", password: "Vendor@123", role: Role.VENDOR, name: "Kathmandu Threads Owner", phone: "9800000002" },
  { email: "vendor2@fitbazar.com", password: "Vendor2@123", role: Role.VENDOR, name: "Newari Weaves Owner", phone: "9800000003" },
  { email: "customer@fitbazar.com", password: "Customer@123", role: Role.CUSTOMER, name: "Fit Bazar Customer", phone: "9800000004" },
];

const vendorConfigs = [
  {
    email: "vendor@fitbazar.com",
    shopName: "Kathmandu Threads",
    slug: "kathmandu-threads",
    category: "Ethnic Wear",
    description: "Modern festive fashion with refined Nepali tailoring.",
    logo: "https://picsum.photos/seed/kathmandu-threads-logo/200/200",
    banner: "https://picsum.photos/seed/kathmandu-threads-banner/1400/400",
  },
  {
    email: "vendor2@fitbazar.com",
    shopName: "Newari Weaves",
    slug: "newari-weaves",
    category: "Traditional",
    description: "Handcrafted heritage-inspired textiles and traditional silhouettes.",
    logo: "https://picsum.photos/seed/newari-weaves-logo/200/200",
    banner: "https://picsum.photos/seed/newari-weaves-banner/1400/400",
  },
];

const categoryNames = [
  "Men",
  "Women",
  "Kids",
  "Ethnic Wear",
  "Sportswear",
  "Accessories",
  "Footwear",
  "Traditional",
];

const productSeeds = [
  { name: "Pashmina Wrap Shawl", category: "Women", sizes: ["Free"], colors: ["Crimson", "Ivory", "Navy"], price: 4200, sold: 143 },
  { name: "Dhaka Topi", category: "Accessories", sizes: ["M", "L"], colors: ["Maroon", "Blue", "Black"], price: 950, sold: 221 },
  { name: "Embroidered Kurta Set", category: "Men", sizes: ["S", "M", "L", "XL"], colors: ["Olive", "Maroon", "Cream"], price: 3600, sold: 198 },
  { name: "Silk Saree Handwoven", category: "Women", sizes: ["Free"], colors: ["Ruby", "Gold", "Emerald"], price: 7900, sold: 87 },
  { name: "Cotton Daura Suruwal", category: "Traditional", sizes: ["S", "M", "L", "XL"], colors: ["White", "Beige", "Stone"], price: 3100, sold: 177 },
  { name: "Block Print Kurti", category: "Women", sizes: ["XS", "S", "M", "L"], colors: ["Pink", "Blue", "Mustard"], price: 2200, sold: 129 },
  { name: "Woolen Jacket Nepal", category: "Men", sizes: ["M", "L", "XL"], colors: ["Charcoal", "Brown", "Forest"], price: 5400, sold: 102 },
  { name: "Nepali Sports Jogger", category: "Sportswear", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Grey", "Navy"], price: 1800, sold: 265 },
  { name: "Festive Lehenga Red", category: "Women", sizes: ["S", "M", "L"], colors: ["Red", "Wine", "Rose"], price: 6800, sold: 92 },
  { name: "Mens Linen Kurta", category: "Men", sizes: ["S", "M", "L", "XL"], colors: ["Sand", "White", "Olive"], price: 2400, sold: 188 },
  { name: "Hand Woven Dhaka Scarf", category: "Accessories", sizes: ["Free"], colors: ["Blue", "Red", "Ochre"], price: 1200, sold: 150 },
  { name: "Kids Ethnic Outfit", category: "Kids", sizes: ["4Y", "6Y", "8Y"], colors: ["Yellow", "Pink", "Blue"], price: 2100, sold: 75 },
  { name: "Sports Track Suit", category: "Sportswear", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Blue", "White"], price: 2600, sold: 241 },
  { name: "Winter Sherpa Hoodie", category: "Men", sizes: ["M", "L", "XL"], colors: ["Grey", "Navy", "Rust"], price: 3300, sold: 156 },
  { name: "Batik Print Saree", category: "Women", sizes: ["Free"], colors: ["Teal", "Orange", "Berry"], price: 4700, sold: 98 },
  { name: "Patan Dhaka Tote Bag", category: "Accessories", sizes: ["Free"], colors: ["Indigo", "Brick", "Black"], price: 1400, sold: 134 },
  { name: "Handloom Cotton Dupatta", category: "Women", sizes: ["Free"], colors: ["Peach", "Ivory", "Mauve"], price: 1100, sold: 205 },
  { name: "Thangka Print Tshirt", category: "Men", sizes: ["S", "M", "L", "XL"], colors: ["White", "Black", "Olive"], price: 1500, sold: 276 },
  { name: "Mountain Trek Jacket", category: "Sportswear", sizes: ["M", "L", "XL"], colors: ["Slate", "Olive", "Red"], price: 5900, sold: 119 },
  { name: "Yoga Linen Pants", category: "Sportswear", sizes: ["S", "M", "L"], colors: ["Sand", "Mocha", "Black"], price: 1700, sold: 214 },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function createPicsumImages(seed: string) {
  return [1, 2, 3].map((index) => `https://picsum.photos/seed/${seed}-${index}/900/1200`);
}

async function main() {
  console.log("🌱 Seeding database...");

  const userMap = new Map<string, { id: string; email: string; role: Role }>();

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        phone: user.phone,
        password: hashedPassword,
        role: user.role,
        isBanned: false,
      },
      create: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        password: hashedPassword,
        role: user.role,
      },
      select: { id: true, email: true, role: true },
    });

    userMap.set(user.email, createdUser);
  }
  console.log("✅ Core users created");

  const vendorMap = new Map<string, { id: string; slug: string; shopName: string }>();

  for (const config of vendorConfigs) {
    const owner = userMap.get(config.email);
    if (!owner) throw new Error(`Missing owner for vendor ${config.shopName}`);

    const vendor = await prisma.vendor.upsert({
      where: { slug: config.slug },
      update: {
        userId: owner.id,
        shopName: config.shopName,
        category: config.category,
        description: config.description,
        logo: config.logo,
        banner: config.banner,
        isApproved: true,
        isSuspended: false,
      },
      create: {
        userId: owner.id,
        shopName: config.shopName,
        slug: config.slug,
        category: config.category,
        description: config.description,
        logo: config.logo,
        banner: config.banner,
        isApproved: true,
      },
      select: { id: true, slug: true, shopName: true },
    });

    vendorMap.set(config.slug, vendor);
  }
  console.log("✅ Vendor profiles created");

  for (const categoryName of categoryNames) {
    await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: { name: categoryName },
      create: {
        name: categoryName,
        slug: slugify(categoryName),
        image: `https://picsum.photos/seed/category-${slugify(categoryName)}/300/300`,
      },
    });
  }
  console.log("✅ Categories created");

  const festivalIndexes = new Set([0, 3, 8, 11, 15]);
  const yearRoundIndexes = new Set([1, 2, 5, 7, 9, 12, 18, 19]);
  const createdProducts: Array<{ id: string; slug: string; vendorId: string; price: number; sizes: string[]; colors: string[]; category: string }> = [];

  for (let index = 0; index < productSeeds.length; index += 1) {
    const product = productSeeds[index];
    const discountPct = 10 + (index % 5) * 10;
    const compareAtPrice = Math.round(product.price * (1 + discountPct / 100));
    const stock = 5 + ((index * 7) % 46);
    const vendor = index % 2 === 0 ? vendorMap.get("kathmandu-threads") : vendorMap.get("newari-weaves");

    if (!vendor) throw new Error("Missing vendor for product creation");

    const created = await prisma.product.upsert({
      where: { slug: slugify(product.name) },
      update: {
        vendorId: vendor.id,
        name: product.name,
        description: `${product.name} made for everyday Nepali fashion with marketplace-ready styling and finish.`,
        price: product.price,
        compareAtPrice,
        discountPct,
        images: createPicsumImages(slugify(product.name)),
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        stock,
        totalSold: product.sold,
        isFestivalSale: festivalIndexes.has(index),
        isYearRoundSale: yearRoundIndexes.has(index),
        isFeatured: index < 4,
        isActive: true,
        tags: [slugify(product.category), "nepal", "fit-bazar"],
      },
      create: {
        vendorId: vendor.id,
        name: product.name,
        slug: slugify(product.name),
        description: `${product.name} made for everyday Nepali fashion with marketplace-ready styling and finish.`,
        price: product.price,
        compareAtPrice,
        discountPct,
        images: createPicsumImages(slugify(product.name)),
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        stock,
        totalSold: product.sold,
        isFestivalSale: festivalIndexes.has(index),
        isYearRoundSale: yearRoundIndexes.has(index),
        isFeatured: index < 4,
        tags: [slugify(product.category), "nepal", "fit-bazar"],
      },
      select: {
        id: true,
        slug: true,
        vendorId: true,
        price: true,
        sizes: true,
        colors: true,
        category: true,
      },
    });

    createdProducts.push(created);
  }
  console.log("✅ 20 sample products created");

  const customer = userMap.get("customer@fitbazar.com");
  if (!customer) throw new Error("Missing customer account");

  await prisma.address.upsert({
    where: { id: "seed-address-customer" },
    update: {
      userId: customer.id,
      name: "Fit Bazar Customer",
      phone: "9800000004",
      line1: "Lazimpat Chowk, Ward 2",
      zone: "Kathmandu",
      district: "Kathmandu",
      isDefault: true,
    },
    create: {
      id: "seed-address-customer",
      userId: customer.id,
      name: "Fit Bazar Customer",
      phone: "9800000004",
      line1: "Lazimpat Chowk, Ward 2",
      zone: "Kathmandu",
      district: "Kathmandu",
      isDefault: true,
    },
  });

  const orderProducts = createdProducts.slice(0, 5);

  for (let index = 0; index < orderProducts.length; index += 1) {
    const product = orderProducts[index];
    const vendor = vendorConfigs[index % 2];
    const vendorProfile = vendorMap.get(vendor.slug);
    if (!vendorProfile) continue;

    await prisma.order.upsert({
      where: { orderNumber: `FB-SEED-000${index + 1}` },
      update: {
        customerId: customer.id,
        vendorId: vendorProfile.id,
        totalAmount: product.price,
        commissionAmt: Math.round(product.price * 0.08),
        vendorPayout: Math.round(product.price * 0.92),
        paymentMethod: index % 2 === 0 ? "KHALTI" : "COD",
        paymentStatus: index % 2 === 0 ? "PAID" : "PENDING",
        status: [OrderStatus.PENDING, OrderStatus.RECEIVED, OrderStatus.PACKED, OrderStatus.HANDED_TO_DELIVERY, OrderStatus.DELIVERED][index],
        deliveryAddress: {
          name: "Fit Bazar Customer",
          phone: "9800000004",
          line1: "Lazimpat Chowk, Ward 2",
          zone: "Kathmandu",
          district: "Kathmandu",
        },
      },
      create: {
        orderNumber: `FB-SEED-000${index + 1}`,
        customerId: customer.id,
        vendorId: vendorProfile.id,
        totalAmount: product.price,
        commissionAmt: Math.round(product.price * 0.08),
        vendorPayout: Math.round(product.price * 0.92),
        paymentMethod: index % 2 === 0 ? "KHALTI" : "COD",
        paymentStatus: index % 2 === 0 ? "PAID" : "PENDING",
        status: [OrderStatus.PENDING, OrderStatus.RECEIVED, OrderStatus.PACKED, OrderStatus.HANDED_TO_DELIVERY, OrderStatus.DELIVERED][index],
        deliveryAddress: {
          name: "Fit Bazar Customer",
          phone: "9800000004",
          line1: "Lazimpat Chowk, Ward 2",
          zone: "Kathmandu",
          district: "Kathmandu",
        },
        items: {
          create: {
            productId: product.id,
            quantity: 1 + (index % 2),
            size: product.sizes[0] || null,
            color: product.colors[0] || null,
            price: product.price,
          },
        },
      },
    });
  }
  console.log("✅ Sample orders created");

  const reviewProducts = createdProducts.slice(0, 3);
  for (let index = 0; index < reviewProducts.length; index += 1) {
    const product = reviewProducts[index];
    await prisma.review.upsert({
      where: { id: `seed-review-${index + 1}` },
      update: {
        userId: customer.id,
        productId: product.id,
        rating: 5 - index,
        comment: [
          "Beautiful quality and fast delivery inside Kathmandu.",
          "Great value for the price and the finish feels premium.",
          "Exactly matched the photos and sizing expectations.",
        ][index],
        images: [],
      },
      create: {
        id: `seed-review-${index + 1}`,
        userId: customer.id,
        productId: product.id,
        rating: 5 - index,
        comment: [
          "Beautiful quality and fast delivery inside Kathmandu.",
          "Great value for the price and the finish feels premium.",
          "Exactly matched the photos and sizing expectations.",
        ][index],
        images: [],
      },
    });
  }
  console.log("✅ Reviews created");

  const couponExpiry = new Date();
  couponExpiry.setDate(couponExpiry.getDate() + 30);

  for (const coupon of [
    { code: "DASHAIN10", discountPct: 10, maxUses: 100 },
    { code: "FITBAZAR20", discountPct: 20, maxUses: 100 },
  ]) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon, expiresAt: couponExpiry, isActive: true },
      create: { ...coupon, expiresAt: couponExpiry, isActive: true },
    });
  }
  console.log("✅ Coupons created");

  const festivalEnd = new Date();
  festivalEnd.setDate(festivalEnd.getDate() + 30);

  await prisma.festivalConfig.upsert({
    where: { id: "festival-seed-main" },
    update: {
      name: "Dashain",
      nameNp: "दशैँ",
      endDate: festivalEnd,
      isActive: true,
    },
    create: {
      id: "festival-seed-main",
      name: "Dashain",
      nameNp: "दशैँ",
      endDate: festivalEnd,
      isActive: true,
    },
  });
  console.log("✅ Festival config created");

  await prisma.siteSettings.upsert({
    where: { id: "settings-main" },
    update: {
      commissionPct: 8,
      minFreeDelivery: 2000,
      whatsappNumber: "9779841234567",
      announcementBar: "Dashain shopping is live. Free delivery above NPR 2,000 across Nepal.",
      announcementActive: true,
    },
    create: {
      id: "settings-main",
      commissionPct: 8,
      minFreeDelivery: 2000,
      whatsappNumber: "9779841234567",
      announcementBar: "Dashain shopping is live. Free delivery above NPR 2,000 across Nepal.",
      announcementActive: true,
    },
  });
  console.log("✅ Site settings created");

  const banners = [
    {
      id: "banner-seed-1",
      imageUrl: "https://picsum.photos/seed/fitbazar-banner-1/1600/600",
      linkUrl: "/products?tag=festival_sale",
      title: "Dashain Festival Edit",
      displayOrder: 1,
    },
    {
      id: "banner-seed-2",
      imageUrl: "https://picsum.photos/seed/fitbazar-banner-2/1600/600",
      linkUrl: "/products?category=women",
      title: "New Season Arrivals",
      displayOrder: 2,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: { ...banner, isActive: true },
      create: { ...banner, isActive: true },
    });
  }
  console.log("✅ Banners created");

  await prisma.notification.upsert({
    where: { id: "notification-seed-customer" },
    update: {
      userId: customer.id,
      title: "Your order is pending",
      message: "We have received your order and the vendor is preparing it.",
      type: "ORDER",
      link: "/account/orders",
    },
    create: {
      id: "notification-seed-customer",
      userId: customer.id,
      title: "Your order is pending",
      message: "We have received your order and the vendor is preparing it.",
      type: "ORDER",
      link: "/account/orders",
    },
  });

  await prisma.notification.upsert({
    where: { id: "notification-seed-vendor" },
    update: {
      userId: userMap.get("vendor@fitbazar.com")!.id,
      title: "New order received",
      message: "A new customer order needs attention in your dashboard.",
      type: "ORDER",
      link: "/vendor/orders",
    },
    create: {
      id: "notification-seed-vendor",
      userId: userMap.get("vendor@fitbazar.com")!.id,
      title: "New order received",
      message: "A new customer order needs attention in your dashboard.",
      type: "ORDER",
      link: "/vendor/orders",
    },
  });
  console.log("✅ Notifications created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
