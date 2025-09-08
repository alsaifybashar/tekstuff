import React from "react";
import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { setQty, remove } = useCart();

  const handleDec = () => setQty(item.id, Math.max(1, item.qty - 1));
  const handleInc = () => setQty(item.id, item.qty + 1);

  return (
    <div className="card mb-3 border-0 border-bottom pb-3">
      <div className="card-body p-0 d-flex align-items-start gap-3">
        <div
          className="ratio ratio-1x1 rounded bg-light flex-shrink-0"
          style={{ width: 64 }}
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-100 h-100 object-fit-contain p-1"
            />
          ) : null}
        </div>

        <div className="flex-grow-1">
          <div className="d-flex justify-content-between">
            <div className="me-3">
              <div className="fw-semibold">{item.title}</div>
              <div className="small text-success d-flex align-items-center gap-1 mt-1">
                <i className="bi bi-check-circle" />
                {item.inStock ? "I lager" : "Tillfälligt slut"}
              </div>
            </div>
            <div className="fs-6 fw-semibold text-nowrap">
              {`${new Intl.NumberFormat("sv-SE").format(item.price)}:-`}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mt-2">
            <div
              className="btn-group btn-group-sm"
              role="group"
              aria-label="Antal"
            >
              <button
                className="btn btn-outline-secondary"
                onClick={handleDec}
                aria-label="Minska antal"
              >
                −
              </button>
              <span className="btn btn-outline-secondary disabled">
                {item.qty}
              </span>
              <button
                className="btn btn-outline-secondary"
                onClick={handleInc}
                aria-label="Öka antal"
              >
                +
              </button>
            </div>

            <button
              className="btn btn-link text-danger p-0 ms-3"
              onClick={() => remove(item.id)}
              aria-label="Ta bort produkt"
            >
              <i className="bi bi-trash" /> <span className="visually-hidden">Ta bort</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
