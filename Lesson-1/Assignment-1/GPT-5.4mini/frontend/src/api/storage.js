const ACCESS_KEY = "enterprise_todo_access";
const USER_KEY = "enterprise_todo_user";
const THEME_KEY = "enterprise_todo_theme";

export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS_KEY),
  set: (token) => localStorage.setItem(ACCESS_KEY, token),
  clear: () => localStorage.removeItem(ACCESS_KEY)
};

export const userStorage = {
  get: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => localStorage.removeItem(USER_KEY)
};

export const themeStorage = {
  get: () => localStorage.getItem(THEME_KEY) || "dark",
  set: (theme) => localStorage.setItem(THEME_KEY, theme)
};
