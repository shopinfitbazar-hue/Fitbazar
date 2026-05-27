"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, BellRing, CalendarDays, CheckCircle2, CircleDollarSign, LayoutDashboard, Package, Send, ShoppingCart, Star, Users } from "lucide-react";
import Header from "@/components/Header";
import AdminSidebar from "@/components/AdminSidebar";
import CloudinaryImageUploader from "@/components/CloudinaryImageUploader";
import ImagePreviewStrip from "@/components/ImagePreviewStrip";
import SmartImage from "@/components/ui/SmartImage";
import { formatPriceNpr } from "@/lib/catalog";
import { useLanguage } from "@/lib/LanguageContext";
import { FALLBACK_PRODUCT_IMAGE, getSafeImageUrl, getShowcaseImageUrl } from "@/lib/media";

interface AdminVendor {
  id: string;
  shopName: string;
  isApproved: boolean;
  isSuspended: boolean;
  isPartnered: boolean;
  isTopShop: boolean;
  verificationStatus?: string;
  adminNotes?: string | null;
  phone?: string | null;
  address?: string | null;
  zone?: string | null;
  district?: string | null;
  panNumber?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  user: {
    name: string | null;
    email: string;
    phone?: string | null;
  };
  _count: {
    products: number;
    orders: number;
  };
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  stock?: number;
  description?: string | null;
  compareAtPrice?: number | null;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  discountPct?: number;
  isFeatured: boolean;
  isFestivalSale?: boolean;
  isYearRoundSale?: boolean;
  isActive: boolean;
  status: "ACTIVE" | "HIDDEN" | "DRAFT" | "OUT_OF_STOCK";
  vendor: {
    id?: string;
    shopName: string;
  };
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  vendor: {
    shopName: string;
  };
  customer: {
    name: string | null;
    email: string;
  };
}

interface AdminCustomer {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  emailVerified?: string | null;
  isBanned: boolean;
  createdAt?: string;
  accounts?: Array<{ provider: string }>;
  _count?: {
    orders: number;
    wishlist: number;
    supportTickets: number;
  };
}

interface AdminBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface AdminCoupon {
  id: string;
  code: string;
  discountPct: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface SiteSettingsState {
  commissionPct: number;
  minFreeDelivery: number;
  whatsappNumber: string;
  announcementBar: string;
  announcementActive: boolean;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  seoImage: string;
}

interface FestivalState {
  name: string;
  nameNp: string;
  endDate: string;
  isActive: boolean;
}

type AdminProductDraft = {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  description: string;
  sizes: string;
  colors: string;
  images: string;
  isFeatured: boolean;
  isFestivalSale: boolean;
  isYearRoundSale: boolean;
  isActive: boolean;
  status: AdminProduct["status"];
};

interface AdminSupportTicket {
  id: string;
  name: string;
  email: string;
  topic: string;
  orderNumber?: string | null;
  message: string;
  status: string;
  adminResponse?: string | null;
  createdAt: string;
  messages: Array<{
    id: string;
    sender: "CUSTOMER" | "ADMIN";
    message: string;
    createdAt: string;
  }>;
  replyDraft?: string;
}

interface AdminVendorReview {
  id: string;
  rating: number;
  comment?: string | null;
  isVisible: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
  vendor: {
    shopName: string;
    slug: string;
  };
}

type BroadcastRecipient = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  notificationSent: boolean;
  emailSent: boolean;
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState({ totalGmv: 0, vendors: 0, orders: 0, totalCommission: 0 });
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
  const [supportArchiveCount, setSupportArchiveCount] = useState(0);
  const [vendorReviews, setVendorReviews] = useState<AdminVendorReview[]>([]);
  const [broadcastDraft, setBroadcastDraft] = useState({
    audience: "CUSTOMERS",
    title: "",
    message: "",
    link: "/account/notifications",
    sendEmail: true,
  });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastRecipients, setBroadcastRecipients] = useState<BroadcastRecipient[]>([]);
  const [settings, setSettings] = useState<SiteSettingsState>({
    commissionPct: 8,
    minFreeDelivery: 2000,
    whatsappNumber: "",
    announcementBar: "",
    announcementActive: false,
    supportEmail: "support@fitbazar.com",
    supportPhone: "+977 9800000000",
    supportHours: "Sun-Fri, 10am-6pm",
    heroEyebrow: "Nepal's premium fashion marketplace",
    heroTitle: "Discover sharper style, faster shopping, and curated Nepal-first fashion.",
    heroSubtitle: "Mobile-first discovery, partner-led fashion drops, and cleaner product storytelling built for modern shoppers.",
    heroPrimaryLabel: "Shop New Arrivals",
    heroPrimaryHref: "/products",
    heroSecondaryLabel: "Explore Collections",
    heroSecondaryHref: "/discover",
    seoImage: "/opengraph-image",
  });
  const [festival, setFestival] = useState<FestivalState>({
    name: "Dashain",
    nameNp: "दशैं",
    endDate: "",
    isActive: false,
  });
  const [bannerDraft, setBannerDraft] = useState({
    imageUrl: "",
    title: "",
    linkUrl: "",
    displayOrder: 0,
    isActive: true,
  });
  const [productDraft, setProductDraft] = useState<AdminProductDraft>({
    id: "",
    vendorId: "",
    name: "",
    category: "Ethnic Wear",
    price: 0,
    compareAtPrice: 0,
    stock: 0,
    description: "",
    sizes: "S,M,L,XL",
    colors: "Red,Blue,Black",
    images: "",
    isFeatured: false,
    isFestivalSale: false,
    isYearRoundSale: false,
    isActive: true,
    status: "ACTIVE",
  });
  const [couponDraft, setCouponDraft] = useState({
    id: "",
    code: "",
    discountPct: 10,
    maxUses: 100,
    expiresAt: "",
    isActive: true,
  });
  const [message, setMessage] = useState("");

  async function loadAdmin() {
    const [statsResponse, vendorsResponse, productsResponse, ordersResponse, customersResponse, bannersResponse, settingsResponse, festivalResponse, couponsResponse, supportResponse, vendorReviewsResponse] = await Promise.all([
      fetch("/api/admin/stats", { cache: "no-store" }),
      fetch("/api/admin/vendors", { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/admin/banners", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
      fetch("/api/festival-config", { cache: "no-store" }),
      fetch("/api/admin/coupons", { cache: "no-store" }),
      fetch("/api/admin/support", { cache: "no-store" }),
      fetch("/api/admin/vendor-reviews", { cache: "no-store" }),
    ]);

    const [statsData, vendorsData, productsData, ordersData, customersData, bannersData, settingsData, festivalData, couponsData, supportData, vendorReviewsData] = await Promise.all([
      statsResponse.json(),
      vendorsResponse.json(),
      productsResponse.json(),
      ordersResponse.json(),
      customersResponse.json(),
      bannersResponse.json(),
      settingsResponse.json(),
      festivalResponse.json(),
      couponsResponse.json(),
      supportResponse.json(),
      vendorReviewsResponse.json(),
    ]);

    if (statsResponse.ok) setStats(statsData.stats);
    if (vendorsResponse.ok) setVendors(vendorsData.vendors || []);
    if (productsResponse.ok) setProducts(productsData.products || []);
    if (ordersResponse.ok) setOrders(ordersData.orders || []);
    if (customersResponse.ok) setCustomers(customersData.customers || []);
    if (bannersResponse.ok) setBanners(bannersData.banners || []);
    if (couponsResponse.ok) setCoupons(couponsData.coupons || []);
    if (supportResponse.ok) {
      setSupportTickets(supportData.tickets || []);
      setSupportArchiveCount(supportData.archivedCount || 0);
    }
    if (vendorReviewsResponse.ok) setVendorReviews(vendorReviewsData.reviews || []);
    if (settingsResponse.ok && settingsData.settings) {
      setSettings((current) => ({ ...current, ...settingsData.settings }));
    }
    if (festivalResponse.ok && festivalData) {
      setFestival({
        name: festivalData.name || "Dashain",
        nameNp: festivalData.nameNp || "दशैं",
        endDate: festivalData.endDate ? String(festivalData.endDate).slice(0, 10) : "",
        isActive: Boolean(festivalData.isActive),
      });
    }
  }

  useEffect(() => {
    void loadAdmin();
  }, []);

  useEffect(() => {
    const updateSection = () => {
      const hash = window.location.hash.replace("#", "");
      setActiveSection(hash || "dashboard");
    };

    updateSection();
    window.addEventListener("hashchange", updateSection);
    return () => window.removeEventListener("hashchange", updateSection);
  }, []);

  const statCards = [
    { label: t("total_gmv"), value: formatPriceNpr(stats.totalGmv), icon: CircleDollarSign },
    { label: t("vendors"), value: String(stats.vendors), icon: Users },
    { label: t("orders"), value: String(stats.orders), icon: ShoppingCart },
    { label: t("commission"), value: formatPriceNpr(stats.totalCommission), icon: Package },
  ];

  const updateVendor = async (
    id: string,
    payload: { isApproved?: boolean; isSuspended?: boolean; isPartnered?: boolean; isTopShop?: boolean; verificationStatus?: string; adminNotes?: string },
  ) => {
    await fetch(`/api/admin/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadAdmin();
  };

  const updateProduct = async (id: string, payload: { isFeatured?: boolean; isActive?: boolean; status?: string }) => {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await loadAdmin();
  };

  const sendBroadcast = async () => {
    setBroadcastSending(true);
    setBroadcastRecipients([]);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastDraft),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        notified?: number;
        emailed?: number;
        recipients?: BroadcastRecipient[];
        privacy?: string;
      };

      if (!response.ok) {
        setMessage(result.error || "Failed to send notification.");
        return;
      }

      setBroadcastRecipients(result.recipients || []);
      setMessage(
        `Notification sent to ${result.notified || 0} account${result.notified === 1 ? "" : "s"}${result.emailed ? ` and emailed privately to ${result.emailed}` : ""}.`,
      );
      setBroadcastDraft((current) => ({ ...current, title: "", message: "" }));
    } finally {
      setBroadcastSending(false);
    }
  };

  const editProduct = (product: AdminProduct) => {
    setProductDraft({
      id: product.id,
      vendorId: product.vendor.id || "",
      name: product.name,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice || 0,
      stock: product.stock || 0,
      description: product.description || "",
      sizes: product.sizes?.join(",") || "",
      colors: product.colors?.join(",") || "",
      images: product.images?.join(",") || "",
      isFeatured: product.isFeatured,
      isFestivalSale: Boolean(product.isFestivalSale),
      isYearRoundSale: Boolean(product.isYearRoundSale),
      isActive: product.isActive,
      status: product.status,
    });
    window.location.hash = "products";
  };

  const resetProductDraft = () => {
    setProductDraft({
      id: "",
      vendorId: vendors[0]?.id || "",
      name: "",
      category: "Ethnic Wear",
      price: 0,
      compareAtPrice: 0,
      stock: 0,
      description: "",
      sizes: "S,M,L,XL",
      colors: "Red,Blue,Black",
      images: "",
      isFeatured: false,
      isFestivalSale: false,
      isYearRoundSale: false,
      isActive: true,
      status: "ACTIVE",
    });
  };

  const makeAdminCoverImage = (imageUrl: string) => {
    setProductDraft((current) => {
      const images = current.images.split(",").map((item) => item.trim()).filter(Boolean);
      return {
        ...current,
        images: [imageUrl, ...images.filter((item) => item !== imageUrl)].join(", "),
      };
    });
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm(t("discontinue_product_confirm"))) return;

    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { error?: string; deleted?: boolean; discontinued?: boolean };

    if (!response.ok) {
      setMessage(result.error || t("failed_to_delete_product"));
      return;
    }

    setMessage(result.deleted ? t("product_deleted") : t("product_discontinued"));
    if (productDraft.id === id) resetProductDraft();
    await loadAdmin();
  };

  const updateCustomer = async (id: string, isBanned: boolean) => {
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned }),
    });
    await loadAdmin();
  };

  const saveSettings = async () => {
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (response.ok) {
      setMessage(t("settings_updated"));
      await loadAdmin();
    }
  };

  const saveFestival = async () => {
    const response = await fetch("/api/festival-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: festival.name,
        nameNp: festival.nameNp,
        endDate: festival.endDate,
        isActive: festival.isActive,
      }),
    });
    if (response.ok) {
      setMessage(t("festival_updated"));
      await loadAdmin();
    }
  };

  const createBanner = async () => {
    const response = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bannerDraft),
    });
    if (response.ok) {
      setBannerDraft({ imageUrl: "", title: "", linkUrl: "", displayOrder: 0, isActive: true });
      setMessage(t("banner_created"));
      await loadAdmin();
    }
  };

  const updateBanner = async (id: string, payload: Partial<AdminBanner>) => {
    const response = await fetch(`/api/admin/banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      await loadAdmin();
    }
  };

  const deleteBanner = async (id: string) => {
    const response = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    if (response.ok) {
      setMessage(t("banner_deleted"));
      await loadAdmin();
    }
  };

  const saveProduct = async () => {
    const payload = {
      vendorId: productDraft.vendorId,
      name: productDraft.name,
      category: productDraft.category,
      price: Number(productDraft.price),
      compareAtPrice: Number(productDraft.compareAtPrice) || undefined,
      stock: Number(productDraft.stock),
      description: productDraft.description,
      sizes: productDraft.sizes.split(",").map((item) => item.trim()).filter(Boolean),
      colors: productDraft.colors.split(",").map((item) => item.trim()).filter(Boolean),
      images: productDraft.images.split(",").map((item) => item.trim()).filter(Boolean),
      isFeatured: productDraft.isFeatured,
      isFestivalSale: productDraft.isFestivalSale,
      isYearRoundSale: productDraft.isYearRoundSale,
      isActive: productDraft.isActive,
      status: productDraft.status,
    };

    const response = await fetch(productDraft.id ? `/api/admin/products/${productDraft.id}` : "/api/admin/products", {
      method: productDraft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || t("failed_to_save_product"));
      return;
    }

    setMessage(productDraft.id ? t("product_updated") : t("product_created"));
    resetProductDraft();
    await loadAdmin();
  };

  const saveCoupon = async () => {
    const payload = {
      code: couponDraft.code,
      discountPct: Number(couponDraft.discountPct),
      maxUses: Number(couponDraft.maxUses),
      expiresAt: couponDraft.expiresAt || undefined,
      isActive: couponDraft.isActive,
    };

    const response = await fetch(couponDraft.id ? `/api/admin/coupons/${couponDraft.id}` : "/api/admin/coupons", {
      method: couponDraft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || t("failed_to_save_coupon"));
      return;
    }

    setCouponDraft({
      id: "",
      code: "",
      discountPct: 10,
      maxUses: 100,
      expiresAt: "",
      isActive: true,
    });
    setMessage(couponDraft.id ? t("coupon_updated") : t("coupon_created"));
    await loadAdmin();
  };

  const editCoupon = (coupon: AdminCoupon) => {
    setCouponDraft({
      id: coupon.id,
      code: coupon.code,
      discountPct: coupon.discountPct,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "",
      isActive: coupon.isActive,
    });
    window.location.hash = "coupons";
  };

  const deleteCoupon = async (id: string) => {
    const response = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (response.ok) {
      setMessage(t("coupon_deleted"));
      await loadAdmin();
    }
  };

  const topShops = useMemo(
    () => vendors.filter((vendor) => vendor.isPartnered && vendor.isTopShop).slice(0, 4),
    [vendors],
  );
  const draftProducts = useMemo(
    () => products.filter((product) => product.status === "DRAFT"),
    [products],
  );

  const updateSupportTicket = async (id: string, payload: { status?: string; adminResponse?: string; replyMessage?: string }) => {
    const response = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      await loadAdmin();
    }
  };

  const updateVendorReview = async (id: string, isVisible: boolean) => {
    const response = await fetch(`/api/admin/vendor-reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible }),
    });
    if (response.ok) {
      await loadAdmin();
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site gap-4 px-4 py-5">
        <AdminSidebar activeSection={activeSection} />

        <section className="min-w-0 flex-1">
          <div className="mb-5 rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
            <div className="text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">Fit Bazar Operations</div>
            <h1 className="mt-2 text-[28px] font-semibold text-text-primary">Admin Control Center</h1>
            <p className="mt-2 max-w-[720px] text-[14px] text-text-secondary">
              Manage vendors, product approvals, homepage content, customer access, orders, and support from one place.
            </p>
          </div>

          {message ? (
            <div className="mb-4 rounded-[8px] border border-border-light bg-card p-4 text-[13px] text-text-secondary">
              {message}
            </div>
          ) : null}

          <div id="dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 scroll-mt-24">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-[8px] border border-border-light bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                  <stat.icon className="h-6 w-6 text-fb-pink" />
                  <span className="text-[12px] uppercase tracking-[1px] text-text-muted">{stat.label}</span>
                </div>
                <div className="mt-4 text-[28px] font-bold text-text-primary">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("platform_trend")}</h2>
              <div className="flex items-center gap-2 text-[12px] text-text-muted">
                <LayoutDashboard className="h-4 w-4" />
                {t("live_overview")}
              </div>
            </div>
            <p className="text-[14px] text-text-muted">{t("orders")}: {stats.orders} • {t("vendors")}: {stats.vendors} • {t("total_gmv")}: {formatPriceNpr(stats.totalGmv)}</p>
          </div>

          <div id="vendors" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("vendors")}</h2>
            <div className="mt-4 space-y-3">
              {vendors.slice(0, 5).map((vendor) => (
                <div key={vendor.id} className="flex flex-col gap-3 rounded-[8px] border border-border-light p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">{vendor.shopName}</div>
                    <div className="mt-1 text-[13px] text-text-secondary">{vendor.user.name} • {vendor.user.email}</div>
                    <div className="text-[12px] text-text-muted">
                      {vendor._count.products} {t("products").toLowerCase()} • {vendor.isApproved ? t("approved") : t("pending")}
                      {" • "}
                      {vendor.isPartnered ? t("partnered_vendor") : t("not_partnered")}
                      {vendor.isTopShop ? ` • ${t("top_shop")}` : ""}
                    </div>
                    <div className="mt-2 grid gap-1 text-[12px] text-text-muted md:grid-cols-2">
                      <span>{t("phone_number")}: {vendor.phone || vendor.user.phone || "-"}</span>
                      <span>{t("pan_number")}: {vendor.panNumber || "-"}</span>
                      <span>{t("business_address")}: {vendor.address || "-"}</span>
                      <span>{t("district")}: {vendor.district || "-"}</span>
                      <span>{t("zone")}: {vendor.zone || "-"}</span>
                      <span>{t("bank_name")}: {vendor.bankName || "-"}</span>
                      <span>{t("account_number")}: {vendor.accountNumber || "-"}</span>
                      <span>{t("account_holder")}: {vendor.accountHolder || "-"}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="badge badge-amber">{vendor.verificationStatus || "PENDING"}</span>
                      <select
                        value={vendor.verificationStatus || "PENDING"}
                        onChange={(event) => void updateVendor(vendor.id, { verificationStatus: event.target.value })}
                        className="max-w-[180px]"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      className="mt-3"
                      placeholder={t("admin_notes")}
                      value={vendor.adminNotes || ""}
                      onChange={(event) =>
                        setVendors((current) =>
                          current.map((item) => (item.id === vendor.id ? { ...item, adminNotes: event.target.value } : item)),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateVendor(vendor.id, { isApproved: true, isSuspended: false })} className="btn-primary px-4 py-2">{t("approve")}</button>
                    <button type="button" onClick={() => updateVendor(vendor.id, { isSuspended: !vendor.isSuspended })} className="btn-ghost px-4 py-2">{vendor.isSuspended ? t("unsuspend") : t("suspend")}</button>
                    <button type="button" onClick={() => updateVendor(vendor.id, { isPartnered: !vendor.isPartnered, isTopShop: vendor.isPartnered ? false : vendor.isTopShop })} className="btn-ghost px-4 py-2">
                      {vendor.isPartnered ? t("remove_partner") : t("make_partner")}
                    </button>
                    <button type="button" onClick={() => updateVendor(vendor.id, { isTopShop: !vendor.isTopShop, isPartnered: true })} className="btn-ghost px-4 py-2">
                      {vendor.isTopShop ? t("remove_top_shop") : t("mark_top_shop")}
                    </button>
                    <button type="button" onClick={() => updateVendor(vendor.id, { adminNotes: vendor.adminNotes || "" })} className="btn-ghost px-4 py-2">
                      {t("save_notes")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="products" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("products")}</h2>
              <span className="rounded-full bg-[var(--amber-bg)] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-fb-orange">
                {draftProducts.length} awaiting approval
              </span>
            </div>
            {draftProducts.length ? (
              <div className="mt-4 grid gap-4">
                {draftProducts.map((product) => {
                  const rawImages = product.images?.filter(Boolean) || [];
                  const coverImage = getSafeImageUrl(rawImages[0], FALLBACK_PRODUCT_IMAGE);

                  return (
                    <div key={product.id} className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[8px] bg-[#f7f1ea]">
                          <SmartImage src={getShowcaseImageUrl(coverImage)} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-amber">{t("draft")}</span>
                            {product.isFestivalSale ? <span className="badge badge-pink">{t("festival_sale")}</span> : null}
                            {product.isYearRoundSale ? <span className="badge badge-orange">{t("all_year_sale")}</span> : null}
                          </div>
                          <h3 className="mt-3 text-[18px] font-semibold text-text-primary">{product.name}</h3>
                          <p className="mt-1 text-[13px] text-text-muted">
                            {product.vendor.shopName} • {product.category} • {formatPriceNpr(product.price)} • Stock {product.stock ?? 0}
                          </p>
                          <p className="mt-3 text-[14px] text-text-secondary">{product.description || "No description provided."}</p>
                          <div className="mt-3 grid gap-2 text-[12px] text-text-muted md:grid-cols-2">
                            <span>Sizes: {product.sizes?.join(", ") || "-"}</span>
                            <span>Colors: {product.colors?.join(", ") || "-"}</span>
                            <span>Compare at: {product.compareAtPrice ? formatPriceNpr(product.compareAtPrice) : "-"}</span>
                            <span>Discount: {product.discountPct || 0}%</span>
                          </div>
                          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {rawImages.map((image) => (
                              <div key={image} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[6px] border border-border-light bg-white">
                                <SmartImage src={getSafeImageUrl(image, FALLBACK_PRODUCT_IMAGE)} alt={`${product.name} raw`} fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-row gap-2 lg:flex-col">
                          <button type="button" onClick={() => updateProduct(product.id, { status: "ACTIVE" })} className="btn-primary inline-flex items-center gap-2 px-4 py-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {t("approve")}
                          </button>
                          <button type="button" onClick={() => editProduct(product)} className="btn-ghost px-4 py-2">
                            {t("edit")}
                          </button>
                          <button type="button" onClick={() => updateProduct(product.id, { status: "HIDDEN" })} className="btn-ghost px-4 py-2">
                            {t("hide")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4 text-[13px] text-text-muted">
                No draft products waiting right now.
              </div>
            )}
            <div className="mt-4 grid gap-4 rounded-[8px] border border-border-light p-4 lg:grid-cols-2">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("vendors")}</label>
                  <select value={productDraft.vendorId} onChange={(event) => setProductDraft((current) => ({ ...current, vendorId: event.target.value }))}>
                    <option value="">{t("select_vendor")}</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.shopName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("product_name")}</label>
                  <input value={productDraft.name} onChange={(event) => setProductDraft((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("category")}</label>
                  <input value={productDraft.category} onChange={(event) => setProductDraft((current) => ({ ...current, category: event.target.value }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("price")}</label>
                    <input type="number" value={productDraft.price || ""} onChange={(event) => setProductDraft((current) => ({ ...current, price: Number(event.target.value) }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("original_price")}</label>
                    <input type="number" value={productDraft.compareAtPrice || ""} onChange={(event) => setProductDraft((current) => ({ ...current, compareAtPrice: Number(event.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("stock")}</label>
                  <input type="number" value={productDraft.stock || ""} onChange={(event) => setProductDraft((current) => ({ ...current, stock: Number(event.target.value) }))} />
                </div>
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("description")}</label>
                  <textarea rows={4} value={productDraft.description} onChange={(event) => setProductDraft((current) => ({ ...current, description: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("sizes_csv")}</label>
                  <input value={productDraft.sizes} onChange={(event) => setProductDraft((current) => ({ ...current, sizes: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("colors_csv")}</label>
                  <input value={productDraft.colors} onChange={(event) => setProductDraft((current) => ({ ...current, colors: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("image_urls")}</label>
                  <textarea rows={3} value={productDraft.images} onChange={(event) => setProductDraft((current) => ({ ...current, images: event.target.value }))} />
                  <div className="mt-3">
                    <CloudinaryImageUploader
                      buttonLabel={t("upload_product_images")}
                      enableCamera
                      onUploaded={(urls) =>
                        setProductDraft((current) => ({
                          ...current,
                          images: [...current.images.split(",").map((item) => item.trim()).filter(Boolean), ...urls].join(", "),
                        }))
                      }
                    />
                  </div>
                  <div className="mt-3">
                    <ImagePreviewStrip
                      images={productDraft.images.split(",").map((item) => item.trim()).filter(Boolean)}
                      emptyText={t("no_images_uploaded_yet")}
                      showShowcasePreview
                      onMakeCover={makeAdminCoverImage}
                      onRemove={(imageUrl) =>
                        setProductDraft((current) => ({
                          ...current,
                          images: current.images
                            .split(",")
                            .map((item) => item.trim())
                            .filter((item) => item && item !== imageUrl)
                            .join(", "),
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Selling options</label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { key: "isFeatured", label: t("feature"), hint: "Homepage boost", icon: Star },
                      { key: "isFestivalSale", label: t("festival_sale"), hint: "Seasonal campaign", icon: CalendarDays },
                      { key: "isYearRoundSale", label: t("all_year_sale"), hint: "Keep discount live", icon: BadgePercent },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = productDraft[item.key as keyof typeof productDraft] as boolean;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setProductDraft((current) => ({ ...current, [item.key]: !active }))}
                          className={`flex min-h-[74px] items-center gap-3 rounded-[8px] border p-4 text-left transition-shadow ${
                            active ? "border-fb-pink bg-fb-pink-bg shadow-[var(--shadow-sm)]" : "border-border-light bg-[var(--bg-surface)] hover:shadow-[var(--shadow-sm)]"
                          }`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${active ? "bg-white text-fb-pink" : "bg-white text-text-muted"}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold leading-5 text-text-primary">{item.label}</span>
                            <span className="mt-0.5 block text-[12px] leading-4 text-text-muted">{item.hint}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                  <label className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <span>{t("product_status")}</span>
                    <select
                      value={productDraft.status}
                      onChange={(event) =>
                        setProductDraft((current) => ({
                          ...current,
                          status: event.target.value as AdminProduct["status"],
                          isActive: event.target.value === "ACTIVE",
                        }))
                      }
                      className="rounded-[8px] border border-border-default bg-white px-3 py-2 text-[13px] text-text-primary"
                    >
                      <option value="ACTIVE">{t("active")}</option>
                      <option value="HIDDEN">{t("hidden")}</option>
                      <option value="DRAFT">{t("draft")}</option>
                      <option value="OUT_OF_STOCK">{t("out_of_stock")}</option>
                    </select>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={saveProduct} className="btn-primary">
                    {productDraft.id ? t("update_product") : t("create_product")}
                  </button>
                  <button type="button" onClick={resetProductDraft} className="btn-ghost">
                    {t("reset")}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border-light text-left text-[12px] uppercase tracking-[1px] text-text-muted">
                    <th className="py-3">{t("name")}</th>
                    <th className="py-3">{t("vendors")}</th>
                    <th className="py-3">{t("price")}</th>
                    <th className="py-3">{t("state")}</th>
                    <th className="py-3">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border-light text-[13px] text-text-secondary last:border-b-0">
                      <td className="py-4 font-medium text-text-primary">{product.name}</td>
                      <td>{product.vendor.shopName}</td>
                      <td>{formatPriceNpr(product.price)}</td>
                      <td>
                        <span className={`badge ${product.status === "ACTIVE" ? "badge-green" : product.status === "OUT_OF_STOCK" ? "badge-orange" : "badge-amber"}`}>
                          {product.status === "ACTIVE"
                            ? t("active")
                            : product.status === "OUT_OF_STOCK"
                              ? t("out_of_stock")
                              : product.status === "DRAFT"
                                ? t("draft")
                                : t("hidden")}
                        </span>
                      </td>
                      <td className="flex gap-2 py-4">
                        <button type="button" onClick={() => editProduct(product)} className="text-fb-pink">
                          {t("edit")}
                        </button>
                        <button type="button" onClick={() => updateProduct(product.id, { isFeatured: !product.isFeatured })} className="text-fb-pink">
                          {product.isFeatured ? t("unfeature") : t("feature")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateProduct(product.id, {
                              status: product.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
                            })
                          }
                          className="text-fb-pink"
                        >
                          {product.status === "ACTIVE" ? t("hide") : t("show")}
                        </button>
                        <button type="button" onClick={() => deleteProduct(product.id)} className="text-fb-pink">
                          {t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div id="orders" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("recent_orders")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border-light text-left text-[12px] uppercase tracking-[1px] text-text-muted">
                    <th className="py-3">{t("orderId")}</th>
                    <th className="py-3">{t("vendors")}</th>
                    <th className="py-3">{t("customer")}</th>
                    <th className="py-3">{t("amount")}</th>
                    <th className="py-3">{t("orderStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b border-border-light text-[13px] text-text-secondary last:border-b-0">
                      <td className="py-4 font-medium text-text-primary">{order.orderNumber}</td>
                      <td>{order.vendor.shopName}</td>
                      <td>{order.customer.name || order.customer.email}</td>
                      <td className="font-medium text-text-primary">{formatPriceNpr(order.totalAmount)}</td>
                      <td>
                        <span className={`badge ${order.status === "DELIVERED" ? "badge-green" : order.status === "PACKED" ? "badge-orange" : "badge-pink"}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div id="customers" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("customers")}</h2>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {customers.map((customer) => (
                <div key={customer.id} className="flex flex-col gap-3 rounded-[8px] border border-border-light p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[14px] font-semibold text-text-primary">{customer.name || t("customer")}</div>
                      <span className={`badge ${customer.isBanned ? "badge-orange" : "badge-green"}`}>
                        {customer.isBanned ? "Banned" : t("active")}
                      </span>
                    </div>
                    <div className="mt-1 text-[13px] text-text-secondary">{customer.email}</div>
                    <div className="mt-1 grid gap-1 text-[12px] text-text-muted md:grid-cols-2">
                      <span>{t("phone_number")}: {customer.phone || "-"}</span>
                      <span>{t("orders")}: {customer._count?.orders ?? 0}</span>
                      <span>{t("wishlist")}: {customer._count?.wishlist ?? 0}</span>
                      <span>{t("help_support")}: {customer._count?.supportTickets ?? 0}</span>
                      <span>{t("login_methods")}: {customer.accounts?.map((account) => account.provider).join(", ") || "credentials"}</span>
                      <span>{t("joined")}: {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-NP") : "-"}</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => updateCustomer(customer.id, !customer.isBanned)} className="btn-ghost px-4 py-2">
                    {customer.isBanned ? t("unban") : t("ban")}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div id="notifications" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-fb-pink" />
              <div>
                <h2 className="text-[16px] font-semibold text-text-primary">{t("notifications")}</h2>
                <p className="text-[13px] text-text-muted">Send website notifications and optional email to customers or vendors.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Audience</label>
                <select
                  value={broadcastDraft.audience}
                  onChange={(event) => setBroadcastDraft((current) => ({ ...current, audience: event.target.value }))}
                >
                  <option value="CUSTOMERS">Customers</option>
                  <option value="VENDORS">Vendors</option>
                  <option value="ALL">Customers + Vendors</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Title</label>
                <input value={broadcastDraft.title} onChange={(event) => setBroadcastDraft((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="lg:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Message</label>
                <textarea rows={4} value={broadcastDraft.message} onChange={(event) => setBroadcastDraft((current) => ({ ...current, message: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Link</label>
                <input value={broadcastDraft.link} onChange={(event) => setBroadcastDraft((current) => ({ ...current, link: event.target.value }))} />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex items-center gap-2 rounded-[8px] border border-border-light bg-[var(--bg-surface)] px-4 py-3 text-[13px] text-text-secondary">
                  <input
                    type="checkbox"
                    checked={broadcastDraft.sendEmail}
                    onChange={(event) => setBroadcastDraft((current) => ({ ...current, sendEmail: event.target.checked }))}
                    className="h-4 w-4"
                  />
                  Also email
                </label>
                <button type="button" onClick={sendBroadcast} disabled={broadcastSending} className="btn-primary inline-flex items-center gap-2 disabled:opacity-70">
                  <Send className="h-4 w-4" />
                  {broadcastSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
            {broadcastRecipients.length ? (
              <div className="mt-4 rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-text-primary">Sent recipients</h3>
                    <p className="mt-1 text-[12px] text-text-muted">
                      Admin-only list. Each email was sent separately, so customers cannot see other recipients.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-text-secondary">
                    {broadcastRecipients.length} website • {broadcastRecipients.filter((recipient) => recipient.emailSent).length} email
                  </span>
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto rounded-[8px] border border-border-light bg-card">
                  {broadcastRecipients.map((recipient) => (
                    <div key={recipient.id} className="grid gap-2 border-b border-border-light px-4 py-3 text-[13px] last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-center">
                      <span className="font-medium text-text-primary">{recipient.name || "Unnamed account"}</span>
                      <span className="break-all text-text-secondary">{recipient.email}</span>
                      <span className={`badge ${recipient.emailSent ? "badge-green" : "badge-amber"}`}>
                        {recipient.emailSent ? "Email sent" : "Website only"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div id="coupons" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("coupons")}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <input placeholder={t("coupon_code")} value={couponDraft.code} onChange={(event) => setCouponDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />
              <input type="number" placeholder={t("discount_percent")} value={couponDraft.discountPct} onChange={(event) => setCouponDraft((current) => ({ ...current, discountPct: Number(event.target.value) }))} />
              <input type="number" placeholder={t("max_uses")} value={couponDraft.maxUses} onChange={(event) => setCouponDraft((current) => ({ ...current, maxUses: Number(event.target.value) }))} />
              <input type="date" value={couponDraft.expiresAt} onChange={(event) => setCouponDraft((current) => ({ ...current, expiresAt: event.target.value }))} />
              <button type="button" onClick={saveCoupon} className="btn-primary">
                {couponDraft.id ? t("save") : t("create_coupon")}
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="flex flex-col gap-3 rounded-[8px] border border-border-light p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[14px] font-semibold text-text-primary">{coupon.code}</div>
                    <div className="mt-1 text-[13px] text-text-secondary">{coupon.discountPct}% • {coupon.usedCount}/{coupon.maxUses} {t("used")}</div>
                    <div className="text-[12px] text-text-muted">
                      {coupon.expiresAt ? `${t("end_date")}: ${new Date(coupon.expiresAt).toLocaleDateString("en-NP")}` : t("no_expiry")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editCoupon(coupon)} className="btn-ghost px-4 py-2">{t("edit")}</button>
                    <button type="button" onClick={() => deleteCoupon(coupon.id)} className="btn-primary px-4 py-2">{t("delete")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("partnered_shops")}</h2>
            <p className="mt-2 text-[14px] text-text-secondary">{t("top_shops_intro")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {topShops.map((vendor) => (
                <div key={vendor.id} className="rounded-[8px] border border-border-light p-4">
                  <div className="text-[14px] font-semibold text-text-primary">{vendor.shopName}</div>
                  <div className="mt-1 text-[12px] text-text-muted">{vendor._count.products} {t("products").toLowerCase()} • {vendor._count.orders} {t("orders").toLowerCase()}</div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => updateVendor(vendor.id, { isTopShop: false })} className="btn-ghost px-4 py-2">{t("remove_top_shop")}</button>
                    <button type="button" onClick={() => updateVendor(vendor.id, { isPartnered: false, isTopShop: false })} className="btn-primary px-4 py-2">{t("remove_partner")}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div id="settings" className="rounded-[8px] bg-card p-5 scroll-mt-24">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("site_settings")}</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Commission %</label>
                  <input type="number" value={settings.commissionPct} onChange={(event) => setSettings((current) => ({ ...current, commissionPct: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("free_delivery_threshold")}</label>
                  <input type="number" value={settings.minFreeDelivery} onChange={(event) => setSettings((current) => ({ ...current, minFreeDelivery: Number(event.target.value) }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("whatsapp_number")}</label>
                  <input value={settings.whatsappNumber} onChange={(event) => setSettings((current) => ({ ...current, whatsappNumber: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("support_email")}</label>
                  <input value={settings.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("support_phone")}</label>
                  <input value={settings.supportPhone} onChange={(event) => setSettings((current) => ({ ...current, supportPhone: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("support_hours")}</label>
                  <input value={settings.supportHours} onChange={(event) => setSettings((current) => ({ ...current, supportHours: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("announcement_bar")}</label>
                  <textarea rows={3} value={settings.announcementBar} onChange={(event) => setSettings((current) => ({ ...current, announcementBar: event.target.value }))} />
                </div>
                <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                  <input type="checkbox" checked={settings.announcementActive} onChange={(event) => setSettings((current) => ({ ...current, announcementActive: event.target.checked }))} />
                  {t("enable_announcement_bar")}
                </label>
                <div className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                  <h3 className="text-[14px] font-semibold text-text-primary">SEO Search Image</h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Controls the preview image shared through Open Graph and used as a search result image candidate after crawlers refresh.
                  </p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-border-light bg-card">
                      <SmartImage
                        src={settings.seoImage || "/opengraph-image"}
                        alt="SEO search preview image"
                        fill
                        sizes="220px"
                        className="object-cover"
                      />
                    </div>
                    <div className="grid gap-3">
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">Image URL</label>
                        <input
                          value={settings.seoImage || ""}
                          placeholder="/opengraph-image or uploaded image URL"
                          onChange={(event) => setSettings((current) => ({ ...current, seoImage: event.target.value }))}
                        />
                      </div>
                      <CloudinaryImageUploader
                        buttonLabel="Upload SEO Image"
                        multiple={false}
                        enableCamera
                        onUploaded={(urls) => setSettings((current) => ({ ...current, seoImage: urls[0] || current.seoImage }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-[8px] border border-border-light bg-[var(--bg-surface)] p-4">
                  <h3 className="text-[14px] font-semibold text-text-primary">{t("hero_content")}</h3>
                  <p className="mt-1 text-[13px] text-text-muted">{t("hero_content_help")}</p>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("hero_eyebrow")}</label>
                      <input value={settings.heroEyebrow} onChange={(event) => setSettings((current) => ({ ...current, heroEyebrow: event.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("hero_title")}</label>
                      <textarea rows={2} value={settings.heroTitle} onChange={(event) => setSettings((current) => ({ ...current, heroTitle: event.target.value }))} />
                    </div>
                    <div>
                      <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("hero_subtitle")}</label>
                      <textarea rows={3} value={settings.heroSubtitle} onChange={(event) => setSettings((current) => ({ ...current, heroSubtitle: event.target.value }))} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("primary_cta_label")}</label>
                        <input value={settings.heroPrimaryLabel} onChange={(event) => setSettings((current) => ({ ...current, heroPrimaryLabel: event.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("primary_cta_link")}</label>
                        <input value={settings.heroPrimaryHref} onChange={(event) => setSettings((current) => ({ ...current, heroPrimaryHref: event.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("secondary_cta_label")}</label>
                        <input value={settings.heroSecondaryLabel} onChange={(event) => setSettings((current) => ({ ...current, heroSecondaryLabel: event.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("secondary_cta_link")}</label>
                        <input value={settings.heroSecondaryHref} onChange={(event) => setSettings((current) => ({ ...current, heroSecondaryHref: event.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={saveSettings} className="btn-primary w-fit">
                  {t("save_settings")}
                </button>
              </div>
            </div>

            <div id="festival" className="rounded-[8px] bg-card p-5 scroll-mt-24">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("festival_control")}</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("festival_name")}</label>
                  <input value={festival.name} onChange={(event) => setFestival((current) => ({ ...current, name: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("festival_name_nepali")}</label>
                  <input value={festival.nameNp} onChange={(event) => setFestival((current) => ({ ...current, nameNp: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("end_date")}</label>
                  <input type="date" value={festival.endDate} onChange={(event) => setFestival((current) => ({ ...current, endDate: event.target.value }))} />
                </div>
                <label className="flex items-center gap-3 text-[13px] text-text-secondary">
                  <input type="checkbox" checked={festival.isActive} onChange={(event) => setFestival((current) => ({ ...current, isActive: event.target.checked }))} />
                  {t("festival_sale_active")}
                </label>
                <button type="button" onClick={saveFestival} className="btn-primary w-fit">
                  {t("save_festival")}
                </button>
              </div>
            </div>
          </div>

          <div id="banners" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <h2 className="text-[16px] font-semibold text-text-primary">{t("banner_manager")}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto_auto]">
              <input placeholder={t("image_url")} value={bannerDraft.imageUrl} onChange={(event) => setBannerDraft((current) => ({ ...current, imageUrl: event.target.value }))} />
              <input placeholder={t("title")} value={bannerDraft.title} onChange={(event) => setBannerDraft((current) => ({ ...current, title: event.target.value }))} />
              <input placeholder={t("link_url")} value={bannerDraft.linkUrl} onChange={(event) => setBannerDraft((current) => ({ ...current, linkUrl: event.target.value }))} />
              <input type="number" placeholder={t("order_label")} value={bannerDraft.displayOrder} onChange={(event) => setBannerDraft((current) => ({ ...current, displayOrder: Number(event.target.value) }))} />
              <button type="button" onClick={createBanner} className="btn-primary">
                {t("add_banner")}
              </button>
            </div>
            <div className="mt-3">
              <CloudinaryImageUploader
                buttonLabel={t("upload_banner_image")}
                multiple={false}
                enableCamera
                onUploaded={(urls) => setBannerDraft((current) => ({ ...current, imageUrl: urls[0] || current.imageUrl }))}
              />
            </div>

            <div className="mt-4 space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="grid gap-4 rounded-[8px] border border-border-light p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
                  <div className="relative h-24 overflow-hidden rounded-[6px]">
                    <SmartImage src={banner.imageUrl} alt={banner.title || "Banner"} fill className="object-cover" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={banner.title || ""} onChange={(event) => setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, title: event.target.value } : item))} />
                    <input value={banner.linkUrl || ""} onChange={(event) => setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, linkUrl: event.target.value } : item))} />
                    <input value={banner.imageUrl} onChange={(event) => setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, imageUrl: event.target.value } : item))} className="md:col-span-2" />
                    <div className="flex items-center gap-3">
                      <input type="number" value={banner.displayOrder} onChange={(event) => setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, displayOrder: Number(event.target.value) } : item))} />
                      <label className="flex items-center gap-2 text-[13px] text-text-secondary">
                        <input type="checkbox" checked={banner.isActive} onChange={(event) => setBanners((current) => current.map((item) => item.id === banner.id ? { ...item, isActive: event.target.checked } : item))} />
                        {t("active")}
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateBanner(banner.id, banner)} className="btn-ghost px-4 py-2">
                      {t("save")}
                    </button>
                    <button type="button" onClick={() => deleteBanner(banner.id)} className="btn-primary px-4 py-2">
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="support" className="mt-4 rounded-[8px] bg-card p-5 scroll-mt-24">
            <div id="vendor-reviews" className="mb-6 scroll-mt-24">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("vendor_reviews")}</h2>
              <div className="mt-4 space-y-3">
                {vendorReviews.map((review) => (
                  <div key={review.id} className="rounded-[8px] border border-border-light p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[14px] font-semibold text-text-primary">{review.vendor.shopName}</div>
                        <div className="mt-1 text-[13px] text-text-secondary">
                          {review.user.name || t("customer")} • {review.user.email}
                        </div>
                        <div className="mt-1 text-[12px] text-text-muted">
                          {new Date(review.createdAt).toLocaleString("en-NP")} • {review.rating}/5
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void updateVendorReview(review.id, !review.isVisible)}
                        className="btn-ghost px-4 py-2"
                      >
                        {review.isVisible ? t("hide") : t("show")}
                      </button>
                    </div>
                    <p className="mt-3 text-[14px] text-text-secondary">{review.comment || t("review_without_comment")}</p>
                  </div>
                ))}
                {!vendorReviews.length ? <p className="text-[13px] text-text-muted">{t("no_vendor_reviews_yet")}</p> : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-[16px] font-semibold text-text-primary">{t("help_support")}</h2>
              <span className="text-[12px] text-text-muted">
                {supportArchiveCount} resolved record{supportArchiveCount === 1 ? "" : "s"} archived after 7 days
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-[8px] border border-border-light p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-[14px] font-semibold text-text-primary">{ticket.topic}</div>
                      <div className="mt-1 text-[13px] text-text-secondary">{ticket.name} • {ticket.email}</div>
                      <div className="mt-1 text-[12px] text-text-muted">
                        {new Date(ticket.createdAt).toLocaleString("en-NP")}
                        {ticket.orderNumber ? ` • ${ticket.orderNumber}` : ""}
                      </div>
                    </div>
                    <select
                      value={ticket.status}
                      onChange={(event) => void updateSupportTicket(ticket.id, { status: event.target.value })}
                      className="max-w-[180px]"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PENDING">PENDING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                  <div className="mt-3 space-y-3">
                    {ticket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-[8px] px-4 py-3 text-[14px] ${
                          message.sender === "ADMIN"
                            ? "bg-fb-pink-bg text-text-primary"
                            : "bg-[var(--bg-surface)] text-text-secondary"
                        }`}
                      >
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[1px] text-text-muted">
                          {message.sender === "ADMIN" ? t("admin") : ticket.name}
                        </div>
                        <p>{message.message}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    className="mt-3"
                    placeholder={t("admin_response")}
                    value={ticket.replyDraft || ticket.adminResponse || ""}
                    onChange={(event) =>
                      setSupportTickets((current) =>
                        current.map((item) => (item.id === ticket.id ? { ...item, replyDraft: event.target.value } : item)),
                      )
                    }
                  />
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        void updateSupportTicket(ticket.id, {
                          status: ticket.status,
                          adminResponse: ticket.replyDraft || ticket.adminResponse || "",
                          replyMessage: ticket.replyDraft || undefined,
                        })
                      }
                      className="btn-primary px-4 py-2"
                    >
                      {t("send_reply")}
                    </button>
                  </div>
                </div>
              ))}
              {!supportTickets.length ? <p className="text-[13px] text-text-muted">{t("no_support_queries")}</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
