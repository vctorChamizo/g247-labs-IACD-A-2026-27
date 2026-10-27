const { z } = require("zod");

// Registro/login: no aceptar role desde el cliente. La longitud de bcrypt se
// mide en bytes UTF-8: una contraseña con emoji puede ocupar más que su length.
const password = z.string().min(8).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Máximo 72 bytes UTF-8");
const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password,
}).strict();

// trim ANTES de min rechaza títulos que solo contienen espacios.
const title = z.string().trim().min(1).max(200);
const createTaskSchema = z.object({ title, done: z.boolean().default(false) }).strict();
const replaceTaskSchema = z.object({ title, done: z.boolean() }).strict();
const updateTaskSchema = z.object({ done: z.boolean() }).strict();

module.exports = { credentialsSchema, createTaskSchema, replaceTaskSchema, updateTaskSchema };
