// Contrato público estable. seed_key y nombres internos no salen al cliente.
module.exports = (row) => ({ id: row.id, title: row.title, done: row.done, userId: row.user_id });
