import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { api } from "./api";
import { clearToken, getToken } from "./auth";
import Layout from "./components/Layout";
import SmoothScroll from "./components/SmoothScroll";
import AuthCallback from "./pages/AuthCallback";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Shop from "./pages/Shop";
import Signup from "./pages/Signup";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    api("/api/v1/user/me", { token })
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      });
  }, []);

  return (
    <Layout user={user} onLogout={() => setUser(null)}>
      <SmoothScroll />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback onLogin={setUser} />} />
      </Routes>
    </Layout>
  );
}
