import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { getProductById } from '../services/catalog';

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return action.payload || state;
    case 'ADD': {
      const id = action.payload.id;
      const qty = action.payload.qty ?? 1;
      const items = { ...state.items, [id]: (state.items[id] || 0) + qty };
      return { items };
    }
    case 'REMOVE': {
      const id = action.payload.id;
      const items = { ...state.items };
      delete items[id];
      return { items };
    }
    case 'SET_QTY': {
      const { id, qty } = action.payload;
      const items = { ...state.items };
      if (qty <= 0) delete items[id]; else items[id] = qty;
      return { items };
    }
    case 'CLEAR':
      return { items: {} };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: {} });

  // read from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart_state');
      if (raw) dispatch({ type: 'INIT', payload: JSON.parse(raw) });
    } catch { }
  }, []);

  // persist changes
  useEffect(() => {
    try {
      localStorage.setItem('cart_state', JSON.stringify(state));
    } catch { }
  }, [state]);

  const count = useMemo(
    () => Object.values(state.items).reduce((a, b) => a + b, 0),
    [state.items]
  );

  // Calculate totals with products
  const totals = useMemo(() => {
    const cartItems = Object.entries(state.items).map(([id, qty]) => {
      const product = getProductById(id);
      return product ? { ...product, qty } : null;
    }).filter(Boolean);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const vat = Math.round(subtotal * 0.20); // 20% Swedish VAT
    const total = subtotal;

    return {
      subtotal,
      vat,
      total,
      itemCount: cartItems.length
    };
  }, [state.items]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

// In src/context/CartContext.jsx
const api = useMemo(() => ({
  items: state.items,  // ← Make sure this line exists
  count,
  add: (id, qty = 1) => dispatch({ type: 'ADD', payload: { id, qty } }),
  remove: (id) => dispatch({ type: 'REMOVE', payload: { id } }),
  setQty: (id, qty) => dispatch({ type: 'SET_QTY', payload: { id, qty } }),
  clear: () => dispatch({ type: 'CLEAR' }),
}), [state.items, count]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}