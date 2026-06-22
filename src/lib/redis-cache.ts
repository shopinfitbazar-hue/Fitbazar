type RedisRestResponse<T> = {
  result?: T;
  error?: string;
};

const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const CACHE_PREFIX = process.env.FITBAZAR_CACHE_PREFIX || "fitbazar";
const REDIS_TIMEOUT_MS = Number(process.env.FITBAZAR_REDIS_TIMEOUT_MS || 400);
const REDIS_DISABLED = process.env.FITBAZAR_REDIS_CACHE_DISABLED === "true";
const VERSION_MEMORY_TTL_MS = 5_000;
const LOCK_RETRY_DELAYS_MS = [40, 80, 160, 320, 640];

const inflight = new Map<string, Promise<unknown>>();
const versionMemory = new Map<string, { value: string; expiresAt: number }>();

export function isRedisConfigured() {
  return !REDIS_DISABLED && Boolean(REDIS_REST_URL && REDIS_REST_TOKEN);
}

function buildCacheKey(key: string) {
  return `${CACHE_PREFIX}:${key}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function redisCommand<T>(command: unknown[]): Promise<T | null> {
  if (!isRedisConfigured()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REDIS_TIMEOUT_MS);

  try {
    const response = await fetch(REDIS_REST_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as RedisRestResponse<T>;
    if (payload.error) return null;
    return payload.result ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getRedisJson<T>(key: string): Promise<T | null> {
  const value = await redisCommand<string>(["GET", buildCacheKey(key)]);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setRedisJson(key: string, value: unknown, ttlSeconds: number) {
  if (!ttlSeconds || ttlSeconds < 1) return;

  await redisCommand(["SET", buildCacheKey(key), JSON.stringify(value), "EX", Math.floor(ttlSeconds)]);
}

async function acquireRedisLock(key: string, ttlSeconds: number) {
  const result = await redisCommand<string>(["SET", buildCacheKey(`lock:${key}`), "1", "NX", "EX", Math.max(1, ttlSeconds)]);
  return result === "OK";
}

export async function getOrSetRedisJson<T>(input: {
  key: string;
  ttlSeconds: number;
  lockTtlSeconds?: number;
  compute: () => Promise<T>;
}) {
  const cached = await getRedisJson<T>(input.key);
  if (cached !== null) return cached;

  const active = inflight.get(input.key) as Promise<T> | undefined;
  if (active) return active;

  const promise = (async () => {
    const lockTtlSeconds = input.lockTtlSeconds ?? Math.min(10, Math.max(2, input.ttlSeconds));
    const lockAcquired = await acquireRedisLock(input.key, lockTtlSeconds);

    if (!lockAcquired && isRedisConfigured()) {
      for (const delay of LOCK_RETRY_DELAYS_MS) {
        await sleep(delay);
        const retried = await getRedisJson<T>(input.key);
        if (retried !== null) return retried;
      }
    }

    const value = await input.compute();
    void setRedisJson(input.key, value, input.ttlSeconds);
    return value;
  })();

  inflight.set(input.key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(input.key);
  }
}

export async function getRedisCacheVersion(namespace: string) {
  if (!isRedisConfigured()) return "0";

  const now = Date.now();
  const cached = versionMemory.get(namespace);
  if (cached && cached.expiresAt > now) return cached.value;

  const value = await redisCommand<string | number>(["GET", buildCacheKey(`version:${namespace}`)]);
  const version = value === null || value === undefined ? "0" : String(value);
  versionMemory.set(namespace, { value: version, expiresAt: now + VERSION_MEMORY_TTL_MS });
  return version;
}

export async function bumpRedisCacheVersion(namespace: string) {
  versionMemory.delete(namespace);
  await redisCommand<number>(["INCR", buildCacheKey(`version:${namespace}`)]);
}

export async function checkRedisCacheHealth() {
  if (!isRedisConfigured()) return { configured: false, ok: true };

  const result = await redisCommand<string>(["PING"]);
  return { configured: true, ok: result === "PONG" };
}
