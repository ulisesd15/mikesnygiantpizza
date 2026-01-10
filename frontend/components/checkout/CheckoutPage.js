// frontend/components/checkout/CheckoutPage.js
import { getCart, getCartTotal, clearCart } from '../../utils/cartStore.js';

let checkoutData = {
  orderType: 'delivery',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  deliveryAddress: '',
  deliveryInstructions: '',
  paymentMethod: 'cash'
};

export function renderCheckoutPage() {
  const cart = getCart();
  const subtotal = getCartTotal();
  const tax = subtotal * 0.0825; // 8.25% tax
  const deliveryFee = checkoutData.orderType === 'delivery' ? 3.99 : 0;
  const total = subtotal + tax + deliveryFee;

  return `
    <div style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="color: #ff6b35; margin: 0 0 0.5rem;">🛍️ Checkout</h1>
        <p style="color: #666; margin: 0;">Review your order and complete your purchase</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem;">
        <!-- Left Column: Forms -->
        <div>
          <!-- Order Type Selection -->
          <div class="checkout-section">
            <h2 class="section-title">🚚 Order Type</h2>
            <div style="display: flex; gap: 1rem;">
              <label class="radio-card ${checkoutData.orderType === 'delivery' ? 'active' : ''}" onclick="window.selectOrderType('delivery')">
                <input type="radio" name="orderType" value="delivery" ${checkoutData.orderType === 'delivery' ? 'checked' : ''} style="display: none;">
                <div style="text-align: center;">
                  <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚚</div>
                  <div style="font-weight: 600;">Delivery</div>
                  <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">$3.99 fee</div>
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

          <!-- Customer Information -->
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

          <!-- Delivery Address -->
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

          <!-- Payment Method -->
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

        <!-- Right Column: Order Summary -->
        <div>
          <div class="checkout-section" style="position: sticky; top: 2rem;">
            <h2 class="section-title">📋 Order Summary</h2>
            
            <!-- Cart Items -->
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
              ${cart.length === 0 ? `
                <div style="text-align: center; padding: 2rem; color: #999;">
                  <p>Your cart is empty</p>
                  <button onclick="window.showTab('menu')" style="background: #ff6b35; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">Back to Menu</button>
                </div>
              ` : cart.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: start; padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5;">
                  <div style="flex: 1;">
                    <div style="font-weight: 600; color: #333;">${item.name}</div>
                    ${item.size ? `<div style="font-size: 0.85rem; color: #666;">${item.size}</div>` : ''}
                    <div style="font-size: 0.85rem; color: #666;">$${item.price} × ${item.quantity}</div>
                  </div>
                  <div style="font-weight: 600; color: #28a745;">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Price Breakdown -->
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

            <!-- Place Order Button -->
            <button 
              id="place-order-btn"
              onclick="window.placeOrder()" 
              style="width: 100%; background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 1.25rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);"
              ${cart.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
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
  
  // Pre-fill customer info if logged in
  if (window.currentUser) {
    checkoutData.customerName = window.currentUser.name || window.currentUser.email.split('@')[0];
    checkoutData.customerEmail = window.currentUser.email || '';
    checkoutData.customerPhone = window.currentUser.phone || '';
    checkoutData.deliveryAddress = window.currentUser.address || '';
  }

  // Global functions
  window.selectOrderType = (type) => {
    checkoutData.orderType = type;
    const deliverySection = document.getElementById('delivery-section');
    if (deliverySection) {
      deliverySection.style.display = type === 'delivery' ? 'block' : 'none';
    }
    
    // Update radio cards
    document.querySelectorAll('.radio-card').forEach(card => {
      card.classList.remove('active');
    });
    const activeCard = Array.from(document.querySelectorAll('.radio-card')).find(card => 
      card.querySelector(`[value="${type}"]`)
    );
    if (activeCard) activeCard.classList.add('active');
    
    // Re-render to update totals
    const checkoutTab = document.getElementById('checkout-tab');
    if (checkoutTab) {
      checkoutTab.innerHTML = renderCheckoutPage();
      initCheckout();
    }
  };

  window.updateCheckoutField = (field, value) => {
    checkoutData[field] = value;
    console.log(`Updated ${field}:`, value);
  };

  window.placeOrder = async () => {
    console.log('📦 Placing order...', checkoutData);
    
    // Validation
    if (!checkoutData.customerName.trim()) {
      alert('⚠️ Please enter your name');
      document.getElementById('customerName')?.focus();
      return;
    }
    if (!checkoutData.customerPhone.trim()) {
      alert('⚠️ Please enter your phone number');
      document.getElementById('customerPhone')?.focus();
      return;
    }
    if (!checkoutData.customerEmail.trim()) {
      alert('⚠️ Please enter your email');
      document.getElementById('customerEmail')?.focus();
      return;
    }
    if (checkoutData.orderType === 'delivery' && !checkoutData.deliveryAddress.trim()) {
      alert('⚠️ Please enter your delivery address');
      document.getElementById('deliveryAddress')?.focus();
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      alert('⚠️ Your cart is empty!');
      return;
    }

    // Disable button
    const btn = document.getElementById('place-order-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🔄 Processing...';
    }

    try {
      // Prepare order data
      const subtotal = getCartTotal();
      const tax = subtotal * 0.0825;
      const deliveryFee = checkoutData.orderType === 'delivery' ? 3.99 : 0;
      const total = subtotal + tax + deliveryFee;

      // ✅ BUILD ORDER DATA WITH CUSTOMER INFO
      const orderData = {
        orderType: checkoutData.orderType,
        customerName: checkoutData.customerName.trim(),      // ✅ Send this
        customerEmail: checkoutData.customerEmail.trim(),    // ✅ Send this
        customerPhone: checkoutData.customerPhone.trim(),    // ✅ Send this
        deliveryAddress: checkoutData.orderType === 'delivery' ? checkoutData.deliveryAddress.trim() : null,
        deliveryInstructions: checkoutData.deliveryInstructions.trim() || null,
        paymentMethod: checkoutData.paymentMethod,
        items: cart.map(item => ({
          menuItemId: item.id,
          name: item.name,
          size: item.size || null,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || null
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        deliveryFee: parseFloat(deliveryFee.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        estimatedTime: 35
      };

      console.log('📤 Sending order to backend:', orderData);

      // ✅ SEND TO BACKEND API
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const result = await response.json();
      const order = result.order || result.data;

      console.log('✅ Order created successfully:', order);

      // Clear cart
      clearCart();

      // Show confirmation
      window.showOrderConfirmation(order);

    } catch (error) {
      console.error('❌ Order failed:', error);
      alert(`❌ Failed to place order: ${error.message}\n\nPlease check that the backend is running and try again.`);
      
      if (btn) {
        btn.disabled = false;
        btn.textContent = `📦 Place Order`;
      }
    }
  };

  console.log('✅ Checkout initialized');
}
