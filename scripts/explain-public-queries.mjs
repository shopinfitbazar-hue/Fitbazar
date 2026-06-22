#!/usr/bin/env node

import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: process.env.ENV_FILE || ".env.local" });
dotenv.config();

const { Client } = pg;
const confirm = process.env.CONFIRM_EXPLAIN_ANALYZE === "YES";
const urlKey = process.env.EXPLAIN_DATABASE_URL_KEY || "DATABASE_URL";
const connectionString = process.env[urlKey] || process.env.DATABASE_URL;

function maskDatabaseUrl(value) {
  if (!value) return "missing";
  return value.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@").replace(/\?.+$/, "");
}

if (!confirm) {
  console.log("EXPLAIN ANALYZE is intentionally disabled by default.");
  console.log("Run only against staging or a controlled production window:");
  console.log("  CONFIRM_EXPLAIN_ANALYZE=YES npm run db:explain:public");
  console.log("Optional:");
  console.log("  EXPLAIN_DATABASE_URL_KEY=DATABASE_URL  # default, pooled runtime path");
  console.log("  ENV_FILE=.env.local");
  process.exit(0);
}

if (!connectionString) {
  throw new Error(`Missing ${urlKey}. Set EXPLAIN_DATABASE_URL_KEY or DATABASE_URL.`);
}

const queries = [
  {
    name: "public products newest",
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT p."id", p."slug", p."name", p."price", p."category", p."createdAt"
      FROM "Product" p
      WHERE p."status" = 'ACTIVE'
        AND p."isActive" = true
        AND EXISTS (
          SELECT 1 FROM "Vendor" v
          WHERE v."id" = p."vendorId"
            AND v."isApproved" = true
            AND v."isSuspended" = false
        )
      ORDER BY p."createdAt" DESC
      LIMIT 24
    `,
    params: [],
  },
  {
    name: "public products category popular",
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT p."id", p."slug", p."name", p."totalSold"
      FROM "Product" p
      WHERE p."status" = 'ACTIVE'
        AND p."isActive" = true
        AND p."category" = $1
        AND EXISTS (
          SELECT 1 FROM "Vendor" v
          WHERE v."id" = p."vendorId"
            AND v."isApproved" = true
            AND v."isSuspended" = false
        )
      ORDER BY p."totalSold" DESC
      LIMIT 24
    `,
    params: [process.env.EXPLAIN_SAMPLE_CATEGORY || "Men"],
  },
  {
    name: "public search contains",
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT p."id", p."slug", p."name", p."category"
      FROM "Product" p
      WHERE p."status" = 'ACTIVE'
        AND p."isActive" = true
        AND (
          p."name" ILIKE '%' || $1 || '%'
          OR p."description" ILIKE '%' || $1 || '%'
          OR p."category" ILIKE '%' || $1 || '%'
          OR p."tags" && ARRAY[lower($1)]::text[]
        )
        AND EXISTS (
          SELECT 1 FROM "Vendor" v
          WHERE v."id" = p."vendorId"
            AND v."isApproved" = true
            AND v."isSuspended" = false
        )
      ORDER BY p."createdAt" DESC
      LIMIT 24
    `,
    params: [process.env.EXPLAIN_SAMPLE_SEARCH || "shirt"],
  },
  {
    name: "partner vendors public list",
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT v."id", v."slug", v."shopName", v."category"
      FROM "Vendor" v
      WHERE v."isApproved" = true
        AND v."isSuspended" = false
        AND v."isPartnered" = true
      ORDER BY (
        SELECT COUNT(*)
        FROM "Product" p
        WHERE p."vendorId" = v."id"
      ) DESC
      LIMIT 24
    `,
    params: [],
  },
  {
    name: "partner vendor search",
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT v."id", v."slug", v."shopName", v."category"
      FROM "Vendor" v
      WHERE v."isApproved" = true
        AND v."isSuspended" = false
        AND v."isPartnered" = true
        AND (
          v."shopName" ILIKE '%' || $1 || '%'
          OR v."category" ILIKE '%' || $1 || '%'
        )
      LIMIT 10
    `,
    params: [process.env.EXPLAIN_SAMPLE_SEARCH || "shirt"],
  },
];

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log(`Connected with ${urlKey}: ${maskDatabaseUrl(connectionString)}`);

  const extension = await client.query("SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS installed");
  console.log(`pg_trgm installed: ${extension.rows[0]?.installed ? "yes" : "no"}`);

  const indexes = await client.query(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'Product_public_name_trgm_idx',
        'Product_public_description_trgm_idx',
        'Product_public_category_trgm_idx',
        'Product_public_tags_gin_idx',
        'Product_public_sizes_gin_idx',
        'Product_public_colors_gin_idx',
        'Vendor_public_shop_name_trgm_idx',
        'Vendor_public_category_trgm_idx'
      )
    ORDER BY indexname
  `);
  console.log(`Verified scale indexes: ${indexes.rows.map((row) => row.indexname).join(", ") || "none"}`);

  for (const query of queries) {
    console.log(`\n--- ${query.name} ---`);
    const result = await client.query(query.sql, query.params);
    console.log(result.rows.map((row) => row["QUERY PLAN"]).join("\n"));
  }
} finally {
  await client.end().catch(() => undefined);
}
