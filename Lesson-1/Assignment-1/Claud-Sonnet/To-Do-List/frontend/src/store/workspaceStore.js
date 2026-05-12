import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workspaceAPI, projectAPI } from '../api'

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      projects: [],
      isLoading: false,

      fetchWorkspaces: async () => {
        set({ isLoading: true })
        try {
          const { data } = await workspaceAPI.getAll()
          const workspaces = data.data
          const active = get().activeWorkspace
            ? workspaces.find((w) => w._id === get().activeWorkspace._id) || workspaces[0]
            : workspaces[0]
          set({ workspaces, activeWorkspace: active || null, isLoading: false })
          if (active) get().fetchProjects(active._id)
        } catch (_) { set({ isLoading: false }) }
      },

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace, projects: [] })
        get().fetchProjects(workspace._id)
      },

      createWorkspace: async (data) => {
        const { data: res } = await workspaceAPI.create(data)
        set((s) => ({ workspaces: [...s.workspaces, res.data] }))
        return res.data
      },

      updateWorkspace: async (id, data) => {
        const { data: res } = await workspaceAPI.update(id, data)
        set((s) => ({
          workspaces: s.workspaces.map((w) => (w._id === id ? res.data : w)),
          activeWorkspace: s.activeWorkspace?._id === id ? res.data : s.activeWorkspace,
        }))
      },

      fetchProjects: async (workspaceId) => {
        try {
          const { data } = await projectAPI.getAll({ workspace: workspaceId })
          set({ projects: data.data })
        } catch (_) {}
      },

      createProject: async (data) => {
        const { data: res } = await projectAPI.create(data)
        set((s) => ({ projects: [...s.projects, res.data] }))
        return res.data
      },

      updateProject: async (id, data) => {
        const { data: res } = await projectAPI.update(id, data)
        set((s) => ({ projects: s.projects.map((p) => (p._id === id ? res.data : p)) }))
      },

      deleteProject: async (id) => {
        await projectAPI.delete(id)
        set((s) => ({ projects: s.projects.filter((p) => p._id !== id) }))
      },
    }),
    { name: 'workspace-storage', partialize: (s) => ({ activeWorkspace: s.activeWorkspace }) }
  )
)
