function pagination(query) {
  // 1. La query llega como texto. Number convierte todo el valor, no solo el inicio.
  let page = typeof query.page === "string" ? Number(query.page) : 1;
  let limit = typeof query.limit === "string" ? Number(query.limit) : 20;

  // 2. Una página debe ser entera. Si el dato no sirve, usamos el valor por defecto.
  if (!Number.isSafeInteger(page)) page = 1;
  if (!Number.isSafeInteger(limit)) limit = 20;

  // 3. Acotar valores y calcular cuántas filas se saltará el SQL.
  page = Math.min(100000, Math.max(1, page));
  limit = Math.min(100, Math.max(1, limit));
  return { page, limit, offset: (page - 1) * limit };
}
module.exports = pagination;
