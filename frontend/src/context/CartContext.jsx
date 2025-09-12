import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartCtx = createContext(null);

const initial = { items: [] };

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return action.payload || state;

    case "ADD_ITEM": {
      const { product, qty = 1 } = action.payload || {};
      if (!product || !product.id) return state; // requires stable id
      const idx = state.items.findIndex((i) => i.id === product.id);
      let items;
      if (idx >= 0) {
        items = state.items.map((i, n) =>
          n === idx ? { ...i, qty: Math.min(i.qty + qty, 99) } : i
        );
      } else {
        // keep only fields you need in cart
        const { id, name, title, price, image, images } = product;
        items = [
          ...state.items,
          {
            id,
            name: name || title || "Produkt",
            price: Number(price) || 0,
            image: image || images?.[0],
            qty: Math.max(1, qty),
          },
        ];
      }
      return { ...state, items };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };

    case "SET_QTY": {
      const { id, qty } = action.payload || {};
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === id ? { ...i, qty: Math.max(1, Math.min(99, Number(qty) || 1)) } : i
        ),
      };
    }

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart:v1");
      if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) });
    } catch {}
  }, []);

  // persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cart:v1", JSON.stringify(state));
    } catch {}
  }, [state]);

  const api = useMemo(
    () => ({
      items: state.items,
      count: state.items.reduce((s, i) => s + i.qty, 0),
      subtotal: state.items.reduce((s, i) => s + i.qty * (Number(i.price) || 0), 0),
      addItem: (product, qty = 1) => dispatch({ type: "ADD_ITEM", payload: { product, qty } }),
      removeItem: (id) => dispatch({ type: "REMOVE_ITEM", payload: id }),
      setQty: (id, qty) => dispatch({ type: "SET_QTY", payload: { id, qty } }),
      clear: () => dispatch({ type: "CLEAR" }),
    }),
    [state]
  );

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
