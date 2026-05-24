"use client";

import { useEffect, useState } from "react";
import { X, Ruler, Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface SizeGuideProps {
  type?: "clothing" | "footwear";
}

const sizeCharts = {
  clothing: {
    titleKey: "size_guide_clothing",
    measurements: ["chest_measure", "waist_measure", "hip_measure", "length_measure"],
    sizes: {
      "Nepali/Indian": {
        S: ["36", "30", "38", "26"],
        M: ["38", "32", "40", "27"],
        L: ["40", "34", "42", "28"],
        XL: ["42", "36", "44", "29"],
        XXL: ["44", "38", "46", "30"],
      },
      International: {
        S: ["36", "30", "38", "26"],
        M: ["38", "32", "40", "27"],
        L: ["40", "34", "42", "28"],
        XL: ["42", "36", "44", "29"],
        XXL: ["44", "38", "46", "30"],
      },
    },
  },
  footwear: {
    titleKey: "size_guide_footwear",
    measurements: ["foot_length_cm"],
    sizes: {
      UK: {
        "6": ["24.5"],
        "7": ["25.5"],
        "8": ["26.5"],
        "9": ["27.5"],
        "10": ["28.5"],
        "11": ["29.5"],
      },
      EU: {
        "40": ["24.5"],
        "41": ["25.5"],
        "42": ["26.5"],
        "43": ["27.5"],
        "44": ["28.5"],
        "45": ["29.5"],
      },
      US: {
        "7": ["24.5"],
        "8": ["25.5"],
        "9": ["26.5"],
        "10": ["27.5"],
        "11": ["28.5"],
        "12": ["29.5"],
      },
    },
  },
};

export default function SizeGuide({ type = "clothing" }: SizeGuideProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof sizeCharts.clothing.sizes | keyof typeof sizeCharts.footwear.sizes>("Nepali/Indian");

  const chart = sizeCharts[type];

  useEffect(() => {
    setSelectedRegion(type === "clothing" ? "Nepali/Indian" : "UK");
  }, [type]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-fb-pink hover:underline"
      >
        <Ruler className="w-4 h-4" />
        {t("size_chart")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card">
            <div className="flex items-center justify-between border-b border-border-light p-6">
              <h2 className="font-heading font-bold text-2xl">{t(chart.titleKey)}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 transition-colors hover:bg-[var(--bg-hover)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6">
                {Object.keys(chart.sizes).map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region as keyof typeof chart.sizes)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      selectedRegion === region
                        ? "bg-fb-pink text-white"
                        : "bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-light">
                      <th className="text-left py-3 px-4 font-bold">{t("size")}</th>
                      {chart.measurements.map((m) => (
                        <th key={m} className="text-left py-3 px-4 font-bold">
                          {t(m)}{type === "clothing" ? " (inches)" : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(chart.sizes[selectedRegion as keyof typeof chart.sizes]).map(([size, values]) => (
                      <tr key={size} className="border-b border-border-light">
                        <td className="py-3 px-4 font-bold text-fb-pink">{size}</td>
                        {(values as string[]).map((val: string, idx: number) => (
                          <td key={idx} className="py-3 px-4">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 rounded-xl bg-[var(--bg-surface)] p-4">
                <h4 className="mb-3 font-bold">{t("how_to_measure")}</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-fb-orange" />
                    <span><strong>{t("chest_measure")}:</strong> {t("chest_measure_hint")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-fb-orange" />
                    <span><strong>{t("waist_measure")}:</strong> {t("waist_measure_hint")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-fb-orange" />
                    <span><strong>{t("hip_measure")}:</strong> {t("hip_measure_hint")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-fb-orange" />
                    <span><strong>{t("length_measure")}:</strong> {t("length_measure_hint")}</span>
                  </li>
                </ul>
              </div>

              <p className="mt-6 text-center text-sm text-text-muted">
                {t("size_help_hint")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
