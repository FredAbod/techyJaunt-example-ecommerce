import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { clearToken, getToken } from "./auth";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [] });
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((message, tone = "info") => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const refreshCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCart({ items: [] });
      return;
    }
    const data = await api("/api/v1/cart", { token });
    setCart(data.cart);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    api("/api/v1/user/me", { token })
      .then((data) => {
        setUser(data.user);
        return refreshCart();
      })
      .catch(() => {
        clearToken();
        setUser(null);
      });
  }, [refreshCart]);

  const login = useCallback(
    (nextUser) => {
      setUser(nextUser);
      refreshCart().catch(() => {});
    },
    [refreshCart],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setCart({ items: [] });
  }, []);

  // Each cart call returns the whole cart, so the response replaces local state.
  const cartRequest = useCallback(async (path, options) => {
    const data = await api(path, { ...options, token: getToken() });
    setCart(data.cart);
    return data.cart;
  }, []);

  const addToCart = useCallback(
    (productId, quantity = 1) =>
      cartRequest("/api/v1/cart/items", { method: "POST", body: { productId, quantity } }),
    [cartRequest],
  );

  const updateCartItem = useCallback(
    (productId, quantity) =>
      cartRequest(`/api/v1/cart/items/${productId}`, { method: "PATCH", body: { quantity } }),
    [cartRequest],
  );

  const removeCartItem = useCallback(
    (productId) => cartRequest(`/api/v1/cart/items/${productId}`, { method: "DELETE" }),
    [cartRequest],
  );

  const checkout = useCallback(async (method, idempotencyKey) => {
    const data = await api("/api/v1/payments/checkout", {
      method: "POST",
      token: getToken(),
      body: { method, idempotencyKey },
    });
    if (data.cart) setCart(data.cart);
    return data;
  }, []);

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      cart,
      cartCount,
      addToCart,
      updateCartItem,
      removeCartItem,
      checkout,
      toast,
      toasts,
    }),
    [user, login, logout, cart, cartCount, addToCart, updateCartItem, removeCartItem, checkout, toast, toasts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
