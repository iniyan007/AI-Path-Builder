import api from './axios'

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refreshToken: (data) => api.post('/auth/refresh-token', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
}

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  getOne: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  reorder: (tasks) => api.put('/tasks/reorder', { tasks }),
  addSubtask: (id, data) => api.post(`/tasks/${id}/subtasks`, data),
  updateSubtask: (id, subtaskId, data) => api.put(`/tasks/${id}/subtasks/${subtaskId}`, data),
  deleteSubtask: (id, subtaskId) => api.delete(`/tasks/${id}/subtasks/${subtaskId}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
  deleteComment: (id, commentId) => api.delete(`/tasks/${id}/comments/${commentId}`),
  getActivity: (id) => api.get(`/tasks/${id}/activity`),
}

export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  create: (data) => api.post('/workspaces', data),
  getOne: (id) => api.get(`/workspaces/${id}`),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
  invite: (id, data) => api.post(`/workspaces/${id}/invite`, data),
  removeMember: (id, userId) => api.delete(`/workspaces/${id}/members/${userId}`),
  updateMemberRole: (id, userId, data) => api.put(`/workspaces/${id}/members/${userId}/role`, data),
}

export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  getOne: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
}

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const analyticsAPI = {
  getOverview: (workspace) => api.get('/analytics/overview', { params: { workspace } }),
  getProductivity: (workspace, days) => api.get('/analytics/productivity', { params: { workspace, days } }),
  getTeam: (workspace) => api.get('/analytics/team', { params: { workspace } }),
}
