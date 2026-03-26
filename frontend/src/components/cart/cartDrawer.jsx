// frontend/src/components/cart/cartDrawer.jsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useCart } from './cartContext';

function CartDrawerComponent() {
  const { cart, cartCount, cartTotal, updateCartQuantity, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const toggleCart = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    window.toggleCart = toggleCart;
    window.updateCheckoutButton = () => {};
  }, []);

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
        id="cart-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? '0px' : '-460px',
          width: '400px',
          height: '100vh',
          background: 'white',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
          transition: 'right 0.3s',
          zIndex: 1000,
          padding: '2rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, color: '#ff6b35' }}>🛍️ Shopping Cart</h2>
          <button
            onClick={toggleCart}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        <div id="cart-items" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', marginBottom: '1rem' }}>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Your cart is empty 🍕</p>
          ) : (
            cart.map((item) => {
              const qty = item.quantity || 1;
              const unitPrice =
                item.linePrice && qty ? item.linePrice / qty : item.price || item.basePrice || 0;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem' }}>
                      {item.name} {item.size ? `(${item.size})` : ''}
                    </h4>
                    <p style={{ margin: 0, color: '#28a745', fontWeight: 'bold' }}>
                      ${unitPrice.toFixed(2)}
                    </p>

                    {item.addedToppings?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#28a745' }}>
                        + {item.addedToppings.map((t) => t.name).join(', ')}
                      </div>
                    )}

                    {item.removedToppings?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: '#dc3545' }}>
                        − {item.removedToppings.map((t) => t.name).join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => updateCartQuantity(item.id, qty - 1)}
                      style={{ width: 32, height: 32, border: '1px solid #ddd', background: 'white', borderRadius: 4 }}
                    >
                      −
                    </button>

                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold' }}>{qty}</span>

                    <button
                      onClick={() => updateCartQuantity(item.id, qty + 1)}
                      style={{ width: 32, height: 32, border: '1px solid #ddd', background: 'white', borderRadius: 4 }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: '#dc3545', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: 4 }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem' }}>
            <strong>Subtotal:</strong>
            <strong style={{ color: '#28a745' }}>${cartTotal.toFixed(2)}</strong>
          </div>
          <div id="checkout-btn">{renderCheckoutButton()}</div>
        </div>
      </div>

      <button
        id="cart-toggle"
        onClick={toggleCart}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          background: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,107,53,0.4)',
          zIndex: 999,
          transition: 'all 0.3s',
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
            width: '24px',
            height: '24px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}
        >
          {cartCount}
        </span>
      </button>

      <div
        id="cart-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          display: isOpen ? 'block' : 'none',
          backdropFilter: 'blur(2px)',
        }}
        onClick={toggleCart}
      />
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
  root.render(<CartDrawerComponent />);
}

export { CartDrawerComponent as CartDrawer };