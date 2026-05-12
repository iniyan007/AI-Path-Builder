import { create } from "zustand";
import { themeStorage } from "../api/storage.js";

export const useUiStore = create((set) => ({
  theme: themeStorage.get(),
  setTheme: (theme) => {
    themeStorage.set(theme);
    set({ theme });
    document.documentElement.dataset.theme = theme;
  },
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      themeStorage.set(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      return { theme: nextTheme };
    }),
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen })
}));
