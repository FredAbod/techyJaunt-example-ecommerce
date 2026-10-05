import { formatPrice, api } from "../api";
import { getToken } from "../auth";

export default function ProductCard({ product, onAdded }) {
  const addToCart = async () => {
    const token = getToken();
    if (!token) {
      window.location.assign("/login");
      return;
    }
    try {
      await api("/api/v1/cart/items", {
        method: "POST",
        token,
        body: { productId: product.id, quantity: 1 },
      });
      onAdded?.("Added to cart");
    } catch (error) {
      onAdded?.(error.message);
    }
  };

  return (
    <article className="card">
      <div className="card-media">
        {product.image?.url ? (
          <img src={product.image.url} alt="" />
        ) : (
          <span>{product.category}</span>
        )}
      </div>
      <p className="eyebrow">{product.category}</p>
      <h3>{product.name}</h3>
      <p className="muted">{product.description}</p>
      <div className="card-row">
        <strong>{formatPrice(product.price)}</strong>
        <button type="button" onClick={addToCart} disabled={product.stock < 1}>
          {product.stock < 1 ? "Sold out" : "Add"}
        </button>
      </div>
    </article>
  );
}
