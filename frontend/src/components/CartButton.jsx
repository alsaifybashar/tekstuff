import { NavLink } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

export default function CartButton() {
  // ✅ IMPORTANT: Make sure you destructure 'items' properly from useCart()
  const { count, items } = useCart(); // ← This line should include 'items'
  
  // Add error handling in case cart context fails
  const safeCount = count || 0;
  
  // tiny "bump" animation when count changes
  const [bump, setBump] = useState(false);
  
  useEffect(() => {
    if (safeCount >= 0) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [safeCount]); // ← Use safeCount instead of count

  const label = safeCount > 99 ? "99+" : String(safeCount);

  return (
    <Button
      as={NavLink}
      to="/cart"
      className={`cart-btn-custom d-flex align-items-center gap-2 ${
        bump ? "cart-bump" : ""
      }`}
      aria-label={`Kundvagn, ${safeCount} artikel${safeCount === 1 ? "" : "er"}`}
    >
      <CartIcon />
      <span className="d-none d-lg-inline fw-semibold">Kundvagn</span>
      <span className="cart-badge" aria-hidden="true">
        {label}
      </span>
    </Button>
  );
}

function CartIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="9"
        cy="20"
        r="1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="17"
        cy="20"
        r="1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M3 4h2l2.2 10.5A2 2 0 0 0 9.2 16H17a2 2 0 0 0 2-1.5L21 8H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}