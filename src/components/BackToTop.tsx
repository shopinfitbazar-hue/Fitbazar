"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-fb-pink shadow-lg transition-all hover:bg-opacity-90"
      aria-label="Back to top"
    >
      <ChevronUp className="w-6 h-6 text-white" />
    </button>
  );
}
