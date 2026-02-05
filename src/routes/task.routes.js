const router = require("express").Router();
const tasks = require("../controllers/task.controller");
const { requireAuth } = require("../middleware/auth");

// POST /tasks (auth required)
router.post("/", requireAuth, tasks.create);

// GET /tasks (лучше auth required, чтобы были “private tasks”)
router.get("/", requireAuth, tasks.listMine);

// GET /tasks/:id (public read)
router.get("/:id", tasks.getByIdPublic);

// PATCH /tasks/:id (auth + owner/admin)
router.patch("/:id", requireAuth, tasks.patchStatus);

// DELETE /tasks/:id (auth + owner/admin)
router.delete("/:id", requireAuth, tasks.remove);

module.exports = router;
