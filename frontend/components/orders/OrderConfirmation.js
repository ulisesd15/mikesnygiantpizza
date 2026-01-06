// frontend/components/orders/OrderConfirmation.js

export function renderOrderConfirmation(order) {
  // Default mock order if none provided
  if (!order) {
    order = {
      id: '12345',
      orderNumber: 'ORD-12345',
      status: 'pending',
      orderType: 'delivery',
      customerName: 'John Doe',
      customerPhone: '(555) 123-4567',
      customerEmail: 'john@example.com',
      deliveryAddress: '123 Main St, Apt 4B',
      paymentMethod: 'cash',
      items: [
        { name: 'Greek Pizza', size: '16"', quantity: 1, price: 16.99 },
        { name: 'Buffalo Wings', size: '10pc', quantity: 1, price: 10.99 }
      ],
      subtotal: 27.98,
      tax: 2.31,
      deliveryFee: 3.99,
      total: 34.28,
      estimatedTime: 35,
      createdAt: new Date().toISOString()
    };
  }

  const statusSteps = [
    { key: 'pending', label: 'Order Received', icon: '✅', active: true },
    { key: 'preparing', label: 'Preparing', icon: '🍳', active: order.status === 'preparing' || order.status === 'ready' || order.status === 'completed' },
    { key: 'ready', label: order.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup', icon: order.orderType === 'delivery' ? '🚚' : '🏪', active: order.status === 'ready' || order.status === 'completed' },
    { key: 'completed', label: 'Completed', icon: '🎉', active: order.status === 'completed' }
  ];

  return `
    <div style="max-width: 900px; margin: 0 auto; padding: 2rem;">
      <!-- Success Header -->
      <div style="text-align: center; margin-bottom: 3rem;">
        <div class="success-checkmark">
          <div class="check-icon">
            <span class="icon-line line-tip"></span>
            <span class="icon-line line-long"></span>
            <div class="icon-circle"></div>
            <div class="icon-fix"></div>
          </div>
        </div>
        <h1 style="color: #28a745; margin: 1rem 0 0.5rem; font-size: 2rem;">✅ Order Confirmed!</h1>
        <p style="color: #666; font-size: 1.1rem; margin: 0;">Thank you for your order, ${order.customerName}!</p>
      </div>

      <!-- Order Number Card -->
      <div style="background: linear-gradient(135deg, #ff6b35, #ff8c61); color: white; padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);">
        <p style="margin: 0 0 0.5rem; font-size: 0.9rem; opacity: 0.9;">Order Number</p>
        <h2 style="margin: 0; font-size: 2rem; letter-spacing: 2px;">${order.orderNumber}</h2>
        <p style="margin: 1rem 0 0; font-size: 0.95rem;">
          🕒 Estimated ${order.orderType === 'delivery' ? 'Delivery' : 'Pickup'} Time: <strong>${order.estimatedTime}-${order.estimatedTime + 10} minutes</strong>
        </p>
      </div>

      <!-- Status Tracker -->
      <div style="background: white; border: 1px solid #ddd; border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
        <h2 style="margin: 0 0 1.5rem; color: #333;">📍 Order Status</h2>
        <div class="status-tracker">
          ${statusSteps.map((step, index) => `
            <div class="status-step ${step.active ? 'active' : ''}">
              <div class="step-icon">${step.icon}</div>
              <div class="step-line" style="${index === statusSteps.length - 1 ? 'display: none;' : ''}"></div>
              <div class="step-label">${step.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Order Details -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem; color: #333;">📋 Order Details</h3>
          
          <div class="detail-row">
            <span class="detail-label">👤 Name:</span>
            <span>${order.customerName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📞 Phone:</span>
            <span>${order.customerPhone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📧 Email:</span>
            <span>${order.customerEmail}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🚚 Type:</span>
            <span style="text-transform: capitalize;">${order.orderType}</span>
          </div>
          ${order.orderType === 'delivery' ? `
            <div class="detail-row">
              <span class="detail-label">📍 Address:</span>
              <span>${order.deliveryAddress}</span>
            </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">💵 Payment:</span>
            <span style="text-transform: capitalize;">${order.paymentMethod}</span>
          </div>
        </div>

        <!-- Order Items -->
        <div style="background: white; border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem;">
          <h3 style="margin: 0 0 1rem; color: #333;">🍕 Items Ordered</h3>
          <div style="max-height: 250px; overflow-y: auto;">
            ${order.items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5;">
                <div>
                  <div style="font-weight: 600;">${item.name}</div>
                  ${item.size ? `<div style="font-size: 0.85rem; color: #666;">${item.size}</div>` : ''}
                  <div style="font-size: 0.85rem; color: #666;">$${item.price} × ${item.quantity}</div>
                </div>
                <div style="font-weight: 600; color: #28a745;">$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #ddd;">
            <div class="price-row">
              <span>Subtotal:</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="price-row">
              <span>Tax:</span>
              <span>$${order.tax.toFixed(2)}</span>
            </div>
            ${order.deliveryFee > 0 ? `
              <div class="price-row">
                <span>Delivery Fee:</span>
                <span>$${order.deliveryFee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="price-row" style="font-size: 1.25rem; font-weight: bold; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #ddd;">
              <span>Total:</span>
              <span style="color: #28a745;">$${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button 
          onclick="window.trackOrder('${order.id}')" 
          style="flex: 1; background: #007bff; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;"
        >
          📍 Track Order
        </button>
        <button 
          onclick="window.showTab('menu')" 
          style="flex: 1; background: #6c757d; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;"
        >
          🍕 Order More
        </button>
      </div>

      <!-- Help Text -->
      <div style="text-align: center; margin-top: 2rem; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0; color: #666;">
          💬 Need help? Call us at <strong>(555) 123-4567</strong> or email <strong>info@mikespizza.com</strong>
        </p>
      </div>
    </div>

    <style>
      /* Success Checkmark Animation */
      .success-checkmark {
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }
      .check-icon {
        width: 80px;
        height: 80px;
        position: relative;
        border-radius: 50%;
        box-sizing: content-box;
        border: 4px solid #28a745;
      }
      .check-icon::before {
        top: 3px;
        left: -2px;
        width: 30px;
        transform-origin: 100% 50%;
        border-radius: 100px 0 0 100px;
      }
      .check-icon::after {
        top: 0;
        left: 30px;
        width: 60px;
        transform-origin: 0 50%;
        border-radius: 0 100px 100px 0;
        animation: rotate-circle 4.25s ease-in;
      }
      .icon-line {
        height: 5px;
        background-color: #28a745;
        display: block;
        border-radius: 2px;
        position: absolute;
        z-index: 10;
      }
      .icon-line.line-tip {
        top: 46px;
        left: 14px;
        width: 25px;
        transform: rotate(45deg);
        animation: icon-line-tip 0.75s;
      }
      .icon-line.line-long {
        top: 38px;
        right: 8px;
        width: 47px;
        transform: rotate(-45deg);
        animation: icon-line-long 0.75s;
      }
      .icon-circle {
        top: -4px;
        left: -4px;
        z-index: 10;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        position: absolute;
        box-sizing: content-box;
        border: 4px solid rgba(40, 167, 69, 0.5);
      }
      .icon-fix {
        top: 8px;
        width: 5px;
        left: 26px;
        z-index: 1;
        height: 85px;
        position: absolute;
        transform: rotate(-45deg);
        background-color: white;
      }
      @keyframes icon-line-tip {
        0% { width: 0; left: 1px; top: 19px; }
        54% { width: 0; left: 1px; top: 19px; }
        70% { width: 50px; left: -8px; top: 37px; }
        84% { width: 17px; left: 21px; top: 48px; }
        100% { width: 25px; left: 14px; top: 45px; }
      }
      @keyframes icon-line-long {
        0% { width: 0; right: 46px; top: 54px; }
        65% { width: 0; right: 46px; top: 54px; }
        84% { width: 55px; right: 0px; top: 35px; }
        100% { width: 47px; right: 8px; top: 38px; }
      }

      /* Status Tracker */
      .status-tracker {
        display: flex;
        justify-content: space-between;
        position: relative;
      }
      .status-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }
      .step-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        transition: all 0.3s;
        z-index: 2;
      }
      .status-step.active .step-icon {
        background: #28a745;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
        transform: scale(1.1);
      }
      .step-line {
        position: absolute;
        top: 30px;
        left: 50%;
        width: 100%;
        height: 3px;
        background: #e9ecef;
        z-index: 1;
      }
      .status-step.active .step-line {
        background: #28a745;
      }
      .step-label {
        font-size: 0.85rem;
        color: #666;
        text-align: center;
        font-weight: 500;
      }
      .status-step.active .step-label {
        color: #28a745;
        font-weight: 600;
      }

      /* Detail Rows */
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f5f5f5;
      }
      .detail-label {
        font-weight: 600;
        color: #666;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        color: #666;
      }

      @media (max-width: 768px) {
        .status-tracker {
          flex-direction: column;
          gap: 1rem;
        }
        .step-line {
          display: none;
        }
      }
    </style>
  `;
}

export function initOrderConfirmation() {
  console.log('📦 Initializing order confirmation...');

  window.trackOrder = (orderId) => {
    console.log('📍 Tracking order:', orderId);
    // TODO: Navigate to order tracking page
    alert(`Tracking order ${orderId}...`);
  };

  console.log('✅ Order confirmation initialized');
}
