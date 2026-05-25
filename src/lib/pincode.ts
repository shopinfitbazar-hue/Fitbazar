type PincodeLookup = {
  district: string;
  zone: "Kathmandu" | "Lalitpur" | "Bhaktapur" | "Other Nepal";
  etaDays: number;
  serviceable: boolean;
};

const KATHMANDU_POSTAL_PREFIX = "446";

export function isValidNepalPincode(value: string) {
  return /^\d{5}$/.test(value.trim());
}

export function resolvePincode(value: string): PincodeLookup | null {
  const normalized = value.trim();
  if (!isValidNepalPincode(normalized)) return null;

  if (normalized.startsWith(KATHMANDU_POSTAL_PREFIX)) {
    return {
      district: "Kathmandu",
      zone: "Kathmandu",
      etaDays: 2,
      serviceable: true,
    };
  }

  return {
    district: "Other Nepal",
    zone: "Other Nepal",
    etaDays: 5,
    serviceable: false,
  };
}

export function isServiceableDeliveryPincode(value: string) {
  return resolvePincode(value)?.serviceable === true;
}

export function getDeliveryMessage(value: string, now = new Date()) {
  const resolved = resolvePincode(value);
  if (!resolved) {
    return {
      ok: false,
      message: "Enter a valid 5-digit Nepal pincode to check delivery.",
    };
  }

  if (!resolved.serviceable) {
    return {
      ok: false,
      district: resolved.district,
      zone: resolved.zone,
      etaDays: resolved.etaDays,
      message: "Delivery is available inside Kathmandu only right now.",
    };
  }

  const deliveryDate = new Date(now.getTime() + resolved.etaDays * 24 * 60 * 60 * 1000);
  return {
    ok: true,
    district: resolved.district,
    zone: resolved.zone,
    etaDays: resolved.etaDays,
    message: `Delivery to ${resolved.district} by ${deliveryDate.toLocaleDateString("en-NP", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })}.`,
  };
}
