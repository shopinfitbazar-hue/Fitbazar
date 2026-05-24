export type SkinTone = "Fair" | "Wheatish" | "Dusky" | "Deep";

interface ColorRecommendation {
  recommended: string[];
  neutral: string[];
  avoid: string[];
}

const skinTonePalettes: Record<SkinTone, { ideal: string[]; neutral: string[]; avoid: string[] }> = {
  Fair: {
    ideal: ["#E6E6FA", "#000080", "#800020", "#006400", "#FFE4E1", "#FFF8DC"],
    neutral: ["#FFFFFF", "#F5F5F5", "#D3D3D3", "#A9A9A9"],
    avoid: ["#FF4500", "#FFD700", "#FF69B4"],
  },
  Wheatish: {
    ideal: ["#FF6B35", "#FF7F50", "#008080", "#FFD700", "#FFFFFF", "#FAFAD2"],
    neutral: ["#FFFACD", "#F5DEB3", "#D2B48C", "#8B4513"],
    avoid: ["#4B0082", "#191970", "#2F4F4F"],
  },
  Dusky: {
    ideal: ["#FF0000", "#FF00FF", "#FFD700", "#00FF00", "#FFFFFF", "#4169E1"],
    neutral: ["#F0E68C", "#DDA0DD", "#BA55D3", "#9370DB"],
    avoid: ["#FFB6C1", "#FFE4E1", "#FFF0F5"],
  },
  Deep: {
    ideal: ["#FFFFFF", "#000080", "#FF0000", "#FFD700", "#00FF00", "#4B0082"],
    neutral: ["#F5F5DC", "#D2691E", "#8B4513", "#A0522D"],
    avoid: ["#FFB6C1", "#FFC0CB", "#FFE4E1"],
  },
};

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function colorDistance(hex1: string, hex2: string): number {
  const hsl1 = hexToHsl(hex1);
  const hsl2 = hexToHsl(hex2);
  if (!hsl1 || !hsl2) return 999;
  
  const dh = Math.abs(hsl1.h - hsl2.h) / 360;
  const ds = Math.abs(hsl1.s - hsl2.s) / 100;
  const dl = Math.abs(hsl1.l - hsl2.l) / 100;
  
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
}

export function getColorRecommendations(
  skinTone: SkinTone,
  availableColors: string[]
): ColorRecommendation {
  const palette = skinTonePalettes[skinTone];
  
  const ranked = availableColors.map(color => {
    let minDist = 999;
    for (const ideal of palette.ideal) {
      const dist = colorDistance(color, ideal);
      if (dist < minDist) minDist = dist;
    }
    return { color, distance: minDist };
  }).sort((a, b) => a.distance - b.distance);

  const recommended: string[] = [];
  const neutral: string[] = [];
  const avoid: string[] = [];

  for (const item of ranked) {
    if (recommended.length < 3 && item.distance < 0.3) {
      recommended.push(item.color);
    } else if (neutral.length < 2 && item.distance < 0.5) {
      neutral.push(item.color);
    } else {
      avoid.push(item.color);
    }
  }

  return { recommended, neutral, avoid: [...avoid, ...palette.avoid] };
}

export function analyzeSkinTone(imageData: ImageData): SkinTone {
  let r = 0, b = 0, count = 0;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    r += imageData.data[i];
    b += imageData.data[i + 2];
    count++;
  }
  
  const avgR = Math.floor(r / count);
  const avgB = Math.floor(b / count);
  
  if (avgR > 200 && avgB > 170) return "Fair";
  if (avgR > 180 && avgB < 150) return "Wheatish";
  if (avgR > 150 && avgB < 120) return "Dusky";
  return "Deep";
}
