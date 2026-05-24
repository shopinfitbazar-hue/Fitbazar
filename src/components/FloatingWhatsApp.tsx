"use client";

import { useState } from "react";
import { Mic, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "muna" | "user";
  text: string;
};

const openingMessages = [
  "Hi, I'm Muna. Tell me your vibe and I'll help you style it.",
  "You can ask for outfit ideas, color pairings, or what works for Dashain and wedding season.",
];

export default function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [clickedOnce, setClickedOnce] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    openingMessages.map((text, index) => ({
      id: `muna-${index}`,
      role: "muna" as const,
      text,
    })),
  );

  const openChat = () => {
    setOpen(true);
    setClickedOnce(true);
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: userText },
      {
        id: `reply-${Date.now()}`,
        role: "muna",
        text: "Try a clean base, one hero color, and keep the accessories light. I can help you narrow it down by occasion too.",
      },
    ]);
    setInput("");
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-[148px] right-5 z-[1100] w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[12px] border border-border-light bg-card shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
          <div className="flex items-start justify-between bg-fb-pink px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[14px] font-bold text-fb-pink">
                M
              </div>
              <div>
                <div className="text-[14px] font-bold text-white">Muna</div>
                <div className="text-[11px] text-white/80">Your Style Guide</div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Muna">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="flex max-h-[280px] flex-col gap-3 overflow-y-auto bg-page p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-[13px] ${
                    message.role === "user"
                      ? "rounded-[12px_4px_12px_12px] bg-fb-pink text-white"
                      : "rounded-[4px_12px_12px_12px] border border-border-light bg-card text-text-primary"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border-light bg-card px-3 py-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask Muna anything..."
              className="border-none bg-transparent px-0 py-0 text-[13px] shadow-none focus:border-none"
            />
            <button type="button" className="text-text-muted" aria-label="Voice input">
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={sendMessage}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-fb-pink text-white"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={open ? () => setOpen(false) : openChat}
        className={`fixed bottom-20 right-5 z-[1090] flex h-14 w-14 items-center justify-center rounded-full bg-fb-pink text-[24px] font-bold text-white shadow-[var(--shadow-md)] ${clickedOnce ? "" : "muna-pulse"} lg:bottom-5`}
        aria-label="Open Muna chat"
      >
        <span className="absolute -top-3 rounded-[20px] bg-fb-pink-light px-2 py-0.5 text-[10px] font-medium text-white">
          Style Help
        </span>
        M
      </button>
    </>
  );
}
