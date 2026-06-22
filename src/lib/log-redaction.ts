const SENSITIVE_KEY_PATTERN = /(authorization|cookie|database_url|direct_url|password|secret|session|token|api[_-]?key|private[_-]?key)/i;

function redactString(value: string) {
  return value
    .replace(/(postgres(?:ql)?:\/\/[^:\s/@]+):([^@\s]+)@/gi, "$1:***@")
    .replace(/\b(Bearer|Key)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 ***")
    .replace(/([?&](?:token|secret|password|api_key|key|pidx)=)[^&\s]+/gi, "$1***")
    .replace(/\b((?:token|secret|password|authorization|database_url|direct_url|api[_-]?key)\s*[:=]\s*)["']?[^"',&\s}]+/gi, "$1***");
}

export function redactSensitiveValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack: value.stack ? redactString(value.stack) : undefined,
    };
  }

  if (depth > 4) return "[Redacted nested value]";

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactSensitiveValue(entryValue, depth + 1),
      ]),
    );
  }

  return value;
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return redactString(error.message);
  return redactString(String(error));
}
