const ALLOWED_GENRES = ["novel", "essay", "poetry"];

function validateBook(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      errors.push({ field: "title", message: "Title is required" });
    }
  }

  if (!partial || Object.hasOwn(body, "pages")) {
    if (!Number.isInteger(body.pages) || body.pages < 1) {
      errors.push({ field: "pages", message: "Pages must be a positive integer" });
    }
  }

  if (!partial || Object.hasOwn(body, "available")) {
    if (typeof body.available !== "boolean") {
      errors.push({ field: "available", message: "Available must be true or false" });
    }
  }

  if (!partial || Object.hasOwn(body, "genre")) {
    if (!ALLOWED_GENRES.includes(body.genre)) {
      errors.push({ field: "genre", message: "Genre is not allowed" });
    }
  }

  // TODO: adaptar estas reglas al dominio elegido y validar los campos
  // desconocidos antes de persistirlos. En PATCH se validan solo los recibidos.

  return errors;
}

module.exports = { validateBook, ALLOWED_GENRES };

