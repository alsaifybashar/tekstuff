import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartCtx = createContext(null);

const initial = { items: {} }; // Changed to object for better performance

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return action.payload || state;

    case "ADD_ITEM": {
      const { product, qty = 1 } = action.payload || {};
      if (!product || !product.id) return state;
      
      const currentQty = state.items[product.id] || 0;
      const newQty = Math.min(currentQty + qty, 99);
      
      return {
        ...state,
        items: {
          ...state.items,
          [product.id]: newQty
        }
      };
    }

    case "REMOVE_ITEM": {
      const { [action.payload]: removed, ...remainingItems } = state.items;
      return { ...state, items: remainingItems };
    }

    case "SET_QTY": {
      const { id, qty } = action.payload || {};
      const newQty = Math.max(0, Math.min(99, Number(qty) || 0));
      
      if (newQty === 0) {
        const { [id]: removed, ...remainingItems } = state.items;
        return { ...state, items: remainingItems };
      }
      
      return {
        ...state,
        items: {
          ...state.items,
          [id]: newQty
        }
      };
    }

    case "CLEAR":
      return { ...state, items: {} };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart:v2");
      if (raw) {
        const data = JSON.parse(raw);
        dispatch({ type: "HYDRATE", payload: data });
      }
    } catch (e) {
      console.warn("Failed to load cart from localStorage:", e);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cart:v2", JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save cart to localStorage:", e);
    }
  }, [state]);

  const api = useMemo(() => {
    const itemEntries = Object.entries(state.items).filter(([, qty]) => qty > 0);
    
    return {
      items: state.items,
      itemEntries,
      count: itemEntries.reduce((sum, [, qty]) => sum + qty, 0),
      
      // Main functions
      add: (productId, qty = 1) => {
        // Handle both product object and productId
        const id = typeof productId === 'object' ? productId.id : productId;
        const product = typeof productId === 'object' ? productId : { id };
        
        if (!id) {
          console.warn("Cannot add item: no product ID provided", productId);
          return;
        }
        
        console.log('Adding to cart:', { id, qty, product });
        
        dispatch({ 
          type: "ADD_ITEM", 
          payload: { product: { ...product, id }, qty } 
        });
        
        console.log('Cart state after add:', state);
      },
      
      addItem: (product, qty = 1) => {
        if (!product?.id) {
          console.warn("Cannot add item: invalid product", product);
          return;
        }
        dispatch({ type: "ADD_ITEM", payload: { product, qty } });
      },
      
      remove: (productId) => {
        dispatch({ type: "REMOVE_ITEM", payload: productId });
      },
      
      removeItem: (productId) => {
        dispatch({ type: "REMOVE_ITEM", payload: productId });
      },
      
      setQty: (productId, qty) => {
        dispatch({ type: "SET_QTY", payload: { id: productId, qty } });
      },
      
      clear: () => {
        dispatch({ type: "CLEAR" });
      },
      
      // Helper functions
      formatMoney: (amount) => {
        return new Intl.NumberFormat('sv-SE', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(Number(amount) || 0);
      }
    };
  }, [state]);

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}