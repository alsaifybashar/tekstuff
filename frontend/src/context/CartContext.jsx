import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

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
    } catch {}
  }, []);

  // persist changes
  useEffect(() => {
    try {
      localStorage.setItem('cart_state', JSON.stringify(state));
    } catch {}
  }, [state]);

  const count = useMemo(
    () => Object.values(state.items).reduce((a, b) => a + b, 0),
    [state.items]
  );

  const api = useMemo(() => ({
    items: state.items,
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
