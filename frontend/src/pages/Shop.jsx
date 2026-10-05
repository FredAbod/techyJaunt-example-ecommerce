import { useEffect, useState } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api("/api/v1/categories")
      .then((data) => setCategories(data.categories || []))
      .catch((error) => setNotice(error.message));
  }, []);

  useEffect(() => {
    const query = category ? `?category=${category}&limit=20` : "?limit=20";
    api(`/api/v1/products${query}`)
      .then((data) => setProducts(data.products || []))
      .catch((error) => setNotice(error.message));
  }, [category]);

  return (
    <section className="section page">
      <div className="section-head">
        <h1>Catalog</h1>
        <div className="filters">
          <button type="button" className={!category ? "on" : ""} onClick={() => setCategory("")}>
            All
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "on" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {notice ? <p className="notice">{notice}</p> : null}
      <div className="grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdded={setNotice}
          />
        ))}
      </div>
    </section>
  );
}
