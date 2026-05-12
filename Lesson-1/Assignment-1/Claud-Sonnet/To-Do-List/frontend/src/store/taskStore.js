import { create } from 'zustand'
import { taskAPI } from '../api'

export const useTaskStore = create((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  filters: { status: '', priority: '', search: '', dueDate: '' },
  pagination: { page: 1, totalPages: 1, total: 0 },

  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: { status: '', priority: '', search: '', dueDate: '' } }),
  setSelectedTask: (task) => set({ selectedTask: task }),

  fetchTasks: async (workspaceId, extra = {}) => {
    if (!workspaceId) return
    set({ isLoading: true })
    try {
      const { filters } = get()
      const params = { workspace: workspaceId, ...filters, ...extra }
      Object.keys(params).forEach((k) => !params[k] && delete params[k])
      const { data } = await taskAPI.getAll(params)
      set({ tasks: data.data, pagination: data.pagination, isLoading: false })
    } catch (_) { set({ isLoading: false }) }
  },

  createTask: async (data) => {
    const { data: res } = await taskAPI.create(data)
    set((s) => ({ tasks: [res.data, ...s.tasks] }))
    return res.data
  },

  updateTask: async (id, data) => {
    const { data: res } = await taskAPI.update(id, data)
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === id ? res.data : t)),
      selectedTask: s.selectedTask?._id === id ? res.data : s.selectedTask,
    }))
    return res.data
  },

  updateTaskStatus: async (id, status) => {
    const { data } = await taskAPI.updateStatus(id, status)
    set((s) => ({
      tasks: s.tasks.map((t) => (t._id === id ? data.data : t)),
    }))
    return data.data
  },

  deleteTask: async (id) => {
    await taskAPI.delete(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }))
  },

  addComment: async (taskId, content) => {
    const { data } = await taskAPI.addComment(taskId, { content })
    if (get().selectedTask?._id === taskId) {
      set((s) => ({
        selectedTask: { ...s.selectedTask, comments: [...(s.selectedTask.comments || []), data.data] },
      }))
    }
    return data.data
  },

  addSubtask: async (taskId, subtaskData) => {
    const { data } = await taskAPI.addSubtask(taskId, subtaskData)
    set((s) => ({
      tasks: s.tasks.map((t) => t._id === taskId ? { ...t, subtasks: [...(t.subtasks || []), data.data] } : t),
      selectedTask: s.selectedTask?._id === taskId
        ? { ...s.selectedTask, subtasks: [...(s.selectedTask.subtasks || []), data.data] }
        : s.selectedTask,
    }))
    return data.data
  },

  updateSubtask: async (taskId, subtaskId, updates) => {
    const { data } = await taskAPI.updateSubtask(taskId, subtaskId, updates)
    set((s) => ({
      selectedTask: s.selectedTask?._id === taskId ? {
        ...s.selectedTask,
        subtasks: s.selectedTask.subtasks.map((st) => st._id === subtaskId ? data.data : st),
      } : s.selectedTask,
    }))
  },
}))
