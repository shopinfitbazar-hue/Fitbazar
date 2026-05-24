export interface AiFitAdvisorProps {
  productImage: string;
  productColors: string[];
  productName: string;
  productCategory: string;
  onAddToCart: (productId: string) => void;
  brandName?: string;
  assistantName?: string;
  assistantAvatar?: string;
  accentColor?: string;
  lang?: "en" | "np";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ColorResult {
  skinTone: "Fair" | "Wheatish" | "Dusky" | "Deep";
  recommended: string[];
  neutral: string[];
  avoid: string[];
}

export interface SizeRecommendation {
  size: string;
  confidence: number;
}
