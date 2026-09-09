// shared SQL builders for tables that page, sort, and search server-side when a
// parcel's row count exceeds the databridge row cap (results of 1000+ rows error) -
// see LiStore's permits and business licenses remote modes

export function buildSearchWhere(term, columns) {
  if (!term) {
    return '';
  }
  const safe = term.replace(/'/g, "''");
  return ` where (${columns.map((column) => `${column}::text ilike '%${safe}%'`).join(' or ')})`;
}

export function buildOrderBy(sort, columnMap, defaultColumn) {
  const column = sort && columnMap[sort.field] ? columnMap[sort.field] : defaultColumn;
  const direction = sort && sort.type === 'asc' ? 'asc' : 'desc';
  return `order by ${column} ${direction} nulls last`;
}

export function buildCountSql(baseSql, searchWhere) {
  return `select count(*) as n from (${baseSql}) base_sub${searchWhere}`;
}

export function buildPageSql(baseSql, searchWhere, orderBy, pageSize, pageIndex) {
  return `select * from (${baseSql}) base_sub${searchWhere} ${orderBy} limit ${pageSize} offset ${pageIndex * pageSize}`;
}
