const { ObjectId } = require("mongodb");
const { getDb } = require("../db/mongo");
const { createTaskSchema, patchStatusSchema } = require("../validators/task.validators");

const TASKS = "tasks";

exports.create = async (req, res, next) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const db = getDb();

    const now = new Date();
    const doc = {
      title: body.title,
      description: body.description,
      status: "pending",
      authorId: new ObjectId(req.user.sub),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(TASKS).insertOne(doc);
    return res.status(201).json({ task: { ...doc, _id: result.insertedId } });
  } catch (err) { next(err); }
};

exports.listMine = async (req, res, next) => {
  try {
    const db = getDb();
    const tasks = await db.collection(TASKS)
      .find({ authorId: new ObjectId(req.user.sub) })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({ tasks });
  } catch (err) { next(err); }
};

// публичное чтение (по ТЗ "Anyone can read tasks")
exports.getByIdPublic = async (req, res, next) => {
  try {
    const db = getDb();
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Task not found" });

    const task = await db.collection(TASKS).findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });

    return res.json({ task });
  } catch (err) { next(err); }
};

function canModify(reqUser, task) {
  return reqUser.role === "admin" || task.authorId.toString() === reqUser.sub;
}

exports.patchStatus = async (req, res, next) => {
  try {
    const body = patchStatusSchema.parse(req.body);
    const db = getDb();
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Task not found" });

    const task = await db.collection(TASKS).findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!canModify(req.user, task)) return res.status(403).json({ error: "Forbidden" });

    const now = new Date();
    await db.collection(TASKS).updateOne(
      { _id: task._id },
      { $set: { status: body.status, updatedAt: now } }
    );

    const updated = await db.collection(TASKS).findOne({ _id: task._id });
    return res.json({ task: updated });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const db = getDb();
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Task not found" });

    const task = await db.collection(TASKS).findOne({ _id: new ObjectId(req.params.id) });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!canModify(req.user, task)) return res.status(403).json({ error: "Forbidden" });

    await db.collection(TASKS).deleteOne({ _id: task._id });
    return res.status(204).send();
  } catch (err) { next(err); }
};
