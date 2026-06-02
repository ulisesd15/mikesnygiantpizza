// frontend/src/components/cart/cartDrawer.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CartProvider, useCart } from './cartContext.jsx';



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
        <button disabled className="cart-checkout-btn is-disabled">
          Cart is Empty
        </button>
      );
    }

    return (
      <button
        onClick={() => window.goToCheckout?.()}
        className="cart-checkout-btn"
      >
        Proceed to Checkout
      </button>
    );
  };

  return (
    <>
      <div
        id="cart-overlay"
        className={`cart-overlay ${isOpen ? 'is-open' : ''}`}
        onClick={closeCart}
      />

      <aside
        id="cart-drawer"
        className={`cart-drawer ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <header className="cart-drawer-header">
          <div>
            <p className="cart-eyebrow">Your order</p>
            <h2 className="cart-drawer-title">Shopping Cart</h2>
          </div>

          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="cart-close-btn"
          >
            ×
          </button>
        </header>

        <div id="cart-items" className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon">🍕</div>
              <h3>Your cart is empty</h3>
              <p>Add a pizza, wings, pasta, or dessert to get started.</p>
            </div>
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
                <article key={itemKey} className="cart-item-card">
                  <div className="cart-item-main">
                    <div className="cart-item-icon">🍕</div>

                    <div className="cart-item-info">
                      <h4>
                        {item.name} {item.size ? `(${item.size})` : ''}
                      </h4>

                      <p className="cart-item-price">
                        ${Number(unitPrice || 0).toFixed(2)}
                      </p>

                      {item.addedToppings?.length > 0 && (
                        <p className="cart-item-added">
                          + {item.addedToppings.map((t) => t.name).join(', ')}
                        </p>
                      )}

                      {item.removedToppings?.length > 0 && (
                        <p className="cart-item-removed">
                          − {item.removedToppings.map((t) => t.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="cart-item-actions">
                    <div className="cart-qty-control">
                      <button
                        onClick={() => updateCartQuantity?.(itemIdForActions, qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span>{qty}</span>

                      <button
                        onClick={() => updateCartQuantity?.(itemIdForActions, qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart?.(itemIdForActions)}
                      className="cart-remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="cart-footer">
          <div className="cart-subtotal-row">
            <span>Subtotal</span>
            <strong>${Number(cartTotal || 0).toFixed(2)}</strong>
          </div>

          <div id="checkout-btn">
            {renderCheckoutButton()}
          </div>
        </footer>
      </aside>

      <button
        id="cart-toggle"
        className="cart-toggle"
        onClick={toggleCart}
        type="button"
        aria-label={`Open cart with ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        aria-expanded={isOpen}
        aria-controls="cart-drawer"
      >
        <span className="cart-toggle-label">
          <span>Cart</span>
          <strong>${Number(cartTotal || 0).toFixed(2)}</strong>
        </span>

        <span
          id="cart-count"
          className={`cart-count-badge ${cartCount === 0 ? 'is-empty' : ''}`}
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