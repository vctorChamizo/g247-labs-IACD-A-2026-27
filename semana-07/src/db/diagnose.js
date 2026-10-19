// El código PostgreSQL permite distinguir un fallo de infraestructura de una
// restricción del modelo. No imprimimos la contraseña ni la cadena de conexión.
function diagnose(error) {
  // Solo estos errores los construye nuestra validación, sin datos secretos.
  if (error.code === "CONFIG") return `[CONFIG] ${error.message}`;
  const hints = {
    ECONNREFUSED: "Servidor parado o host/puerto incorrectos. Arrancar PostgreSQL y revisar PGHOST/PGPORT.",
    ENOTFOUND: "El host no existe. Revisar PGHOST.",
    "28P01": "Contraseña incorrecta. Revisar PGUSER/PGPASSWORD.",
    "28000": "Usuario no autorizado. Revisar PGUSER y la configuración de acceso.",
    "3D000": "La base de datos no existe. Ejecutar npm run db:create.",
    "42P01": "Falta una tabla. Ejecutar npm run db:migrate sobre esta base.",
    "42703": "Falta una columna. Revisar las migraciones pendientes.",
    "23503": "Clave foránea inválida: el usuario de la tarea no existe.",
    "23505": "Valor duplicado en una columna UNIQUE.",
    "23514": "Un valor no cumple la restricción CHECK del modelo.",
    "42501": "Permisos insuficientes. Para crear una base se necesita CREATEDB o un administrador local.",
    "57P01": "El servidor PostgreSQL se está deteniendo. Volver a levantarlo.",
    ECONNRESET: "La conexión se ha interrumpido. Revisar el estado de PostgreSQL.",
  };
  // Node puede agrupar varios fallos de conexión en un AggregateError.
  const code = error.code || error.errors?.[0]?.code;
  return `[${code || "CONFIG/CONEXIÓN"}] ${hints[code] || "Revisar configuración y estado del servidor."}`;
}
module.exports = diagnose;
