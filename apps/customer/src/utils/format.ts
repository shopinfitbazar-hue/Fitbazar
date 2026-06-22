import { formatPriceNpr } from "@fitbazar/shared-utils";

export function money(value: number | null | undefined) {
  return formatPriceNpr(Number(value ?? 0));
}

export function shortDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-NP", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
