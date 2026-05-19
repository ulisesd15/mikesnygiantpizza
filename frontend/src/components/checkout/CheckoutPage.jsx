// frontend/components/checkout/CheckoutPage.jsx
import { getCart, getCartTotal, clearCart } from '../cart/cartStore.js';

const TAX_RATE = 0.0825;
const DELIVERY_FEE = 3.99;

let checkoutData = {
  orderType: 'delivery',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  deliveryAddress: '',
  deliveryInstructions: '',
  paymentMethod: 'cash'
};

function getApiUrl(path) {
  return path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
}

function getItemUnitPrice(item) {
  if (typeof item.price === 'number') return item.price;
  if (typeof item.basePrice === 'number') return item.basePrice;
  if (typeof item.linePrice === 'number' && typeof item.quantity === 'number' && item.quantity > 0) {
    return item.linePrice / item.quantity;
  }

  const parsedPrice = parseFloat(item.price);
  if (!Number.isNaN(parsedPrice)) return parsedPrice;

  const parsedBasePrice = parseFloat(item.basePrice);
  if (!Number.isNaN(parsedBasePrice)) return parsedBasePrice;

  return 0;
}

function calculateCheckoutTotals() {
  const subtotal = getCartTotal();
  const tax = subtotal * TAX_RATE;
  const deliveryFee = checkoutData.orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + tax + deliveryFee;

  return {
    subtotal,
    tax,
    deliveryFee,
    total
  };
}

function prefillCheckoutData() {
  if (!window.currentUser) return;

  checkoutData.customerName =
    checkoutData.customerName || window.currentUser.name || window.currentUser.email?.split('@')[0] || '';

  checkoutData.customerEmail =
    checkoutData.customerEmail || window.currentUser.email || '';

  checkoutData.customerPhone =
    checkoutData.customerPhone || window.currentUser.phone || '';

  checkoutData.deliveryAddress =
    checkoutData.deliveryAddress || window.currentUser.address || '';
}

function rerenderCheckout() {
  const checkoutTab = document.getElementById('checkout-tab');
  if (!checkoutTab) return;

  checkoutTab.innerHTML = renderCheckoutPage();
  initCheckout();
}

function validateCheckout() {
  if (!checkoutData.customerName.trim()) {
    alert('⚠️ Please enter your name');
    document.getElementById('customerName')?.focus();
    return false;
  }

  if (!checkoutData.customerPhone.trim()) {
    alert('⚠️ Please enter your phone number');
    document.getElementById('customerPhone')?.focus();
    return false;
  }

  if (!checkoutData.customerEmail.trim()) {
    alert('⚠️ Please enter your email');
    document.getElementById('customerEmail')?.focus();
    return false;
  }

  if (checkoutData.orderType === 'delivery' && !checkoutData.deliveryAddress.trim()) {
    alert('⚠️ Please enter your delivery address');
    document.getElementById('deliveryAddress')?.focus();
    return false;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert('⚠️ Your cart is empty!');
    return false;
  }

  return true;
}

function buildOrderPayload() {
  const cart = getCart();

  const subtotal = getCartTotal();
  const tax = subtotal * 0.0825;
  const deliveryFee = checkoutData.orderType === 'delivery' ? 4.99 : 0;
  const total = subtotal + tax + deliveryFee;

  return {
    orderType: checkoutData.orderType,
    customerName: checkoutData.customerName.trim(),
    customerEmail: (checkoutData.customerEmail || '').trim(),
    customerPhone: checkoutData.customerPhone.trim(),
    deliveryAddress:
      checkoutData.orderType === 'delivery'
        ? (checkoutData.deliveryAddress || '').trim()
        : null,
    deliveryInstructions: (checkoutData.deliveryInstructions || '').trim() || null,
    paymentMethod: checkoutData.paymentMethod || 'cash',
    status: 'pending',
    paymentStatus: 'pending',
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    deliveryFee: parseFloat(deliveryFee.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    totalPrice: parseFloat(total.toFixed(2)),
    items: cart.map((item) => ({
      menuItemId: item.menuItemId || item.id,
      name: item.name,
      size: item.size || null,
      price: parseFloat(item.basePrice ?? item.price ?? 0),
      quantity: parseInt(item.quantity || 1, 10),
      specialInstructions: item.specialInstructions || null,
      addedToppings: Array.isArray(item.addedToppings) ? item.addedToppings : [],
      removedToppings: Array.isArray(item.removedToppings) ? item.removedToppings : []
    }))
  };
}

function extractOrderFromResponse(result) {
  if (result?.order && typeof result.order === 'object') return result.order;
  if (result?.data?.order && typeof result.data.order === 'object') return result.data.order;
  if (result?.data && typeof result.data === 'object' && (result.data.id || result.data.orderNumber)) {
    return result.data;
  }
  return null;
}

export function renderCheckoutPage() {
  prefillCheckoutData();

  const cart = getCart();
  const { subtotal, tax, deliveryFee, total } = calculateCheckoutTotals();
  const isCartEmpty = cart.length === 0;

  return `
    <div style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #ff6b35; margin: 0 0 0.5rem;">🛍️ Checkout</h1>
        <p style="color: #666; margin: 0;">Review your order and complete your purchase</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
        <div>
          <div class="checkout-section">
            <h2 class="section-title">🚚 Order Type</h2>
            <div style="display: flex; gap: 1rem;">
              <label class="radio-card ${checkoutData.orderType === 'delivery' ? 'active' : ''}" onclick="window.selectOrderType('delivery')">
                <input type="radio" name="orderType" value="delivery" ${checkoutData.orderType === 'delivery' ? 'checked' : ''} style="display: none;">
                <div style="text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚚</div>
                  <div style="font-weight: 600;">Delivery</div>
                  <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">$${DELIVERY_FEE.toFixed(2)} fee</div>
                </div>
              </label>

              <label class="radio-card ${checkoutData.orderType === 'pickup' ? 'active' : ''}" onclick="window.selectOrderType('pickup')">
                <input type="radio" name="orderType" value="pickup" ${checkoutData.orderType === 'pickup' ? 'checked' : ''} style="display: none;">
                <div style="text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏪</div>
                  <div style="font-weight: 600;">Pickup</div>
                  <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">No fee</div>
                </div>
              </label>
            </div>
          </div>

          <div class="checkout-section">
            <h2 class="section-title">👤 Customer Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input
                  type="text"
                  id="customerName"
                  class="form-input"
                  placeholder="John Doe"
                  value="${checkoutData.customerName}"
                  oninput="window.updateCheckoutField('customerName', this.value)"
                  required
                >
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input
                  type="tel"
                  id="customerPhone"
                  class="form-input"
                  placeholder="(555) 123-4567"
                  value="${checkoutData.customerPhone}"
                  oninput="window.updateCheckoutField('customerPhone', this.value)"
                  required
                >
              </div>

              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Email Address *</label>
                <input
                  type="email"
                  id="customerEmail"
                  class="form-input"
                  placeholder="john@example.com"
                  value="${checkoutData.customerEmail}"
                  oninput="window.updateCheckoutField('customerEmail', this.value)"
                  required
                >
              </div>
            </div>
          </div>

          <div id="delivery-section" class="checkout-section" style="display: ${checkoutData.orderType === 'delivery' ? 'block' : 'none'};">
            <h2 class="section-title">📍 Delivery Address</h2>
            <div class="form-group">
              <label class="form-label">Street Address *</label>
              <input
                type="text"
                id="deliveryAddress"
                class="form-input"
                placeholder="123 Main St, Apt 4B"
                value="${checkoutData.deliveryAddress}"
                oninput="window.updateCheckoutField('deliveryAddress', this.value)"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Delivery Instructions (Optional)</label>
              <textarea
                id="deliveryInstructions"
                class="form-input"
                placeholder="Ring doorbell, leave at door, etc."
                rows="3"
                oninput="window.updateCheckoutField('deliveryInstructions', this.value)"
              >${checkoutData.deliveryInstructions}</textarea>
            </div>
          </div>

          <div class="checkout-section">
            <h2 class="section-title">💳 Payment Method</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <label class="payment-option active">
                <input type="radio" name="payment" value="cash" checked style="display: none;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="font-size: 2rem;">💵</div>
                  <div>
                    <div style="font-weight: 600;">Cash on Delivery/Pickup</div>
                    <div style="font-size: 0.85rem; color: #666;">Pay with cash when you receive your order</div>
                  </div>
                </div>
              </label>

              <label class="payment-option disabled" style="opacity: 0.5; cursor: not-allowed;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="font-size: 2rem;">💳</div>
                  <div>
                    <div style="font-weight: 600;">Credit/Debit Card</div>
                    <div style="font-size: 0.85rem; color: #666;">Coming soon!</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div>
          <div class="checkout-section" style="position: sticky; top: 2rem;">
            <h2 class="section-title">📋 Order Summary</h2>

            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
              ${isCartEmpty ? `
                <div style="text-align: center; padding: 2rem; color: #999;">
                  <p>Your cart is empty</p>
                  <button onclick="window.showTab('menu')" style="background: #ff6b35; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">Back to Menu</button>
                </div>
              ` : cart.map((item) => {
                const unitPrice = getItemUnitPrice(item);
                const quantity = parseInt(item.quantity || 1, 10);
                const lineTotal = unitPrice * quantity;

                return `
                  <div style="display: flex; justify-content: space-between; align-items: start; padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5;">
                    <div style="flex: 1;">
                      <div style="font-weight: 600; color: #333;">${item.name}</div>
                      ${item.size ? `<div style="font-size: 0.85rem; color: #666;">${item.size}</div>` : ''}
                      ${item.addedToppings?.length ? `<div style="font-size: 0.8rem; color: #28a745;">+ ${item.addedToppings.map(t => t.name).join(', ')}</div>` : ''}
                      ${item.removedToppings?.length ? `<div style="font-size: 0.8rem; color: #dc3545;">No ${item.removedToppings.map(t => t.name).join(', ')}</div>` : ''}
                      <div style="font-size: 0.85rem; color: #666;">$${unitPrice.toFixed(2)} × ${quantity}</div>
                    </div>
                    <div style="font-weight: 600; color: #28a745;">$${lineTotal.toFixed(2)}</div>
                  </div>
                `;
              }).join('')}
            </div>

            <div style="margin-bottom: 1rem;">
              <div class="price-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>
              <div class="price-row">
                <span>Tax (8.25%):</span>
                <span>$${tax.toFixed(2)}</span>
              </div>
              ${checkoutData.orderType === 'delivery' ? `
                <div class="price-row">
                  <span>Delivery Fee:</span>
                  <span>$${deliveryFee.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="price-row" style="border-top: 2px solid #333; padding-top: 0.75rem; margin-top: 0.75rem; font-size: 1.25rem; font-weight: bold;">
                <span>Total:</span>
                <span style="color: #28a745;">$${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              id="place-order-btn"
              onclick="window.placeOrder()"
              style="width: 100%; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 1.25rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: ${isCartEmpty ? 'not-allowed' : 'pointer'}; transition: all 0.3s; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3); opacity: ${isCartEmpty ? '0.5' : '1'};"
              ${isCartEmpty ? 'disabled' : ''}
            >
              📦 Place Order - $${total.toFixed(2)}
            </button>

            <p style="text-align: center; font-size: 0.85rem; color: #666; margin-top: 1rem;">
              By placing this order, you agree to our terms of service
            </p>
          </div>
        </div>
      </div>
    </div>

    <style>
      .checkout-section {
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }
      .section-title {
        margin: 0 0 1rem;
        font-size: 1.3rem;
        color: #333;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
      }
      .form-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #333;
        font-size: 0.9rem;
      }
      .form-input {
        padding: 0.75rem;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        transition: border-color 0.3s;
      }
      .form-input:focus {
        outline: none;
        border-color: #ff6b35;
      }
      .radio-card {
        flex: 1;
        padding: 1.5rem;
        border: 2px solid #ddd;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s;
        background: white;
      }
      .radio-card:hover {
        border-color: #ff6b35;
        background: #fff5f2;
      }
      .radio-card.active {
        border-color: #ff6b35;
        background: #fff5f2;
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
      }
      .payment-option {
        padding: 1rem;
        border: 2px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
      }
      .payment-option.active {
        border-color: #28a745;
        background: #f0fff4;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        color: #666;
      }
      @media (max-width: 968px) {
        .checkout-section:first-child > div {
          grid-template-columns: 1fr !important;
        }
        .form-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
}

export function initCheckout() {
  console.log('🛍️ Initializing checkout...');

  prefillCheckoutData();

  window.selectOrderType = (type) => {
    checkoutData.orderType = type;
    rerenderCheckout();
  };

  window.updateCheckoutField = (field, value) => {
    checkoutData[field] = value;
  };

  window.placeOrder = async () => {
    console.log('📦 Placing order...', checkoutData);

    if (!validateCheckout()) return;

    const btn = document.getElementById('place-order-btn');
    const originalBtnText = btn?.textContent || '📦 Place Order';

    if (btn) {
      btn.disabled = true;
      btn.textContent = '🔄 Processing...';
    }

    try {
      const orderData = buildOrderPayload();
      console.log('📤 Sending order to backend:', orderData);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const result = await response.json().catch(() => ({}));
      console.log('📥 Raw order response:', result);

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to place order');
      }

      const order = extractOrderFromResponse(result);

      if (!order) {
        throw new Error('Order was created but response format was unexpected');
      }

      const normalizedOrder = {
        ...order,
        items: order.items || order.OrderItems || [],
        subtotal: parseFloat(order.subtotal ?? order.subTotal ?? 0),
        tax: parseFloat(order.tax ?? 0),
        deliveryFee: parseFloat(order.deliveryFee ?? 0),
        total: parseFloat(order.total ?? order.totalPrice ?? 0)
      };

      console.log('✅ Order created successfully:', createdOrder);

      clearCart();

      if (typeof window.showOrderConfirmation === 'function') {
        window.showOrderConfirmation(createdOrder);
      } else {
        throw new Error('Order confirmation view is not available');
      }
    } catch (error) {
      console.error('❌ Order failed:', error);
      alert(`❌ Failed to place order: ${error.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalBtnText;
      }
    }
  };

  console.log('✅ Checkout initialized');
}
