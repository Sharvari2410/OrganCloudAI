export function buildFilterClause(config, query) {
  const allowedColumns = [config.id, ...config.columns];
  const whereParts = [];
  const values = [];

  for (const [key, value] of Object.entries(query)) {
    if (!value || !allowedColumns.includes(key)) {
      continue;
    }
    whereParts.push(`\`${key}\` = ?`);
    values.push(value);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  return { whereClause, values };
}

export function sanitizePagination(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export function sanitizeSort(config, sortBy, sortOrder) {
  const allowedColumns = [config.id, ...config.columns];
  const cleanSortBy = allowedColumns.includes(sortBy) ? sortBy : config.id;
  const cleanSortOrder = (sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
  return { cleanSortBy, cleanSortOrder };
}
