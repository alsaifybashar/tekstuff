import { useState, useContext, createContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const mockCart = {
    items: cartItems,
    subtotal: subtotal,
    totalItems: totalItems
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      console.log('Adding to cart:', productId, quantity);
      
      // Mock product data
      const mockProduct = {
        id: productId,
        name: 'Sample Product',
        price: 29.99,
        slug: 'sample-product',
        stockStatus: 'IN_STOCK',
        images: [
          {
            id: '1',
            url: 'https://via.placeholder.com/200x200',
            alt: 'Sample Product',
            isPrimary: true
          }
        ]
      };

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item => item.product.id === productId);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedItems);
      } else {
        // Add new item
        const newItem = {
          id: Date.now().toString(),
          product: mockProduct,
          quantity: quantity,
          total: mockProduct.price * quantity
        };
        setCartItems([...cartItems, newItem]);
      }

      return { success: true, item: null };
    } catch (error) {
      console.error('Add to cart error:', error);
      return { 
        success: false, 
        message: 'Failed to add item to cart' 
      };
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      console.log('Updating cart item:', productId, quantity);
      
      if (quantity <= 0) {
        return removeFromCart(productId);
      }

      const updatedItems = cartItems.map(item => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: quantity,
            total: item.product.price * quantity
          };
        }
        return item;
      });

      setCartItems(updatedItems);
      return { success: true, item: null };
    } catch (error) {
      console.error('Update cart item error:', error);
      return { 
        success: false, 
        message: 'Failed to update cart item' 
      };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      console.log('Removing from cart:', productId);
      const updatedItems = cartItems.filter(item => item.product.id !== productId);
      setCartItems(updatedItems);
      return { success: true, message: 'Item removed' };
    } catch (error) {
      console.error('Remove from cart error:', error);
      return { 
        success: false, 
        message: 'Failed to remove item from cart' 
      };
    }
  };

  const clearCart = async () => {
    try {
      console.log('Clearing cart');
      setCartItems([]);
      return { success: true, message: 'Cart cleared' };
    } catch (error) {
      console.error('Clear cart error:', error);
      return { 
        success: false, 
        message: 'Failed to clear cart' 
      };
    }
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.product.id === productId);
  };

  const toggleCart = () => setIsOpen(!isOpen);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const value = {
    cart: mockCart,
    loading: false,
    isOpen,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getItemQuantity,
    isInCart,
    toggleCart,
    openCart,
    closeCart,
    refetch: () => Promise.resolve()
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};