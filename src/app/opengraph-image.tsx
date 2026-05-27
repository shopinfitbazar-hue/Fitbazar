import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FitBazar online fashion shopping in Nepal";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f7efe8",
          color: "#241f21",
          display: "flex",
          height: "100%",
          width: "100%",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "2px solid rgba(36, 31, 33, 0.12)",
            borderRadius: 36,
            padding: 56,
            background: "#fffaf6",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#ff3f6c", fontSize: 42, fontWeight: 800, letterSpacing: -2 }}>
              FitBazar
            </div>
            <div style={{ color: "#6b5f64", fontSize: 24 }}>Nepal Fashion Marketplace</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ maxWidth: 880, fontSize: 72, fontWeight: 800, lineHeight: 1.04, letterSpacing: -4 }}>
              Online Fashion Shopping in Nepal
            </div>
            <div style={{ maxWidth: 760, color: "#5d5155", fontSize: 30, lineHeight: 1.35 }}>
              Clothing, ethnic wear, sportswear, footwear, and accessories from trusted stores.
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, color: "#241f21", fontSize: 24, fontWeight: 700 }}>
            <span>Men</span>
            <span>Women</span>
            <span>Kids</span>
            <span>Ethnic Wear</span>
            <span>Sale</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
