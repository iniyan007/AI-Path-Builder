import Task from "../models/Task.js";
import { createNotification } from "./notificationService.js";

export async function addActivity(taskId, actor, action, meta = {}) {
  const task = await Task.findById(taskId);
  if (!task) return null;
  task.activity.unshift({ actor, action, meta });
  await task.save();
  return task;
}

export async function notifyAssignee(task, actorName) {
  if (!task.assignee) return;
  await createNotification({
    user: task.assignee,
    workspace: task.workspace,
    title: `Task updated: ${task.title}`,
    message: `${actorName} updated "${task.title}".`,
    type: "task"
  });
}
