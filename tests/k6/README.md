# FitBazar k6 Load Suite

This suite is for staging or approved production-window testing only. It does not prove 100k readiness by itself; it provides the repeatable profiles needed to gather evidence from distributed infrastructure.

## Profiles

- `smoke`: 5 VUs, local-safe sanity check.
- `1000`, `5000`, `10000`, `25000`, `50000`, `100000`: staged concurrent-user profiles.
- `50000` and `100000` require distributed runners or k6 Cloud. A single laptop is not a valid proof for these stages.

## Required Environment

```bash
TARGET_URL=https://staging.fit-bazar.com
K6_PROFILE=smoke
k6 run tests/k6/fitbazar-100k.js
```

Non-smoke profiles require:

```bash
CONFIRM_DISTRIBUTED_LOAD_TEST=YES
```

The `50000` and `100000` profiles also require:

```bash
K6_DISTRIBUTED_RUN=YES
```

## Optional Test Inputs

- `K6_PRODUCT_SLUGS`: comma-separated known product slugs for product-detail reads.
- `K6_VENDOR_SLUGS`: comma-separated known vendor slugs for vendor-detail reads.
- `K6_SEARCH_TERMS`: comma-separated search terms.
- `TEST_CUSTOMER_EMAIL` and `TEST_CUSTOMER_PASSWORD`: staging-only test customer for authenticated reads.
- `ENABLE_ORDER_CREATION=YES` and `TEST_PRODUCT_ID`: enable staging COD order creation. Use only with seeded throwaway inventory.
- `K6_THINK_SECONDS`: default `1`.

Do not paste real customer credentials into shell history. Use your CI or load-testing platform secret store.

## Success Gates

- `http_req_failed < 1%`
- `p95 < 800ms`
- `p99 < 1500ms`
- `checks > 99%`

Raise or lower gates only with a written reason in the load-test report.
