function validate(schema) {
  return (req, res, next) => {
    // Un valor inválido no llega al controlador ni dispara una consulta SQL.
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.issues });
    req.body = result.data;
    next();
  };
}
module.exports = validate;
