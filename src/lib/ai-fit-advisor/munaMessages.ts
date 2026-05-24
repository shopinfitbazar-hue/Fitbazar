export const munaMessages = {
  en: {
    greeting: "Namaste! How can I help you today?",
    homepage: "Namaste! Looking for festival outfits? Dashain collection is here!",
    products: "Need help finding the right fit? Tell me your size!",
    productDetailStock: (stock: number) => stock < 10 
      ? `Only ${stock} left in stock - grab it before it's gone!`
      : "This is one of our bestsellers this season",
    cartAmount: (amount: number, freeDelivery: number) => amount < freeDelivery
      ? `Add NPR ${freeDelivery - amount} more for free delivery!`
      : "You qualify for free delivery!",
    checkout: "Almost there! Your order is safe with us",
    searchEmpty: "Try searching 'kurta', 'saree', or 'jacket'",
    orders: "Your orders are looking good! Need help tracking one?",
    thinking: "Let me see what suits you...",
    result: "You look amazing! Here's my honest take",
    sizeGuide: "Check our size guide to find your perfect fit",
    delivery: "We deliver across Nepal! Standard delivery takes 3-5 days.",
    returns: "We offer 7-day returns on all items. Easy and hassle-free!",
    payment: "We accept eSewa, Khalti, connectIPS, Fonepay, and Cash on Delivery.",
    festival: "Check out our Festival Sale collection!",
    discount: "Great finds! Browse our sale section for amazing deals!",
    default: "I'm not sure about that! Let me help you find great outfits instead",
  },
  np: {
    greeting: "Namaste! Aaj ma tapai lai kaise madad garna sakchhu?",
    homepage: "Namaste! Chadparva ko lagi luga khojda hunuhunchha?",
    products: "Tapai ko sahi size bhannuhos! Ma tapai lai sahi look dena madad gardinchhu!",
    productDetailStock: (stock: number) => stock < 10 
      ? `Matra ${stock} wata baki cha - chhito kinuhos!`
      : "Yo hamro sabai bhanda lokpriya upadaan ho",
    cartAmount: (amount: number, freeDelivery: number) => amount < freeDelivery
      ? `Arko NPR ${freeDelivery - amount} thap nirdes bhitra free delivery!`
      : "Tapai free delivery ko lagi yogya hunuhunchha!",
    checkout: "Lagbhitra taiyar! Tapai ko order surakshita cha",
    searchEmpty: "'kurtA', 'sAre', or 'jAcket' khojnuhos",
    orders: "Tapai ko order haru ramro dekhidainan! Kuni madad chahine?",
    thinking: "Tapai lai ke milchha herda chha...",
    result: "Tapai adhisar dekha hunuhunchha! Yaha mero honest raicha",
    sizeGuide: "Hamro size guide herunu",
    delivery: "Hami Nepal bhittar delivery garchhau! Sadharan delivery 3-5 din lagcha.",
    returns: "Hami sabai upadaan ma 7 dine paherna dinchhau!",
    payment: "Hami eSewa, Khalti, connectIPS, Fonepay ra COD maninchhau.",
    festival: "Hamro Chadparva Sale collection herunu!",
    discount: "Ramro offers! Sale section herunu!",
    default: "Malai thaha chaina! Ma tapai lai ramro lookaila pathauma madad garchhu",
  },
};

export function getContextualMessage(pathname: string, lang: "en" | "np"): string {
  if (pathname === "/") return munaMessages[lang].homepage;
  if (pathname.startsWith("/products")) return munaMessages[lang].products;
  if (pathname.startsWith("/cart")) return munaMessages[lang].cartAmount(0, 2000);
  if (pathname.startsWith("/checkout")) return munaMessages[lang].checkout;
  if (pathname.startsWith("/search")) return munaMessages[lang].searchEmpty;
  if (pathname.startsWith("/account/orders")) return munaMessages[lang].orders;
  return munaMessages[lang].greeting;
}

export function getKeywordResponse(userInput: string, lang: "en" | "np"): string | null {
  const input = userInput.toLowerCase();
  
  if (input.includes("size") || input.includes("sizing")) {
    return munaMessages[lang].sizeGuide;
  }
  if (input.includes("delivery") || input.includes("shipping")) {
    return munaMessages[lang].delivery;
  }
  if (input.includes("return") || input.includes("refund")) {
    return munaMessages[lang].returns;
  }
  if (input.includes("payment") || input.includes("esewa") || input.includes("khalti")) {
    return munaMessages[lang].payment;
  }
  if (input.includes("festival") || input.includes("dashain")) {
    return munaMessages[lang].festival;
  }
  if (input.includes("discount") || input.includes("offer") || input.includes("sale")) {
    return munaMessages[lang].discount;
  }
  
  return null;
}
