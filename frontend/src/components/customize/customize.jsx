import { useEffect, useState } from 'react';

export default function CustomizeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [customData, setCustomData] = useState(null);

  useEffect(() => {
    const handleOpen = (event) => {
      setCustomData(event.detail);
      setIsOpen(true);
    };

    window.addEventListener('pizza-customize-open', handleOpen);

    return () => {
      window.removeEventListener('pizza-customize-open', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="customize-modal">
      <button onClick={() => setIsOpen(false)}>Close</button>
      <pre>{JSON.stringify(customData, null, 2)}</pre>
    </div>
  );
}

// Add this new function after the existing pizzaGroupCard function
function customizableItemCard(item) {
  return `
    <div class="menu-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
        <h3 style="color: #ff6b35; margin: 0; font-size: 1.3rem;">${item.name}</h3>
        ${item.size ? `<span style="font-size: 0.85rem; color: #666; font-weight: 500;">${item.size}</span>` : ''}
      </div>
      ${item.description ? `<p style="color: #666; margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.4;">${item.description}</p>` : ''}
      
      <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
        <p style="margin: 0; font-size: 0.85rem; color: #666;">Base Price:</p>
        <p id="item-price-${item.id}" style="font-size: 1.8rem; color: #28a745; font-weight: bold; margin: 0.25rem 0 0;">
          $${parseFloat(item.price || 0).toFixed(2)}
        </p>
      </div>

      <button
        class="add-to-cart-btn"
        data-item-id="${item.id}"
        onclick="window.customizeItemAndAdd(this)"
        style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;"
      >
        ➕ Customize & Add
      </button>
    </div>
  `;
}

// Replace pizzaGroupCard with this universal version
function universalCustomizableCard(items) {
  // Handle both single items and pizza size groups
  const isPizzaGroup = items.length > 1 && items.every(i => i.size);
  const baseItem = isPizzaGroup ? items[0] : items[0];
  
  if (isPizzaGroup) {
    const sortedSizes = [...items].sort((a, b) => {
      const sizeOrder = { '14"': 1, '16"': 2, '20"': 3, '28"': 4 };
      return (sizeOrder[a.size] || 99) - (sizeOrder[b.size] || 99);
    });
    
    const defaultSize = sortedSizes.find(s => s.size === '16"') || sortedSizes[0];
    
    return `
      <div class="menu-card">
        <h3 style="color: #ff6b35; margin: 0 0 0.5rem; font-size: 1.3rem;">${baseItem.name}</h3>
        <p style="color: #666; margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.4;">${baseItem.description || ''}</p>

        <div style="margin: 1rem 0;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333; font-size: 0.9rem;">Select Size:</label>
          <select class="size-selector" data-item-id="${baseItem.id}" onchange="window.updateItemPrice(this)"
            style="width: 100%; padding: 0.75rem; border: 2px solid #ff6b35; border-radius: 8px; background: white; font-size: 1rem; font-weight: 500;">
            ${sortedSizes.map(size => `
              <option value="${size.id}" data-price="${size.price}" ${size.id === defaultSize.id ? 'selected' : ''}>
                ${size.size} - $${parseFloat(size.price || 0).toFixed(2)}
              </option>
            `).join('')}
          </select>
        </div>

        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
          <p style="margin: 0; font-size: 0.85rem; color: #666;">Price:</p>
          <p id="item-price-${baseItem.id}" style="font-size: 2rem; color: #28a745; font-weight: bold; margin: 0.25rem 0 0;">
            $${parseFloat(defaultSize.price || 0).toFixed(2)}
          </p>
        </div>

        <button class="add-to-cart-btn" data-item-id="${baseItem.id}" onclick="window.customizeItemAndAdd(this)"
          style="width: 100%; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer;">
          ➕ Customize & Add
        </button>
      </div>
    `;
  }
  
  return customizableItemCard(baseItem);
}

// NEW: Universal customization modal HTML
function renderCustomizationModal(data, itemInfo) {
  const { mandatory = [], optional = [], itemPrices = {} } = data;
  const basePrice = parseFloat(itemInfo.basePrice || itemInfo.price || 0);
  
  return `
    <div id="custom-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div style="background: white; border-radius: 16px; max-width: 500px; max-height: 90vh; width: 100%; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
        <!-- Header -->
        <div style="padding: 1.5rem; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; color: #ff6b35; font-size: 1.5rem;">Customize ${itemInfo.name}</h2>
            <button onclick="window.closeCustomModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; padding: 0;">×</button>
          </div>
          ${itemInfo.size ? `<p style="margin: 0.5rem 0 0; color: #666; font-size: 0.95rem;">${itemInfo.size}</p>` : ''}
        </div>

        <!-- Ingredients -->
        <div style="padding: 1.5rem;">
          <!-- Mandatory Ingredients (removable) -->
          ${mandatory.length ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem; color: #dc3545; font-size: 1.1rem; display: flex; align-items: center;">
                <span style="width: 6px; height: 6px; background: #dc3545; border-radius: 50%; margin-right: 0.5rem;"></span>
                Original Ingredients (Remove if desired)
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;">
                ${mandatory.map(t => ingredientCheckbox(t, 'mandatory', itemPrices)).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Optional Ingredients -->
          ${optional.length ? `
            <div>
              <h4 style="margin: 0 0 0.75rem; color: #28a745; font-size: 1.1rem; display: flex; align-items: center;">
                <span style="width: 6px; height: 6px; background: #28a745; border-radius: 50%; margin-right: 0.5rem;"></span>
                Add Extras (+$${Object.values(itemPrices).filter(p => p > 0)[0] || 0})
              </h4>
              <div style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem;">
                  ${optional.map(t => ingredientCheckbox(t, 'optional', itemPrices)).join('')}
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Price & Buttons -->
        <div style="padding: 1.5rem; border-top: 1px solid #eee; background: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 1rem;">
            <p style="margin: 0 0 0.5rem; font-size: 0.9rem; color: #666;">Total Price:</p>
            <p id="custom-total-price" style="font-size: 2rem; color: #28a745; font-weight: bold; margin: 0;">
              $${basePrice.toFixed(2)}
            </p>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button onclick="window.closeCustomModal()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer;">
              Cancel
            </button>
            <button id="add-custom-item" data-item-id="${itemInfo.id}" style="flex: 1; background: #ff6b35; color: white; border: none; padding: 1rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .ingredient-checkbox {
        display: flex; flex-direction: column; align-items: center; padding: 0.75rem; 
        border: 2px solid #eee; border-radius: 8px; background: white; cursor: pointer;
        transition: all 0.2s; text-align: center; min-height: 80px;
      }
      .ingredient-checkbox:hover { border-color: #ff6b35; transform: translateY(-2px); }
      .ingredient-checkbox.selected { border-color: #ff6b35; background: #fff5f2; }
      .ingredient-checkbox input { display: none; }
      .ingredient-checkbox .checkmark {
        width: 20px; height: 20px; border: 2px solid #ddd; border-radius: 4px; 
        margin: 0 auto 0.25rem; position: relative; transition: all 0.2s;
      }
      .ingredient-checkbox.selected .checkmark { background: #ff6b35; border-color: #ff6b35; }
      .ingredient-checkbox.selected .checkmark::after {
        content: '✓'; color: white; font-size: 12px; font-weight: bold;
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      }
      .ingredient-price { font-size: 0.8rem; color: #28a745; font-weight: 500; }
    </style>
  `;
}

function ingredientCheckbox(topping, group, itemPrices) {
  const price = itemPrices[topping.id] || 0;
  const isChecked = group === 'mandatory'; // Mandatory start checked
  
  return `
    <label class="ingredient-checkbox ${isChecked ? 'selected' : ''}" data-topping-id="${topping.id}" data-group="${group}" data-price="${price}">
      <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.updateCustomPrice()">
      <div class="checkmark"></div>
      <div style="font-weight: 500; font-size: 0.85rem; margin-bottom: 0.25rem; max-height: 2.5em; overflow: hidden;">${topping.name}</div>
      ${price > 0 ? `<div class="ingredient-price">+$${price.toFixed(2)}</div>` : ''}
    </label>
  `;
}

// Update render functions to use universal cards
function renderPizzaSection(pizzas) {
  if (!pizzas?.length) return '';
  
  const pizzaGroups = {};
  pizzas.forEach(pizza => {
    const key = `${pizza.name}|${pizza.description || ''}`;
    if (!pizzaGroups[key]) pizzaGroups[key] = [];
    pizzaGroups[key].push(pizza);
  });
  
  return `
    <div class="menu-section">
      <div class="menu-section-title">
        <h2>🍕 Our Pizzas</h2>
        <p>Choose your favorite pizza and customize!</p>
      </div>
      <div class="menu-grid">
        ${Object.values(pizzaGroups).map(universalCustomizableCard).join('')}
      </div>
    </div>
  `;
}

// Update other category renderers to use customizable cards
function renderCategorySection(title, items, subtitle = '', compact = false) {
  if (!items?.length) return '';
  
  // Group items that should have customization (pizzas, subs, calzones, etc.)
  const customizableCategories = ['pizza', 'sub', 'calzone', 'combo'];
  const currentCat = window.currentCategory || 'all';
  
  const needsCustomization = customizableCategories.includes(currentCat) || 
    items.some(item => item.category === 'pizza' || item.category === 'sub');
  
  const gridClass = compact ? 'compact-grid' : 'menu-grid';
  const cardClass = compact ? 'compact-card' : '';
  
  const cards = needsCustomization 
    ? items.map(universalCustomizableCard).join('')
    : items.map(item => singleItemCard(item, cardClass)).join('');

  return `
    <div class="menu-section">
      <div class="menu-section-title" style="background: linear-gradient(135deg, #007bff, #0056b3);">
        <h2>${title}</h2>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
      <div class="${gridClass}">
        ${cards}
      </div>
    </div>
  `;
}