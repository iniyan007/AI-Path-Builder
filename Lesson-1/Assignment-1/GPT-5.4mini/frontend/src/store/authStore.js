import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../api/endpoints.js";
import { tokenStorage, userStorage } from "../api/storage.js";

const bootstrapUser = userStorage.get();
const bootstrapToken = tokenStorage.get();

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: bootstrapUser,
      token: bootstrapToken,
      isAuthenticated: Boolean(bootstrapUser && bootstrapToken),
      setSession: (session) => {
        tokenStorage.set(session.accessToken);
        userStorage.set(session.user);
        set({ user: session.user, token: session.accessToken, isAuthenticated: true });
      },
      hydrate: async () => {
        if (!get().token) return;
        try {
          const response = await api.me();
          set({ user: response.user, isAuthenticated: true });
          userStorage.set(response.user);
        } catch {
          get().clearSession();
        }
      },
      clearSession: async () => {
        tokenStorage.clear();
        userStorage.clear();
        set({ user: null, token: null, isAuthenticated: false });
      },
      login: async (payload) => {
        const response = await api.login(payload);
        get().setSession(response);
        return response;
      },
      register: async (payload) => {
        const response = await api.register(payload);
        get().setSession(response);
        return response;
      },
      logout: async () => {
        try {
          await api.logout();
        } finally {
          get().clearSession();
        }
      }
    }),
    { name: "enterprise-todo-auth" }
  )
);
