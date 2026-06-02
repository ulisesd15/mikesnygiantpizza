// frontend/src/components/cart/CartContext.jsx

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getInitialCart,
  buildCartItem,
  persistCart,
  getCartCount,
  getCartTotal,
  setMenuItems,
  showToast,
} from './cartStore.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getInitialCart());

  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  const addToCart = (itemOrConfig) => {
    setCart((prev) => {
      const next = buildCartItem(itemOrConfig, prev);

      if (next !== prev) {
        showToast('Added item to cart! 🛍️');
      }

      return next;
    });
  };

  const updateCartQuantity = (itemId, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }

      return prev.map((item) => {
        if (item.id !== itemId) return item;

        const extra = item.addedToppings?.reduce((sum, t) => sum + Number(t.price || 0), 0) || 0;
        const unitPrice = Number(item.basePrice || 0) + extra;

        return {
          ...item,
          quantity,
          linePrice: unitPrice * quantity,
        };
      });
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = useMemo(() => {
    return {
      cart,
      cartCount: getCartCount(cart),
      cartTotal: getCartTotal(cart),
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      setMenuItems,
    };
  }, [cart]);

  useEffect(() => {
    window.addToCart = addToCart;
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    window.clearCart = clearCart;
    window.setMenuItems = setMenuItems;
    window.getCart = () => cart;
    window.getCartCount = () => getCartCount(cart);
    window.getCartTotal = () => getCartTotal(cart);
  }, [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}