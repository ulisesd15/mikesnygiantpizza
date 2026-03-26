// frontend/src/cart/CartContext.jsx
import React, { createContext, useContext, useEffect, useCallback } from 'react';
import * as CartStore from './cartStore.js'

const CartContext = createContext();

export function CartProvider({ children }) {
  // Expose store functions as context values
  const value = {
    cart: CartStore.getCart(),
    cartCount: CartStore.getCartCount(),
    cartTotal: CartStore.getCartTotal(),
    addToCart: CartStore.addToCart,
    updateCartQuantity: CartStore.updateCartQuantity,
    removeFromCart: CartStore.removeFromCart,
    clearCart: CartStore.clearCart,
    setMenuItems: CartStore.setMenuItems,
    renderCart: CartStore.renderCart,  // TEMP until drawer is React
  };

  // Global window exports (for non-React parts)
  useEffect(() => {
    window.addToCart = CartStore.addToCart;
    window.updateCartQuantity = CartStore.updateCartQuantity;
    window.removeFromCart = CartStore.removeFromCart;
    window.getCartCount = CartStore.getCartCount;
    window.getCart = CartStore.getCart;
    window.getCartTotal = CartStore.getCartTotal;
    window.clearCart = CartStore.clearCart;
    CartStore.updateCartCount();  // Initial count
  }, []);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}