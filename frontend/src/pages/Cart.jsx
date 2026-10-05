import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../api";
import { getToken } from "../auth";

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const token = getToken();

  useEffect(() => {
    if (!token) {
      return;
    }
    api("/api/v1/cart", { token })
      .then((data) => setCart(data.cart))
      .catch((err) => setError(err.message));
  }, [token]);

  if (!token) {
    return (
      <section className="panel page">
        <h1>Cart</h1>
        <p>
          <Link to="/login">Sign in</Link> to keep a cart.
        </p>
      </section>
    );
  }

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <section className="section page">
      <h1>Cart</h1>
      {error ? <p className="error">{error}</p> : null}
      {items.length === 0 ? <p className="muted">Nothing here yet.</p> : null}
      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.product.id}>
            <div>
              <strong>{item.product.name}</strong>
              <p className="muted">Qty {item.quantity}</p>
            </div>
            <span>{formatPrice(item.product.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {items.length > 0 ? <p className="total">{formatPrice(total)}</p> : null}
    </section>
  );
}
