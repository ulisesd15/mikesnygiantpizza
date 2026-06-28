// frontend/components/orders/OrderConfirmation.js

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function toMoney(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num;
    }
  }
  return 0;
}

function normalizeOrder(rawOrder) {
  if (!rawOrder) {
    return {
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
        { name: 'Greek Pizza', size: '16"', quantity: 1, price: 16.99, addedToppings: [], removedToppings: [] },
        { name: 'Buffalo Wings', size: '10pc', quantity: 1, price: 10.99, addedToppings: [], removedToppings: [] }
      ],
      subtotal: 27.98,
      tax: 2.31,
      deliveryFee: 3.99,
      total: 34.28,
      estimatedTime: 35,
      createdAt: new Date().toISOString()
    };
  }

  const container = rawOrder?.data?.order
    ? rawOrder.data.order
    : rawOrder?.order
      ? rawOrder.order
      : rawOrder?.data
        ? rawOrder.data
        : rawOrder;

  const source = container || {};

  const items = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.orderItems)
      ? source.orderItems
      : Array.isArray(source.OrderItems)
        ? source.OrderItems
        : Array.isArray(source.data?.items)
          ? source.data.items
          : [];

  const itemsSubtotal = items.reduce((sum, item) => {
    const quantity = firstFiniteNumber(item?.quantity, 1);

    const unitPrice = firstFiniteNumber(
      item?.price,
      item?.unitPrice,
      item?.MenuItem?.price,
      item?.menuItem?.price,
      0
    );

    return sum + (quantity * unitPrice);
  }, 0);

  const rawDeliveryFee = firstFiniteNumber(
    source.deliveryFee,
    source.fee,
    source.delivery_charge,
    source.deliveryCharge,
    source.delivery_amount,
    source.shippingFee
  );

  const rawTax = firstFiniteNumber(
    source.tax,
    source.taxAmount,
    source.tax_amount
  );

  const rawSubtotal = firstFiniteNumber(
    source.subtotal,
    source.subTotal,
    source.sub_total
  );

  const rawTotal = firstFiniteNumber(
    source.total,
    source.totalPrice,
    source.total_price,
    source.grandTotal,
    source.amount
  );

  let subtotal = rawSubtotal > 0 ? rawSubtotal : itemsSubtotal;
  let tax = rawTax > 0 ? rawTax : 0;
  let deliveryFee = rawDeliveryFee > 0 ? rawDeliveryFee : 0;
  let total = rawTotal > 0 ? rawTotal : subtotal + tax + deliveryFee;

  if (subtotal <= 0 && total > 0) {
    subtotal = Math.max(total - tax - deliveryFee, 0);
  }

  if (total <= 0) {
    total = subtotal + tax + deliveryFee;
  }

  const explicitOrderTypeRaw = firstNonEmpty(source.orderType, source.type);
  const explicitOrderType =
    typeof explicitOrderTypeRaw === 'string'
      ? explicitOrderTypeRaw.toLowerCase().trim()
      : '';

  const deliveryAddress = firstNonEmpty(
    source.deliveryAddress,
    source.address,
    source.delivery_address
  );

  const paymentMethod = firstNonEmpty(
    source.paymentMethod,
    source.paymentType,
    source.payment_method,
    'cash'
  );

  const estimatedTime = firstFiniteNumber(
    source.estimatedTime,
    source.estimatedMinutes,
    source.eta,
    35
  );

  const inferredOrderType =
    explicitOrderType ||
    (deliveryAddress ? 'delivery' : '') ||
    (deliveryFee > 0 ? 'delivery' : '') ||
    'pickup';

  const normalizedStatus = firstNonEmpty(source.status, 'pending');

  return {
    ...source,
    id: firstNonEmpty(source.id, source.orderId, ''),
    orderNumber: firstNonEmpty(
      source.orderNumber,
      source.order_number,
      source.id ? `#${source.id}` : '#New Order'
    ),
    status: normalizedStatus,
    orderType: inferredOrderType,
    customerName: firstNonEmpty(
      source.customerName,
      source.name,
      source.User?.name,
      source.user?.name,
      'Customer'
    ),
    customerPhone: firstNonEmpty(
      source.customerPhone,
      source.phone,
      source.User?.phone,
      source.user?.phone,
      'N/A'
    ),
    customerEmail: firstNonEmpty(
      source.customerEmail,
      source.email,
      source.User?.email,
      source.user?.email,
      'N/A'
    ),
    deliveryAddress: deliveryAddress || '',
    paymentMethod,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    total: Number(total.toFixed(2)),
    estimatedTime: Number(estimatedTime) > 0 ? Number(estimatedTime) : 35,
    createdAt: firstNonEmpty(source.createdAt, new Date().toISOString())
  };
}

function renderToppingChanges(item) {
  const added = Array.isArray(item?.addedToppings) ? item.addedToppings : [];
  const removed = Array.isArray(item?.removedToppings) ? item.removedToppings : [];

  if (!added.length && !removed.length) return '';

  return `
    <div style="margin-top: 0.35rem; display: flex; flex-direction: column; gap: 0.2rem;">
      ${added.length ? `
        <div style="font-size: 0.8rem; color: #28a745;">
          + ${added.map(t => escapeHtml(t?.name)).join(', ')}
        </div>
      ` : ''}
      ${removed.length ? `
        <div style="font-size: 0.8rem; color: #dc3545;">
          - ${removed.map(t => escapeHtml(t?.name)).join(', ')}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderOrderConfirmation(order) {
  
  const safeOrder = normalizeOrder(order);

  console.log('RAW ORDER CONFIRMATION ORDER:', order);
  console.log('ORDER CONFIRMATION SOURCE CHECK:', {
    topLevelOrder: order?.order,
    dataOrder: order?.data?.order,
    data: order?.data,
    topLevelOrderType: order?.orderType,
    nestedOrderType: order?.order?.orderType,
    dataOrderType: order?.data?.order?.orderType,
    deliveryFee: order?.deliveryFee,
    nestedDeliveryFee: order?.order?.deliveryFee,
    dataDeliveryFee: order?.data?.order?.deliveryFee,
    total: order?.total,
    nestedTotal: order?.order?.total,
    dataTotal: order?.data?.order?.total
  });
  console.log('NORMALIZED ORDER CONFIRMATION:', safeOrder);

  const statusSteps = [
    {
      key: 'pending',
      label: 'Order Received',
      icon: '🧾',
      active: ['pending', 'accepted', 'preparing', 'ready', 'completed'].includes(safeOrder.status)
    },
    {
      key: 'accepted',
      label: 'Accepted',
      icon: '👍',
      active: ['accepted', 'preparing', 'ready', 'completed'].includes(safeOrder.status)
    },
    {
      key: 'preparing',
      label: 'Preparing',
      icon: '🍳',
      active: ['preparing', 'ready', 'completed'].includes(safeOrder.status)
    },
    {
      key: 'ready',
      label: safeOrder.orderType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup',
      icon: safeOrder.orderType === 'delivery' ? '🚚' : '🏪',
      active: ['ready', 'completed'].includes(safeOrder.status)
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: '🎉',
      active: safeOrder.status === 'completed'
    }
  ];

  return `
    <div class="order-confirmation-wrap">
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
        <p style="color: #666; font-size: 1.1rem; margin: 0;">
          Thank you for your order, ${escapeHtml(safeOrder.customerName)}!
        </p>
      </div>

      <div class="order-hero-card">
        <p style="margin: 0 0 0.5rem; font-size: 0.9rem; opacity: 0.9;">Order Number</p>
        <h2 style="margin: 0; font-size: 2rem; letter-spacing: 2px;">
          ${escapeHtml(safeOrder.orderNumber || '#New Order')}
        </h2>
        <p style="margin: 1rem 0 0; font-size: 0.95rem;">
          🕒 Estimated ${safeOrder.orderType === 'delivery' ? 'Delivery' : 'Pickup'} Time:
          <strong>${safeOrder.estimatedTime}-${safeOrder.estimatedTime + 10} minutes</strong>
        </p>
      </div>

      <div class="card-block">
        <h2 style="margin: 0 0 1.5rem; color: #333;">📍 Order Status</h2>
        <div class="status-tracker">
          ${statusSteps.map((step, index) => `
            <div class="status-step ${step.active ? 'active' : ''}">
              <div class="step-icon">${step.icon}</div>
              <div class="step-line" style="${index === statusSteps.length - 1 ? 'display: none;' : ''}"></div>
              <div class="step-label">${escapeHtml(step.label)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="details-grid">
        <div class="card-block">
          <h3 style="margin: 0 0 1rem; color: #333;">📋 Order Details</h3>

          <div class="detail-row">
            <span class="detail-label">👤 Name:</span>
            <span>${escapeHtml(safeOrder.customerName)}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📞 Phone:</span>
            <span>${escapeHtml(safeOrder.customerPhone)}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">📧 Email:</span>
            <span>${escapeHtml(safeOrder.customerEmail)}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">🚚 Type:</span>
            <span style="text-transform: capitalize;">${escapeHtml(safeOrder.orderType)}</span>
          </div>

          ${safeOrder.orderType === 'delivery' ? `
            <div class="detail-row">
              <span class="detail-label">📍 Address:</span>
              <span>${escapeHtml(safeOrder.deliveryAddress || 'N/A')}</span>
            </div>
          ` : ''}

          <div class="detail-row">
            <span class="detail-label">💵 Payment:</span>
            <span style="text-transform: capitalize;">${escapeHtml(safeOrder.paymentMethod)}</span>
          </div>
        </div>

        <div class="card-block">
          <h3 style="margin: 0 0 1rem; color: #333;">🍕 Items Ordered</h3>

          <div style="max-height: 250px; overflow-y: auto;">
            ${safeOrder.items.length ? safeOrder.items.map(item => {
              const price = firstFiniteNumber(
                item?.price,
                item?.unitPrice,
                item?.menuItem?.price,
                item?.MenuItem?.price,
                0
              );
              const quantity = firstFiniteNumber(item?.quantity, 1);

              return `
                <div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5;">
                  <div style="min-width: 0;">
                    <div style="font-weight: 600;">${escapeHtml(item?.name || item?.MenuItem?.name || item?.menuItem?.name || 'Item')}</div>
                    ${item?.size ? `<div style="font-size: 0.85rem; color: #666;">${escapeHtml(item.size)}</div>` : ''}
                    <div style="font-size: 0.85rem; color: #666;">
                      $${formatMoney(price)} × ${quantity}
                    </div>
                    ${renderToppingChanges(item)}
                  </div>
                  <div style="font-weight: 600; color: #28a745; white-space: nowrap;">
                    $${formatMoney(price * quantity)}
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="padding: 1rem 0; color: #666;">No items available.</div>
            `}
          </div>

          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #ddd;">
            <div class="price-row">
              <span>Subtotal:</span>
              <span>$${formatMoney(safeOrder.subtotal)}</span>
            </div>

            <div class="price-row">
              <span>Tax:</span>
              <span>$${formatMoney(safeOrder.tax)}</span>
            </div>

            ${safeOrder.orderType === 'delivery' || safeOrder.deliveryFee > 0 ? `
              <div class="price-row">
                <span>Delivery Fee:</span>
                <span>$${formatMoney(safeOrder.deliveryFee)}</span>
              </div>
            ` : ''}

            <div class="price-row total-row">
              <span>Total:</span>
              <span>$${formatMoney(safeOrder.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-row">
        <button
          onclick="window.trackOrder('${String(safeOrder.id ?? '')}')"
          class="confirmation-btn primary"
        >
          📍 Track Order
        </button>

        <button
          onclick="window.showTab('menu')"
          class="confirmation-btn secondary"
        >
          🍕 Order More
        </button>
      </div>

      <div class="help-box">
        <p style="margin: 0; color: #666;">
          💬 Need help? Call us at <strong>(555) 123-4567</strong> or email <strong>info@mikespizza.com</strong>
        </p>
      </div>
    </div>

    <style>
      .order-confirmation-wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      .order-hero-card {
        background: linear-gradient(135deg, #ff6b35, #ff8c61);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
      }

      .card-block {
        background: white;
        border: 1px solid #ddd;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
      }

      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      .action-row {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
      }

      .confirmation-btn {
        flex: 1;
        border: none;
        padding: 1rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.3s ease, transform 0.2s ease, opacity 0.2s ease;
      }

      .confirmation-btn:hover {
        transform: translateY(-1px);
        opacity: 0.96;
      }

      .confirmation-btn.primary {
        background: #007bff;
        color: white;
      }

      .confirmation-btn.secondary {
        background: #6c757d;
        color: white;
      }

      .help-box {
        text-align: center;
        margin-top: 2rem;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
      }

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

      .status-tracker {
        display: flex;
        justify-content: space-between;
        position: relative;
        gap: 0.5rem;
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

      .detail-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f5f5f5;
      }

      .detail-label {
        font-weight: 600;
        color: #666;
        flex-shrink: 0;
      }

      .price-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.35rem 0;
        color: #666;
      }

      .total-row {
        font-size: 1.25rem;
        font-weight: 700;
        margin-top: 0.5rem;
        padding-top: 0.75rem;
        border-top: 1px solid #ddd;
        color: #333;
      }

      @media (max-width: 768px) {
        .order-confirmation-wrap {
          padding: 1rem;
        }

        .details-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .status-tracker {
          flex-direction: column;
          gap: 1rem;
        }

        .step-line {
          display: none;
        }

        .action-row {
          flex-direction: column;
        }

        .detail-row,
        .price-row {
          align-items: flex-start;
        }
      }
    </style>
  `;
  
}

export function initOrderConfirmation() {
  console.log('📦 Initializing order confirmation...');

  window.trackOrder = (orderId) => {
    console.log('📍 Tracking order:', orderId);
    alert(`Tracking order ${orderId}...`);
  };

  console.log('✅ Order confirmation initialized');
}
