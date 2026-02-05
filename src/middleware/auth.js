const { verifyAccessToken } = require("../services/token.service");

function requireAuth(req, res, next) {
  const token = req.cookies?.access_token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = verifyAccessToken(token); // { sub, role, email }
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { requireAuth };
