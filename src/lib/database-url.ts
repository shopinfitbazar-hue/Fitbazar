const PLACEHOLDER_DATABASE_URL =
  "postgresql://placeholder:placeholder@localhost:5432/fitbazar?schema=public";

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function normalizeDatabaseUrl(value: string | undefined | null) {
  if (!value) return null;

  const normalized = stripWrappingQuotes(value.trim());
  return normalized || null;
}

export function resolveDatabaseUrl(options?: {
  databaseUrl?: string | null;
  directUrl?: string | null;
  allowPlaceholder?: boolean;
}) {
  const normalizedDatabaseUrl = normalizeDatabaseUrl(options?.databaseUrl);
  const normalizedDirectUrl = normalizeDatabaseUrl(options?.directUrl);

  if (normalizedDatabaseUrl) {
    return normalizedDatabaseUrl;
  }

  if (normalizedDirectUrl) {
    return normalizedDirectUrl;
  }

  if (options?.allowPlaceholder) {
    return PLACEHOLDER_DATABASE_URL;
  }

  throw new Error(
    "Missing valid database connection string. Set DATABASE_URL or DIRECT_URL in the environment.",
  );
}

export function maskDatabaseUrl(value: string | undefined | null) {
  const normalized = normalizeDatabaseUrl(value);
  if (!normalized) return "missing";

  return normalized
    .replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@")
    .replace(/\?.+$/, "");
}
