"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MapPin, Plus, Edit2, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/lib/ToastContext";
import { useLanguage } from "@/lib/LanguageContext";

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  zone: string;
  district: string;
  isDefault: boolean;
}

const zones = ["Kathmandu", "Lalitpur", "Bhaktapur", "Other Nepal"];

export default function AddressesPage() {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    line1: "",
    zone: "Kathmandu",
    district: "",
    isDefault: false,
  });

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/account/addresses", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setAddresses(data.addresses || []);
      } else {
        addToast(data.error || t("failed_load_addresses"), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const openAddModal = () => {
    setFormData({
      name: "",
      phone: "",
      line1: "",
      zone: "Kathmandu",
      district: "",
      isDefault: addresses.length === 0,
    });
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const openEditModal = (address: Address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      zone: address.zone,
      district: address.district,
      isDefault: address.isDefault,
    });
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const url = editingAddress ? `/api/account/addresses/${editingAddress.id}` : "/api/account/addresses";
    const method = editingAddress ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const data = await response.json();

    if (!response.ok) {
      addToast(data.error || t("failed_save_address"), "error");
      return;
    }

    addToast(editingAddress ? t("address_updated") : t("address_added"), "success");
    setShowAddModal(false);
    await loadAddresses();
  };

  const deleteAddress = async (id: string) => {
    const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      addToast(data.error || t("failed_delete_address"), "error");
      return;
    }
    addToast(t("address_deleted"), "success");
    await loadAddresses();
  };

  const setDefaultAddress = async (address: Address) => {
    const response = await fetch(`/api/account/addresses/${address.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...address, isDefault: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      addToast(data.error || t("failed_update_default_address"), "error");
      return;
    }
    addToast(t("default_address_updated"), "success");
    await loadAddresses();
  };

  return (
    <main className="bg-page">
      <Header />
      
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-fb-pink">{t("home")}</Link>
          <span>/</span>
          <Link href="/account/dashboard" className="hover:text-fb-pink">{t("account")}</Link>
          <span>/</span>
          <span className="font-medium text-text-primary">{t("addresses")}</span>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-fb-pink" />
            {t("addresses")}
          </h1>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t("add_address")}
          </button>
        </div>

        {loading ? (
          <div className="rounded-[8px] bg-card p-8 text-center">
            <p className="text-[14px] text-text-muted">{t("loading_addresses")}</p>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {addresses.map((address) => (
              <div key={address.id} className={`relative rounded-[8px] bg-card p-6 shadow-[var(--shadow-sm)] ${address.isDefault ? "ring-2 ring-fb-pink" : ""}`}>
                {address.isDefault ? (
                  <span className="absolute right-4 top-4 rounded-[20px] bg-fb-pink px-3 py-1 text-xs font-semibold text-white">
                    {t("default_address")}
                  </span>
                ) : null}

                <div className="mb-4">
                  <span className="text-[16px] font-semibold text-text-primary">{address.name}</span>
                </div>

                <p className="mb-1 text-[14px] font-medium text-text-primary">{address.name}</p>
                <p className="mb-1 text-sm text-text-muted">{address.phone}</p>
                <p className="mb-1 text-[14px] text-text-secondary">{address.line1}</p>
                <p className="text-sm text-text-muted">{address.district}, {address.zone}</p>

                <div className="mt-6 flex gap-3 border-t border-border-light pt-4">
                  <button onClick={() => openEditModal(address)} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-fb-pink">
                    <Edit2 className="w-4 h-4" />
                    {t("edit")}
                  </button>
                  <button onClick={() => deleteAddress(address.id)} className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-fb-pink">
                    <Trash2 className="w-4 h-4" />
                    {t("delete")}
                  </button>
                  {!address.isDefault ? (
                    <button onClick={() => setDefaultAddress(address)} className="ml-auto flex items-center gap-2 text-sm font-semibold text-fb-pink">
                      <Check className="w-4 h-4" />
                      {t("set_default_address")}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--bg-surface)]">
              <MapPin className="w-12 h-12 text-text-muted" />
            </div>
            <h2 className="mb-4 text-[24px] font-semibold text-text-primary">{t("no_addresses_saved")}</h2>
            <p className="mb-8 text-text-muted">{t("add_address_checkout")}</p>
            <button onClick={openAddModal} className="btn-primary inline-block">
              {t("add_address")}
            </button>
          </div>
        )}
      </div>

      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-card">
            <div className="flex items-center justify-between border-b border-border-light p-6">
              <h2>{editingAddress ? t("update_address") : t("add_address")}</h2>
              <button onClick={() => setShowAddModal(false)} className="rounded-full p-2 hover:bg-[var(--bg-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("name")}</label>
                <input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required placeholder={t("home_office")} />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("phone_number")}</label>
                <input value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} required placeholder={t("phone_example")} />
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("street_address")}</label>
                <input value={formData.line1} onChange={(event) => setFormData({ ...formData, line1: event.target.value })} required placeholder={t("house_street_area")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("zone")}</label>
                  <select value={formData.zone} onChange={(event) => setFormData({ ...formData, zone: event.target.value })}>
                    {zones.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[1px] text-text-muted">{t("district")}</label>
                  <input value={formData.district} onChange={(event) => setFormData({ ...formData, district: event.target.value })} required placeholder={t("district_example")} />
                </div>
              </div>

              <label className="flex items-center gap-3 text-[14px] text-text-secondary">
                <input type="checkbox" checked={formData.isDefault} onChange={(event) => setFormData({ ...formData, isDefault: event.target.checked })} />
                {t("set_default_address_full")}
              </label>

              <button type="submit" className="btn-primary w-full">
                {editingAddress ? t("update_address") : t("save_address")}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <Footer />
    </main>
  );
}
