import { http } from "./http.js";

export const api = {
  login: (payload) => http.post("/auth/login", payload).then((r) => r.data),
  register: (payload) => http.post("/auth/register", payload).then((r) => r.data),
  me: () => http.get("/auth/me").then((r) => r.data),
  logout: () => http.post("/auth/logout").then((r) => r.data),
  workspaces: () => http.get("/workspaces").then((r) => r.data),
  createWorkspace: (payload) => http.post("/workspaces", payload).then((r) => r.data),
  projects: (workspaceId) => http.get("/projects", { params: { workspaceId } }).then((r) => r.data),
  createProject: (payload) => http.post("/projects", payload).then((r) => r.data),
  tasks: (params) => http.get("/tasks", { params }).then((r) => r.data),
  createTask: (payload) => http.post("/tasks", payload).then((r) => r.data),
  updateTask: (id, payload) => http.put(`/tasks/${id}`, payload).then((r) => r.data),
  updateTaskStatus: (id, status) => http.put(`/tasks/${id}/status`, { status }).then((r) => r.data),
  deleteTask: (id) => http.delete(`/tasks/${id}`).then((r) => r.data),
  addSubtask: (id, title) => http.post(`/tasks/${id}/subtasks`, { title }).then((r) => r.data),
  addComment: (id, text) => http.post(`/tasks/${id}/comments`, { text }).then((r) => r.data),
  activity: (id) => http.get(`/tasks/${id}/activity`).then((r) => r.data),
  notifications: () => http.get("/notifications").then((r) => r.data),
  markNotification: (id) => http.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllNotifications: () => http.put("/notifications/mark-all-read").then((r) => r.data),
  analytics: (workspaceId) => http.get("/analytics/overview", { params: { workspaceId } }).then((r) => r.data),
  productivity: (workspaceId) => http.get("/analytics/productivity", { params: { workspaceId } }).then((r) => r.data)
};
