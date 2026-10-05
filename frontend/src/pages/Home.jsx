import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { api, formatPrice } from "../api";
import AetherScene from "../components/AetherScene";
import ProductCard from "../components/ProductCard";

gsap.registerPlugin(ScrollTrigger);

const ROOMS = [
  {
    id: "phones",
    index: "01",
    title: "Phones",
    line: "The object in your hand for most of the day.",
  },
  {
    id: "computers",
    index: "02",
    title: "Computers",
    line: "Where the work actually sits.",
  },
  {
    id: "audio",
    index: "03",
    title: "Audio",
    line: "Sound you wear, or set on a table.",
  },
  {
    id: "gaming",
    index: "04",
    title: "Gaming",
    line: "The controls around the screen.",
  },
  {
    id: "accessories",
    index: "05",
    title: "Accessories",
    line: "Cables, cases, and the rest of the kit.",
  },
];

export default function Home() {
  const rootRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api("/api/v1/products?limit=20")
      .then((data) => setProducts(data.products || []))
      .catch((error) => setNotice(error.message));
  }, []);

  const lead = useMemo(
    () => products.find((product) => product.category === "computers") || products[0],
    [products],
  );

  const rooms = useMemo(
    () =>
      ROOMS.map((room) => ({
        ...room,
        products: products
          .filter((product) => product.category === room.id && product.id !== lead?.id)
          .slice(0, 2),
      })),
    [products, lead],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.from(".hero-line", {
        y: 36,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.to(".hero-stage", {
        yPercent: -12,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.from(element, {
          y: 32,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            start: "top 86%",
          },
        });
      });
    }, root);

    return () => context.revert();
  }, [products.length]);

  return (
    <div ref={rootRef}>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-line">Aether catalog</p>
          <h1>
            <span className="hero-line">Personal technology,</span>
            <span className="hero-line">edited down.</span>
          </h1>
          <p className="lede hero-line">
            Five rooms. Phones, computers, sound, play, and the pieces that hold them together.
            One price. One cart.
          </p>
          <div className="hero-actions hero-line">
            <Link className="button" to="/shop">
              Shop the catalog
            </Link>
            <Link className="button ghost" to="/signup">
              Create an account
            </Link>
          </div>
        </div>
        <div className="hero-stage">
          <AetherScene />
          <p className="stage-caption">A reference object. The catalog is the product.</p>
        </div>
      </section>

      <section className="index-row wrap">
        {ROOMS.map((room) => (
          <a key={room.id} href={`#${room.id}`}>
            <span>{room.index}</span>
            {room.title}
          </a>
        ))}
      </section>

      {lead ? (
        <section className="lead wrap reveal">
          <div className="lead-media">
            {lead.image?.url ? <img src={lead.image.url} alt="" /> : <span>{lead.category}</span>}
          </div>
          <div>
            <p className="eyebrow">Start here</p>
            <h2>{lead.name}</h2>
            <p className="lede">{lead.description}</p>
            <p className="price">{formatPrice(lead.price)}</p>
            <Link className="button" to="/shop">
              See it in the catalog
            </Link>
          </div>
        </section>
      ) : null}

      {notice ? <p className="notice wrap">{notice}</p> : null}

      {rooms.map((room) => (
        <section key={room.id} id={room.id} className="room wrap">
          <header className="room-head reveal">
            <p className="eyebrow">{room.index}</p>
            <h2>{room.title}</h2>
            <p>{room.line}</p>
          </header>
          <div className="grid">
            {room.products.map((product) => (
              <ProductCard key={product.id} product={product} onAdded={setNotice} />
            ))}
          </div>
        </section>
      ))}

      <section className="close wrap reveal">
        <div>
          <p className="eyebrow">The edit</p>
          <h2>Twenty pieces. Five rooms. Nothing extra.</h2>
        </div>
        <Link className="button" to="/shop">
          Open the full catalog
        </Link>
      </section>
    </div>
  );
}
