const KEY = "aether_token";

export const getToken = () => localStorage.getItem(KEY);

export const setToken = (token) => {
  localStorage.setItem(KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
};
