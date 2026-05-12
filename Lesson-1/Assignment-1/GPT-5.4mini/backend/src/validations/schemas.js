import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const authSchemas = {
  register: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(["admin", "manager", "member"]).optional()
    })
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
  })
};

export const workspaceSchemas = {
  upsert: z.object({
    body: z.object({
      name: z.string().min(2),
      description: z.string().optional()
    })
  }),
  id: z.object({
    params: z.object({
      id: objectId
    })
  })
};

export const projectSchemas = {
  upsert: z.object({
    body: z.object({
      workspaceId: objectId,
      name: z.string().min(2),
      color: z.string().optional(),
      description: z.string().optional()
    })
  }),
  id: z.object({
    params: z.object({
      id: objectId
    })
  })
};

export const taskSchemas = {
  list: z.object({
    query: z.object({
      workspaceId: objectId.optional(),
      projectId: objectId.optional(),
      status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      search: z.string().optional()
    })
  }),
  upsert: z.object({
    body: z.object({
      workspaceId: objectId,
      projectId: objectId.optional().nullable(),
      assigneeId: objectId.optional().nullable(),
      title: z.string().min(2),
      description: z.string().optional(),
      status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      dueDate: z.string().datetime().optional().nullable(),
      tags: z.array(z.string()).optional(),
      subtasks: z.array(z.object({ title: z.string().min(1), completed: z.boolean().optional() })).optional()
    })
  }),
  id: z.object({
    params: z.object({
      id: objectId
    })
  })
};
