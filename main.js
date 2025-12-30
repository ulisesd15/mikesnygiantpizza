// main.js - Replace entirely
document.title = 'Mike\'s NY Giant Pizza';

fetch('/api/health')
  .then(r => r.json())
  .then(data => {
    document.body.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto; text-align: center; font-family: system-ui;">
        <h1 style="color: #ff6b35; font-size: 3rem;">🍕 Mike's NY Giant Pizza</h1>
        <p style="font-size: 1.2rem; color: #333;">
          <strong>✅ Backend Connected!</strong><br>
          Status: <span style="color: green;">${data.status}</span><br>
          Message: ${data.message}
        </p>
        <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <h3>🎉 Stage 1 Complete!</h3>
          <p>Ready for Stage 2: Database + Sequelize</p>
        </div>
      </div>
    `;
  })
  .catch(err => {
    document.body.innerHTML = `
      <div style="padding: 2rem; max-width: 800px; margin: 0 auto; text-align: center;">
        <h1 style="color: #e74c3c;">❌ Backend Error</h1>
        <p>${err.message}</p>
        <p>Check: backend running on port 5001?</p>
      </div>
    `;
  });
