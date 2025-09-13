// components/CategoryStrip.jsx
import { useEffect, useRef, useState } from "react";
import Container from "react-bootstrap/Container";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ✅ Import SVGs as URLs (works without any plugin)
import batteryChargingUrl from "../assets/icon/battery-charging.svg";
import cableUrl from "../assets/icon/cable.svg";
import smartphoneUrl from "../assets/icon/smartphone.svg";

// Map URLs to ids you’ll use below
const icons = {
  battery: batteryChargingUrl,
  cable: cableUrl,
  mobile: smartphoneUrl,
};

const CATEGORIES = [
  { id: "outlet",     label: "DEALS",                          emoji: "🏷️" },
  { id: "computers",  label: "DATORER & KONTOR",               icon: icons.battery },
  { id: "appliances", label: "VITVAROR",                       icon: icons.cable },
  { id: "tv",         label: "TV, LJUD & SMART HEM",           icon: icons.tv },
  { id: "mobile",     label: "MOBILER, TABLETS & SMARTKLOCKOR",icon: icons.mobile },
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
        <button className="cat-nav left" onClick={() => scrollByAmount(-280)} disabled={!canLeft} aria-label="Scroll categories left">
          <ChevronLeft size={20} />
        </button>

        <div ref={trackRef} className="cat-track" role="list" aria-label="Kategorier">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className="cat-card"
              role="listitem"
              onClick={() => onSelect?.(c.id)}
              aria-label={c.label}
            >
              <span className="cat-icon" aria-hidden="true">
                {c.icon ? (
                  <img src={c.icon} alt="" className="cat-svg" />
                ) : c.emoji ? (
                  c.emoji
                ) : (
                  <span className="cat-fallback">{c.label.charAt(0)}</span>
                )}
              </span>
              <span className="cat-title">{c.label}</span>
            </button>
          ))}
        </div>

        <button className="cat-nav right" onClick={() => scrollByAmount(280)} disabled={!canRight} aria-label="Scroll categories right">
          <ChevronRight size={20} />
        </button>
      </Container>
    </div>
  );
}
