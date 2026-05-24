type PincodeLookup = {
  district: string;
  zone: "Kathmandu" | "Lalitpur" | "Bhaktapur" | "Other Nepal";
  etaDays: number;
  serviceable: boolean;
};

const explicitPincodes: Record<string, PincodeLookup> = {
  "44600": { district: "Kathmandu", zone: "Kathmandu", etaDays: 2, serviceable: true },
  "44601": { district: "Kathmandu", zone: "Kathmandu", etaDays: 2, serviceable: true },
  "44700": { district: "Lalitpur", zone: "Lalitpur", etaDays: 2, serviceable: true },
  "44800": { district: "Bhaktapur", zone: "Bhaktapur", etaDays: 2, serviceable: true },
  "32900": { district: "Kaski", zone: "Other Nepal", etaDays: 3, serviceable: true },
  "33700": { district: "Chitwan", zone: "Other Nepal", etaDays: 3, serviceable: true },
  "33701": { district: "Chitwan", zone: "Other Nepal", etaDays: 3, serviceable: true },
  "33711": { district: "Chitwan", zone: "Other Nepal", etaDays: 4, serviceable: true },
  "44610": { district: "Kathmandu", zone: "Kathmandu", etaDays: 2, serviceable: true },
  "44613": { district: "Kathmandu", zone: "Kathmandu", etaDays: 2, serviceable: true },
  "44614": { district: "Kathmandu", zone: "Kathmandu", etaDays: 2, serviceable: true },
  "56613": { district: "Morang", zone: "Other Nepal", etaDays: 4, serviceable: true },
};

const districtRanges: Array<{ prefix: string; district: string; zone: PincodeLookup["zone"]; etaDays: number }> = [
  { prefix: "446", district: "Kathmandu", zone: "Kathmandu", etaDays: 2 },
  { prefix: "447", district: "Lalitpur", zone: "Lalitpur", etaDays: 2 },
  { prefix: "448", district: "Bhaktapur", zone: "Bhaktapur", etaDays: 2 },
  { prefix: "337", district: "Chitwan", zone: "Other Nepal", etaDays: 3 },
  { prefix: "329", district: "Kaski", zone: "Other Nepal", etaDays: 3 },
  { prefix: "567", district: "Sunsari", zone: "Other Nepal", etaDays: 4 },
  { prefix: "566", district: "Morang", zone: "Other Nepal", etaDays: 4 },
  { prefix: "446", district: "Kathmandu", zone: "Kathmandu", etaDays: 2 },
  { prefix: "338", district: "Parsa", zone: "Other Nepal", etaDays: 4 },
  { prefix: "329", district: "Kaski", zone: "Other Nepal", etaDays: 3 },
  { prefix: "328", district: "Rupandehi", zone: "Other Nepal", etaDays: 4 },
  { prefix: "219", district: "Banke", zone: "Other Nepal", etaDays: 5 },
  { prefix: "109", district: "Kailali", zone: "Other Nepal", etaDays: 5 },
];

export function isValidNepalPincode(value: string) {
  return /^\d{5}$/.test(value.trim());
}

export function resolvePincode(value: string): PincodeLookup | null {
  const normalized = value.trim();
  if (!isValidNepalPincode(normalized)) return null;

  if (explicitPincodes[normalized]) {
    return explicitPincodes[normalized];
  }

  const matchedRange = districtRanges.find((entry) => normalized.startsWith(entry.prefix));
  if (matchedRange) {
    return {
      district: matchedRange.district,
      zone: matchedRange.zone,
      etaDays: matchedRange.etaDays,
      serviceable: true,
    };
  }

  return {
    district: "Other Nepal",
    zone: "Other Nepal",
    etaDays: 5,
    serviceable: true,
  };
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
      message: "Delivery is not available for this pincode yet.",
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
