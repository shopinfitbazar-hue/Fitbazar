import { logger } from "@/lib/logger";

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, context?: Record<string, unknown>) => void;
      captureMessage?: (message: string, context?: Record<string, unknown>) => void;
    };
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  logger.error("Captured exception", error, context);

  if (typeof window !== "undefined" && window.Sentry?.captureException) {
    window.Sentry.captureException(error, context);
  }
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  logger.info(message, context);

  if (typeof window !== "undefined" && window.Sentry?.captureMessage) {
    window.Sentry.captureMessage(message, context);
  }
}
