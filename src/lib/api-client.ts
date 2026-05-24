import { logger } from "@/lib/logger";

interface RequestJsonOptions extends RequestInit {
  fallbackMessage?: string;
}

export async function requestJson<T>(input: RequestInfo | URL, init?: RequestJsonOptions): Promise<T> {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : init?.fallbackMessage) || "Request failed";

    logger.warn("API request failed", {
      input: typeof input === "string" ? input : input.toString(),
      status: response.status,
      message,
    });

    throw new Error(message);
  }

  return payload as T;
}
