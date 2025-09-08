import React from "react";
import { useCart } from "../context/CartContext";

export default function OrderSummary() {
  const { subtotal, vat, total, formatMoney } = useCart();

  return (
    <aside className="position-sticky top-0" style={{ top: "1rem" }}>
      {/* "Become a member" style info box (optional) */}
      <div className="card mb-3 border-0">
        <div className="card-body bg-warning-subtle rounded-3">
          <div className="fw-semibold mb-2">Få mer som <span className="text-success">medlem</span></div>
          <ul className="small mb-3 ps-3">
            <li>Exklusiva klubbdeals &amp; rabatter</li>
            <li>100 kr presentkort för köp över 5000 kr</li>
            <li>Förtur till kampanjer &amp; Black Friday</li>
          </ul>
          <button className="btn btn-outline-success w-100">
            Logga in / Registrera dig
          </button>
        </div>
      </div>

      {/* Order summary card */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row">
            <div className="col">
              <div className="fw-semibold">Orderöversikt</div>
            </div>
            <div className="col text-end">
              <div className="fw-semibold">Betalning</div>
              <div className="small text-muted">Pris visas i kassan</div>
            </div>
          </div>

          <hr />

          <div className="d-flex justify-content-between small mb-2">
            <span>Moms</span>
            <span>{formatMoney(vat)}</span>
          </div>

          <div className="d-flex justify-content-between align-items-baseline mt-3">
            <div className="text-muted small">Totalbelopp SEK</div>
            <div className="fs-3 fw-bold">{formatMoney(total)}</div>
          </div>

          <button className="btn btn-success btn-lg w-100 mt-3">
            Fortsätt till kassan
          </button>
        </div>
      </div>
    </aside>
  );
}
