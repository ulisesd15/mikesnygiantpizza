import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import * as CartStore from './cartStore.js';

const CartContext = createContext(null);

function getSnapshot() {
  return {
    cart: CartStore.getCart(),
    cartCount: CartStore.getCartCount(),
    cartTotal: CartStore.getCartTotal(),
  };
}

export function CartProvider({ children }) {
  const snapshot = useSyncExternalStore(
    CartStore.subscribe,
    getSnapshot,
    getSnapshot
  );

  const value = useMemo(() => ({
    ...snapshot,
    addToCart: CartStore.addToCart,
    updateCartQuantity: CartStore.updateCartQuantity,
    removeFromCart: CartStore.removeFromCart,
    clearCart: CartStore.clearCart,
    setMenuItems: CartStore.setMenuItems,
    renderCart: CartStore.renderCart,
  }), [snapshot]);

  useEffect(() => {
    window.addToCart = CartStore.addToCart;
    window.updateCartQuantity = CartStore.updateCartQuantity;
    window.removeFromCart = CartStore.removeFromCart;
    window.getCartCount = CartStore.getCartCount;
    window.getCart = CartStore.getCart;
    window.getCartTotal = CartStore.getCartTotal;
    window.clearCart = CartStore.clearCart;
    CartStore.updateCartCount();
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