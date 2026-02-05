require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const { errorHandler, notFound } = require("./middleware/error");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// simple mongo operator sanitization ($ and dot)
function sanitize(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];

    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    if (val && typeof val === "object") sanitize(val);
  }
}
app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// если фронт отдельно:
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.get("/health", (req, res) => res.json({ ok: true }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
