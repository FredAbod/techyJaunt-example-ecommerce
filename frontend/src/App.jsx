import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AuthCallback from "./pages/AuthCallback";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PaymentCallback from "./pages/PaymentCallback";
import Product from "./pages/Product";
import Shop from "./pages/Shop";
import Signup from "./pages/Signup";
import Wallet from "./pages/Wallet";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/payments/callback" element={<PaymentCallback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
