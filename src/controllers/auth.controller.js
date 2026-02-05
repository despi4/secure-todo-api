const bcrypt = require("bcrypt");
const { getDb } = require("../db/mongo");
const { ObjectId } = require("mongodb");
const { signAccessToken } = require("../services/token.service");
const { registerSchema, loginSchema } = require("../validators/auth.validators");

const USERS = "users";

function setAuthCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",
    maxAge: 30 * 60 * 1000,
  });
}

exports.register = async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const db = getDb();

    const existing = await db.collection(USERS).findOne({ email: body.email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(body.password, 12);

    const doc = {
      email: body.email,
      passwordHash,
      role: "user",
      createdAt: new Date(),
    };

    const result = await db.collection(USERS).insertOne(doc);

    return res.status(201).json({
      user: { id: result.insertedId.toString(), email: doc.email, role: doc.role },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const db = getDb();

    const user = await db.collection(USERS).findOne({ email: body.email });
    // generic error to prevent enumeration
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signAccessToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    setAuthCookie(res, token);
    return res.json({ user: { id: user._id.toString(), email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

exports.logout = async (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ ok: true });
};

exports.me = async (req, res, next) => {
  try {
    const db = getDb();
    const user = await db.collection(USERS).findOne(
      { _id: new ObjectId(req.user.sub) },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    return res.json({ user: { id: user._id.toString(), email: user.email, role: user.role } });
  } catch (err) { next(err); }
};
