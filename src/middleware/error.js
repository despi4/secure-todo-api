const { ZodError } = require("zod");

function notFound(req, res) {
  return res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.issues.map(i => ({ path: i.path.join("."), message: i.message })),
    });
  }

  // не возвращай stack/DB детали пользователю
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

module.exports = { errorHandler, notFound };
