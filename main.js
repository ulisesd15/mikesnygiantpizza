document.title = 'Mike\'s NY Giant Pizza - Stage 2';

// async function loadApp() {
//   // Health check first
//   const health = await fetch('/api/health').then(r => r.json());
  
//   // Sync DB
//   await fetch('/api/db-sync');
  
//   // Load menu
//   const menu = await fetch('/api/menu').then(r => r.json());
  
//   document.getElementById('app').innerHTML = `
//     <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
//       <h1 style="color: #ff6b35; text-align: center; font-size: 3rem;">🍕 Mike's NY Giant Pizza</h1>
      
//       <div style="background: #d4edda; color: #155724; padding: 1rem; border-radius: 8px; margin: 2rem 0; text-align: center;">
//         <h2>✅ STAGE 2 COMPLETE!</h2>
//         <p>DB: ${health.message} | Menu items: ${menu.length || 0}</p>
//       </div>
      
//       <h2 style="color: #333;">📋 Menu (${menu.length || 0} items)</h2>
//       <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
//         ${menu.map(item => `
//           <div style="border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
//             <h3 style="color: #ff6b35; margin: 0 0 0.5rem;">${item.name || 'New Item'}</h3>
//             <p style="color: #666; margin: 0 0 1rem;">${item.category || 'Uncategorized'}</p>
//             <p style="font-size: 1.5rem; font-weight: bold; color: #28a745;">$${item.price || 0}</p>
//             ${item.description ? `<p style="color: #888; margin-top: 1rem;">${item.description}</p>` : ''}
//             <button style="background: #ff6b35; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; margin-top: 1rem;">
//               Add to Cart
//             </button>
//           </div>
//         `).join('')}
//       </div>
      
//       <div style="text-align: center; margin-top: 3rem; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
//         <h3>🎯 Next: Stage 3 - User Authentication</h3>
//         <p>Register/Login for customers + admins</p>
//       </div>
//     </div>
//   `;
// }

// Replace main.js fetch section:
async function loadApp() {
  await fetch('/api/db-sync');  // Create tables
  
  const menu = await fetch('/api/menu').then(r => r.json());
  
  document.getElementById('app').innerHTML = `
    <div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="color: #ff6b35; text-align: center;">🍕 Mike's NY Giant Pizza</h1>
      <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin: 2rem 0;">
        <h2>✅ STAGE 2: Database Ready!</h2>
        <p>6 Models: User, Menu, Order, Inventory | Tables: ${menu.length} items</p>
      </div>
      <h2>📋 Menu (Add items in Stage 4)</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; min-height: 200px;">
        ${menu.length ? menu.map(item => `<div>$${item.price} ${item.name}</div>`).join('') : 
          '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #666;">Menu empty - Ready for Stage 4!</div>'}
      </div>
    </div>
  `;
}

loadApp();
