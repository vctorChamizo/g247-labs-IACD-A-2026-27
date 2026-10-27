const { createTaskSchema } = require("../src/validators/schemas");
const pagination = require("../src/utils/pagination");

// safeParse permite decidir si continuar o responder 400, sin lanzar un error.
function showValidation(body) {
  const result = createTaskSchema.safeParse(body);
  console.log(JSON.stringify(body), "->", result.success ? result.data : "400: validación rechazada");
}
showValidation({ title: "  Estudiar JWT  " }); // Correcto: trim elimina espacios.
showValidation({ title: "   " }); // Vacío tras trim: no continúa al controlador.
showValidation({ title: 123 }); // El título debe ser texto.
showValidation({ title: "Tarea", userId: 999 }); // El propietario no se elige aquí.

// Convertir y acotar antes de enviar page/limit al modelo.
for (const page of [undefined, "0", "2", "2abc", "2.7"]) {
  console.log("page =", page, "->", pagination({ page, limit: "999" }));
}
