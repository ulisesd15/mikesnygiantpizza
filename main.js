// main.js - Replace entirely
document.title = 'Mike\'s NY Giant Pizza';
  fetch('http://localhost:5001/api/health')
    .then(r => r.json())
    .then(data => {
      document.getElementById('app').innerHTML = `
        <div style="color: green;">
          ✅ DIRECT backend works: ${JSON.stringify(data)}
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
