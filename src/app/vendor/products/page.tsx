"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import Header from "@/components/Header";
import { Search, Trash2 } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { useLanguage } from "@/lib/LanguageContext";
import VendorSidebar from "@/components/VendorSidebar";
import CloudinaryImageUploader from "@/components/CloudinaryImageUploader";
import ImagePreviewStrip from "@/components/ImagePreviewStrip";

type VendorProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  totalSold: number;
  images: string[];
  isActive: boolean;
  isFestivalSale: boolean;
  isYearRoundSale: boolean;
  description: string | null;
  compareAtPrice: number | null;
  sizes: string[];
  colors: string[];
  status: "ACTIVE" | "HIDDEN" | "DRAFT" | "OUT_OF_STOCK";
};

type VendorProductsResponse = {
  products: VendorProduct[];
  vendor?: {
    shopName: string;
    isApproved: boolean;
    isSuspended: boolean;
  };
};

type VendorProductForm = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  description: string;
  sizes: string;
  colors: string;
  images: string;
  isFestivalSale: boolean;
  isYearRoundSale: boolean;
  isActive: boolean;
  status: VendorProduct["status"];
};

const createEmptyForm = (): VendorProductForm => ({
  id: "",
  name: "",
  category: "Ethnic",
  price: 0,
  compareAtPrice: 0,
  stock: 0,
  description: "",
  sizes: "S,M,L,XL",
  colors: "Red,Blue,Black",
  images: "",
  isFestivalSale: false,
  isYearRoundSale: false,
  isActive: true,
  status: "ACTIVE",
});

export default function VendorProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [form, setForm] = useState<VendorProductForm>(createEmptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [vendorMeta, setVendorMeta] = useState<VendorProductsResponse["vendor"] | null>(null);
  const imageList = form.images.split(",").map((item) => item.trim()).filter(Boolean);

  const loadProducts = useCallback(async () => {
    const response = await fetch(`/api/vendor/products?q=${encodeURIComponent(deferredQuery)}`, { cache: "no-store" });
    const data = (await response.json()) as VendorProductsResponse & { error?: string };
    if (response.ok) {
      setProducts(data.products || []);
      setVendorMeta(data.vendor || null);
      setError("");
    } else {
      setProducts([]);
      setError(data.error || t("vendor_access_unavailable"));
    }
  }, [deferredQuery, t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const startEdit = (product: VendorProduct) => {
    setForm({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      compareAtPrice: product.compareAtPrice || 0,
      stock: product.stock,
      description: product.description || "",
      sizes: product.sizes.join(","),
      colors: product.colors.join(","),
      images: product.images.join(","),
      isFestivalSale: product.isFestivalSale,
      isYearRoundSale: product.isYearRoundSale,
      isActive: product.isActive,
      status: product.status,
    });
  };

  const resetForm = () => setForm(createEmptyForm());

  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        compareAtPrice: Number(form.compareAtPrice) || undefined,
        stock: Number(form.stock),
        description: form.description,
        sizes: form.sizes.split(",").map((item) => item.trim()).filter(Boolean),
        colors: form.colors.split(",").map((item) => item.trim()).filter(Boolean),
        images: form.images.split(",").map((item) => item.trim()).filter(Boolean),
        isFestivalSale: form.isFestivalSale,
        isYearRoundSale: form.isYearRoundSale,
        isActive: form.isActive,
        status: form.status,
      };

      const response = await fetch(form.id ? `/api/vendor/products/${form.id}` : "/api/vendor/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        await loadProducts();
      } else {
        const data = await response.json();
        setError(data.error || "Unable to save product.");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (id: string) => {
    const response = await fetch(`/api/vendor/products/${id}`, { method: "DELETE" });
    if (response.ok) {
      await loadProducts();
      if (form.id === id) resetForm();
    }
  };

  return (
    <main className="bg-page">
      <Header />
      <div className="mx-auto flex max-w-site">
        <VendorSidebar
          shopName={vendorMeta?.shopName}
          isApproved={vendorMeta?.isApproved}
          isSuspended={vendorMeta?.isSuspended}
          subtitle={t("vendor_products")}
        />

        <section className="flex-1 p-4 md:p-6">
          <div className="rounded-[8px] bg-card p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <button type="button" onClick={resetForm} className="btn-primary">{t("add_product")}</button>
              <div className="relative min-w-[280px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search_products")} className="pl-10" />
              </div>
            </div>
            {error ? <p className="mt-3 text-[12px] text-fb-pink">{error}</p> : null}
          </div>

          <div className="mt-4 overflow-hidden rounded-[8px] bg-card">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border-light text-left text-[12px] uppercase tracking-[1px] text-text-muted">
                  <th className="px-4 py-3">{t("thumbnail")}</th>
                  <th className="py-3">{t("name")}</th>
                  <th className="py-3">{t("category")}</th>
                  <th className="py-3">{t("price")} NPR</th>
                  <th className="py-3">{t("stock")}</th>
                  <th className="py-3">{t("orderStatus")}</th>
                  <th className="py-3">{t("sales_count")}</th>
                  <th className="py-3">{t("edit")}</th>
                  <th className="py-3">{t("delete")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border-light text-[13px] text-text-secondary last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="relative h-16 w-12 overflow-hidden rounded-[4px]">
                        <SmartImage src={product.images[0] || "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&auto=format&fit=crop&q=60"} alt={product.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="font-medium text-text-primary">{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.price}</td>
                    <td className={product.stock < 10 ? "text-fb-orange" : ""}>{product.stock}</td>
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
                    <td>{product.totalSold}</td>
                    <td><button type="button" onClick={() => startEdit(product)} className="text-fb-pink">{t("edit")}</button></td>
                    <td><button type="button" onClick={() => removeProduct(product.id)} className="text-fb-pink"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-[8px] bg-card p-5">
            <h2 className="text-[20px] font-semibold text-text-primary">{form.id ? t("edit_product") : t("add_product")}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("product_name")}</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("category")}</label>
                <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("price")}</label>
                <input type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("original_price")}</label>
                <input type="number" value={form.compareAtPrice} onChange={(event) => setForm((current) => ({ ...current, compareAtPrice: Number(event.target.value) }))} />
              </div>
              <div>
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("stock")}</label>
                <input type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("sizes_csv")}</label>
                <input value={form.sizes} onChange={(event) => setForm((current) => ({ ...current, sizes: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("colors_csv")}</label>
                <input value={form.colors} onChange={(event) => setForm((current) => ({ ...current, colors: event.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("image_urls")}</label>
                <textarea rows={3} value={form.images} onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))} />
                <div className="mt-3">
                  <CloudinaryImageUploader
                    buttonLabel={t("upload_product_images")}
                    onUploaded={(urls) =>
                      setForm((current) => ({
                        ...current,
                        images: [...current.images.split(",").map((item) => item.trim()).filter(Boolean), ...urls].join(", "),
                      }))
                    }
                  />
                </div>
                <div className="mt-3">
                  <ImagePreviewStrip
                    images={imageList}
                    emptyText={t("no_images_uploaded_yet")}
                    onRemove={(imageUrl) =>
                      setForm((current) => ({
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
              <div className="md:col-span-2">
                <label className="mb-2 block text-[12px] uppercase tracking-[1px] text-text-muted">{t("description")}</label>
                <textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="md:col-span-2 flex gap-4">
                {[
                  { key: "isFestivalSale", label: t("festival_sale") },
                  { key: "isYearRoundSale", label: t("always_on") },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={form[item.key as keyof typeof form] as boolean}
                      onChange={(event) => setForm((current) => ({ ...current, [item.key]: event.target.checked }))}
                    />
                    <span className="text-[13px] text-text-secondary">{item.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-3">
                  <span className="text-[13px] text-text-secondary">{t("product_status")}</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as VendorProduct["status"],
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
            </div>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={saveProduct} className="btn-primary" disabled={saving}>{saving ? `${t("save")}...` : form.id ? t("update_product") : t("create_product")}</button>
              <button type="button" onClick={resetForm} className="btn-ghost">{t("reset")}</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
