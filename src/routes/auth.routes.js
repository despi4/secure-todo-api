const router = require("express").Router();
const auth = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimit");
const { requireAuth } = require("../middleware/auth");

router.post("/register", authLimiter, auth.register);
router.post("/login", authLimiter, auth.login);
router.post("/logout", requireAuth, auth.logout);

// по ТЗ: GET /me
router.get("/me", requireAuth, auth.me);

module.exports = router;
