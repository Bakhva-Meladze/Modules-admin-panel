/**
 * Parse `page` and `limit` from Express query. 1-based page index.
 */
export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(
    1,
    Number.parseInt(String(query.page != null ? query.page : "1"), 10) || 1
  );
  let limit = Number.parseInt(String(query.limit != null ? query.limit : ""), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  limit = Math.min(Math.max(1, Math.floor(limit)), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginationMeta(total, page, limit) {
  const n = Number(total) || 0;
  const totalPages = n === 0 ? 1 : Math.ceil(n / limit);
  return {
    total: n,
    page,
    limit,
    totalPages,
  };
}
