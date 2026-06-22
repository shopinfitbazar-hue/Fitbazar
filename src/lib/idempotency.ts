import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class IdempotencyError extends Error {
  status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "IdempotencyError";
    this.status = status;
  }
}

type IdempotentResult<T> = {
  payload: T;
  status: number;
  replayed: boolean;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

export function hashIdempotentRequest(value: unknown) {
  return crypto.createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function readIdempotencyKey(request: Request, body?: { idempotencyKey?: unknown }) {
  const raw = request.headers.get("Idempotency-Key") || request.headers.get("x-idempotency-key") || body?.idempotencyKey;
  if (typeof raw !== "string") return null;

  const key = raw.trim();
  if (!key) return null;
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new IdempotencyError("Invalid idempotency key format.", 400);
  }

  return key;
}

export async function clearExpiredIdempotencyKeys() {
  await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function runIdempotent<T>(input: {
  userId: string;
  scope: string;
  key: string | null;
  requestPayload: unknown;
  ttlMs?: number;
  handler: () => Promise<{ payload: T; status?: number }>;
}): Promise<IdempotentResult<T>> {
  if (!input.key) {
    const result = await input.handler();
    return {
      payload: result.payload,
      status: result.status ?? 200,
      replayed: false,
    };
  }

  const requestHash = hashIdempotentRequest(input.requestPayload);
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS));
  let didReserveKey = false;

  await clearExpiredIdempotencyKeys().catch(() => undefined);

  let record = await prisma.idempotencyKey.findUnique({
    where: {
      userId_scope_key: {
        userId: input.userId,
        scope: input.scope,
        key: input.key,
      },
    },
  });

  if (!record) {
    try {
      record = await prisma.idempotencyKey.create({
        data: {
          userId: input.userId,
          scope: input.scope,
          key: input.key,
          requestHash,
          expiresAt,
        },
      });
      didReserveKey = true;
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }

      record = await prisma.idempotencyKey.findUnique({
        where: {
          userId_scope_key: {
            userId: input.userId,
            scope: input.scope,
            key: input.key,
          },
        },
      });
    }
  }

  if (!record) {
    throw new IdempotencyError("Unable to reserve idempotency key.");
  }

  if (record.requestHash !== requestHash) {
    throw new IdempotencyError("Idempotency key was already used with a different request.", 409);
  }

  if (record.status === "SUCCEEDED" && record.response && record.statusCode) {
    return {
      payload: record.response as T,
      status: record.statusCode,
      replayed: true,
    };
  }

  if (!didReserveKey && record.status === "PROCESSING" && record.createdAt.getTime() < Date.now() - 30_000) {
    await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: {
        status: "EXPIRED",
      },
    });
  } else if (!didReserveKey && record.status === "PROCESSING") {
    throw new IdempotencyError("This request is already being processed. Please wait a moment.", 409);
  } else if (record.status === "FAILED") {
    throw new IdempotencyError("This idempotency key belongs to a failed request. Please create a new key.", 409);
  }

  try {
    const result = await input.handler();
    const status = result.status ?? 200;

    await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: {
        status: "SUCCEEDED",
        statusCode: status,
        response: JSON.parse(JSON.stringify(result.payload)) as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return {
      payload: result.payload,
      status,
      replayed: false,
    };
  } catch (error) {
    await prisma.idempotencyKey.update({
      where: { id: record.id },
      data: {
        status: "FAILED",
      },
    }).catch(() => undefined);

    throw error;
  }
}
