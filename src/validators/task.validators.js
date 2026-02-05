const { z } = require("zod");

const createTaskSchema = z.object({
  title: z.string().min(1, "title is required").max(200),
  description: z.string().min(1, "description is required").max(5000),
});

const patchStatusSchema = z.object({
  status: z.enum(["pending", "completed"]),
});

module.exports = { createTaskSchema, patchStatusSchema };
