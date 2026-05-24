"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type SupportMessage = {
  id: string;
  sender: "CUSTOMER" | "ADMIN";
  message: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  topic: string;
  orderNumber?: string | null;
  status: string;
  createdAt: string;
  messages: SupportMessage[];
};

export default function AccountSupportPage() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      try {
        const response = await fetch("/api/support", { cache: "no-store" });
        const data = (await response.json()) as { tickets?: SupportTicket[] };
        if (response.ok) {
          setTickets(data.tickets || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadTickets();
  }, []);

  const sendReply = async (ticketId: string) => {
    const message = drafts[ticketId]?.trim();
    if (!message) return;

    const response = await fetch(`/api/support/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      return;
    }

    const refresh = await fetch("/api/support", { cache: "no-store" });
    const data = (await refresh.json()) as { tickets?: SupportTicket[] };
    if (refresh.ok) {
      setTickets(data.tickets || []);
      setDrafts((current) => ({ ...current, [ticketId]: "" }));
    }
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
          <span className="font-medium text-text-primary">{t("help_support")}</span>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <MessageSquareText className="h-8 w-8 text-fb-pink" />
          <div>
            <h1 className="text-[28px] font-semibold text-text-primary">{t("support_history")}</h1>
            <p className="text-[14px] text-text-muted">{t("support_history_hint")}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[8px] bg-card p-6 text-[14px] text-text-muted">{t("loading_support_history")}</div>
        ) : tickets.length ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[8px] bg-card p-5 shadow-[var(--shadow-sm)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-[16px] font-semibold text-text-primary">{ticket.topic}</h2>
                    <p className="mt-1 text-[12px] text-text-muted">
                      {new Date(ticket.createdAt).toLocaleString("en-NP")}
                      {ticket.orderNumber ? ` • ${ticket.orderNumber}` : ""}
                    </p>
                  </div>
                  <span className="badge badge-pink">{ticket.status}</span>
                </div>

                <div className="mt-4 space-y-3">
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
                        {message.sender === "ADMIN" ? t("admin") : t("you")}
                      </div>
                      <p>{message.message}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <textarea
                    rows={3}
                    placeholder={t("write_follow_up")}
                    value={drafts[ticket.id] || ""}
                    onChange={(event) => setDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))}
                  />
                  <button type="button" onClick={() => void sendReply(ticket.id)} className="btn-primary mt-3">
                    {t("send_reply")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] bg-card p-8 text-center shadow-[var(--shadow-sm)]">
            <p className="text-[16px] font-semibold text-text-primary">{t("no_support_history")}</p>
            <p className="mt-2 text-[14px] text-text-muted">{t("support_history_empty_hint")}</p>
            <Link href="/help" className="btn-primary mt-4 inline-flex">
              {t("contact_support_team")}
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
