export const ADMIN_DEFAULT_PAGE_SIZE = 10;
export const ADMIN_MAX_PAGE_SIZE = 100;

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.trunc(parsed));
}

export function getAdminPagination(searchParams: URLSearchParams) {
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInt(searchParams.get("pageSize"), ADMIN_DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(requestedPageSize, ADMIN_MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function getAdminSearch(searchParams: URLSearchParams) {
  return (searchParams.get("q") || "").trim().slice(0, 120);
}

export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
