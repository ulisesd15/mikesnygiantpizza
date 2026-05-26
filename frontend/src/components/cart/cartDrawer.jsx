// frontend/src/components/cart/cartDrawer.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useCart, CartProvider } from './cartContext.jsx';

function CartDrawerComponent() {
  const {
    cart = [],
    cartCount = 0,
    cartTotal = 0,
    updateCartQuantity,
    removeFromCart,
  } = useCart();

  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    window.toggleCart = toggleCart;
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.updateCheckoutButton = () => {};

    return () => {
      delete window.toggleCart;
      delete window.openCart;
      delete window.closeCart;
      delete window.updateCheckoutButton;
    };
  }, [toggleCart, openCart, closeCart]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeCart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const renderCheckoutButton = () => {
    if (cartCount === 0) {
      return (
        <button
          disabled
          style={{
            width: '100%',
            padding: '1rem',
            background: '#ccc',
            color: '#666',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'not-allowed',
          }}
        >
          Cart is Empty
        </button>
      );
    }

    return (
      <button
        onClick={() => window.goToCheckout?.()}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #28a745, #20c997)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        🛒 Proceed to Checkout
      </button>
    );
  };

  return (
    <>
      <div
        id="cart-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: isOpen ? 'block' : 'none',
          backdropFilter: 'blur(2px)',
        }}
        onClick={closeCart}
      />

      <div
        id="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          width: 'min(400px, 100vw)',
          maxWidth: '100vw',
          height: '100dvh',
          background: 'white',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s ease',
          zIndex: 2001,
          padding: '1rem',
          overflowY: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem',
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#ff6b35',
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
            }}
          >
            🛍️ Shopping Cart
          </h2>

          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              width: '40px',
              height: '40px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          id="cart-items"
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '1rem',
            minHeight: 0,
          }}
        >
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '2rem 1rem' }}>
              Your cart is empty 🍕
            </p>
          ) : (
            cart.map((item, index) => {
              const qty = item.quantity || 1;
              const unitPrice =
                item.linePrice && qty ? item.linePrice / qty : item.price || item.basePrice || 0;

              const itemKey =
                item.cartItemId ||
                `${item.id || item.menuItemId || 'item'}-${index}`;

              const itemIdForActions = item.cartItemId ?? item.id ?? item.menuItemId;

              return (
                <div
                  key={itemKey}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem 0',
                    borderBottom: '1px solid #eee',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <h4
                      style={{
                        margin: '0 0 0.25rem',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.name} {item.size ? `(${item.size})` : ''}
                    </h4>

                    <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>
                      ${Number(unitPrice || 0).toFixed(2)}
                    </p>

                    {item.addedToppings?.length > 0 && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#28a745',
                          marginTop: '0.35rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        + {item.addedToppings.map((t) => t.name).join(', ')}
                      </div>
                    )}

                    {item.removedToppings?.length > 0 && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: '#dc3545',
                          marginTop: '0.25rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        − {item.removedToppings.map((t) => t.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button
                      onClick={() => updateCartQuantity?.(itemIdForActions, qty - 1)}
                      style={{
                        width: 36,
                        height: 36,
                        border: '1px solid #ddd',
                        background: 'white',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      −
                    </button>

                    <span
                      style={{
                        minWidth: 24,
                        textAlign: 'center',
                        fontWeight: 'bold',
                      }}
                    >
                      {qty}
                    </span>

                    <button
                      onClick={() => updateCartQuantity?.(itemIdForActions, qty + 1)}
                      style={{
                        width: 36,
                        height: 36,
                        border: '1px solid #ddd',
                        background: 'white',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeFromCart?.(itemIdForActions)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '2px solid #eee',
            background: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1rem',
              fontSize: '1.1rem',
              flexWrap: 'wrap',
            }}
          >
            <strong>Subtotal:</strong>
            <strong style={{ color: '#28a745' }}>${Number(cartTotal || 0).toFixed(2)}</strong>
          </div>

          <div id="checkout-btn">{renderCheckoutButton()}</div>
        </div>
      </div>

      <button
        id="cart-toggle"
        onClick={openCart}
        aria-label="Open cart"
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          width: '60px',
          height: '60px',
          background: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
          zIndex: 1999,
          transition: 'all 0.3s',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🛍️
        <span
          id="cart-count"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#dc3545',
            color: 'white',
            borderRadius: '50%',
            minWidth: '24px',
            height: '24px',
            padding: '0 6px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            lineHeight: 1,
          }}
        >
          {cartCount}
        </span>
      </button>
    </>
  );
}

export function renderCartDrawer() {
  return `<div id="react-cart-root"></div>`;
}

export function initCartDrawer() {
  const container = document.getElementById('react-cart-root');
  if (!container) {
    console.error('❌ react-cart-root not found');
    return;
  }

  const root = createRoot(container);
  root.render(
    <CartProvider>
      <CartDrawerComponent />
    </CartProvider>
  );
}

export { CartDrawerComponent as CartDrawer };