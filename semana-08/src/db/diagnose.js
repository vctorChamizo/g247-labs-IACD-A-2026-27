function diagnose(error) {
  if (error.code === "CONFIG") return `[CONFIG] ${error.message}`;
  const hints = {
    ECONNREFUSED: "Servidor parado o puerto incorrecto.",
    ENOTFOUND: "Revisar el host de DATABASE_URL.",
    "28P01": "Usuario o contraseña incorrectos en DATABASE_URL.",
    "3D000": "Base inexistente: ejecutar npm run db:create.",
    "42P01": "Faltan tablas: ejecutar npm run db:migrate.",
    "42703": "Esquema incompatible o migraciones pendientes. Usar una DB nueva de semana 8.",
    "42501": "Permisos insuficientes; db:create necesita CREATEDB.",
  };
  const code = error.code || error.errors?.[0]?.code;
  // No imprimir error.message de pg: puede incluir consultas o datos sensibles.
  return `[${code || "CONEXIÓN"}] ${hints[code] || "Revisar configuración y estado de PostgreSQL."}`;
}
module.exports = diagnose;
