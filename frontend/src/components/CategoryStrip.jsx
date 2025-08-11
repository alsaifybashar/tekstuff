// components/CategoryStrip.jsx
import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import { ChevronLeft, ChevronRight } from "lucide-react"; // or react-icons/bs

// Swap emojis for your SVGs or <img> icons when ready
const CATEGORIES = [
  { id: "outlet", label: "OUTLET", emoji: "🏷️" },
  { id: "computers", label: "DATORER & KONTOR", emoji: "💻" },
  { id: "appliances", label: "VITVAROR", emoji: "🧺" },
  { id: "tv", label: "TV, LJUD & SMART HEM", emoji: "📺" },
  { id: "mobile", label: "MOBILER, TABLETS & SMARTKLOCKOR", emoji: "📱" },
  { id: "gaming", label: "GAMING", emoji: "🎮" },
  { id: "home", label: "HEM, HUSHÅLL & TRÄDGÅRD", emoji: "🧰" },
  { id: "beauty", label: "PERSONVÅRD, HÄLSA & SKÖNHET", emoji: "💄" },
  { id: "kitchen", label: "EPOQ KÖK & TVÄTTSTUGA", emoji: "🍳" },
  { id: "services", label: "TJÄNSTER", emoji: "➕" },
];

export default function CategoryStrip({ onSelect }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const scrollByAmount = (px) =>
    trackRef.current?.scrollBy({ left: px, behavior: "smooth" });

  return (
    <div className="cat-strip-wrap">
      <Container fluid="xl" className="py-3 position-relative">
        {/* Arrow buttons (only shown when needed) */}
        <button
          className="cat-nav left"
          aria-label="Scroll categories left"
          onClick={() => scrollByAmount(-280)}
          disabled={!canLeft}
        >
          <ChevronLeft size={20} />
        </button>

        {/* The one-line track */}
        <div ref={trackRef} className="cat-track" role="list">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className="cat-card"
              role="listitem"
              onClick={() => onSelect?.(c.id)}
              aria-label={c.label}
            >
              <span className="cat-icon" aria-hidden="true">
                {c.emoji}
              </span>
              <span className="cat-title">{c.label}</span>
            </button>
          ))}
        </div>

        <button
          className="cat-nav right"
          aria-label="Scroll categories right"
          onClick={() => scrollByAmount(280)}
          disabled={!canRight}
        >
          <ChevronRight size={20} />
        </button>
      </Container>
    </div>
  );
}
