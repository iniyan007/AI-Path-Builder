import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.login(credentials)
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
          return data
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const { data } = await authAPI.register(userData)
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          })
          return data
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try {
          await authAPI.logout({ refreshToken: get().refreshToken })
        } catch (_) {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe()
          set({ user: data.data, isAuthenticated: true })
        } catch (_) {
          set({ user: null, isAuthenticated: false, accessToken: null })
        }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
)
