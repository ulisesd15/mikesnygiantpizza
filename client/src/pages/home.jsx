function Home() {
  const specials = [
    {
      title: "2 Large Pizzas for $19.99",
      description: "Online only. Limited time offer!",
    },
    {
      title: "Free Garlic Knots with Any XL Pizza",
      description: "Order online and get a free side!",
    },
  ];
  return (
    <div style={{ fontFamily: 'sans-serif', background: 'linear-gradient(120deg, #fff8f0 60%, #ffd6d6 100%)', minHeight: '100vh' }}>
      <header style={{ background: '#d7263d', color: '#fff', padding: '3rem 0 2rem 0', textAlign: 'center', boxShadow: '0 2px 8px #0002' }}>
        <h1 style={{ fontSize: '3.5rem', margin: 0, letterSpacing: '2px', fontWeight: 900 }}>Mike's NY Giant Pizza</h1>
        <p style={{ fontSize: '1.3rem', marginTop: '1rem', fontWeight: 500 }}>Best pizza in town, made fresh daily!</p>
      </header>
      <section style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem' }}>
        <h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Location</h2>
        <p style={{ fontSize: '1.1rem', margin: 0 }}>123 Main St, New York, NY 10001</p>
        <p style={{ fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>Open daily: 11am - 11pm</p>
      </section>
      <section style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem' }}>
        <h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Online Specials</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {specials.map((special, idx) => (
            <li key={idx} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
              <strong style={{ fontSize: '1.2rem' }}>{special.title}</strong>
              <div style={{ color: '#555', marginTop: '0.5rem' }}>{special.description}</div>
            </li>
          ))}
        </ul>
      </section>
      <section style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Order Online</h2>
        <button style={{ background: '#d7263d', color: '#fff', border: 'none', borderRadius: 10, padding: '1rem 2.5rem', fontSize: '1.2rem', cursor: 'pointer', marginRight: '1rem', fontWeight: 600, boxShadow: '0 2px 8px #d7263d22' }}>
          Start Order
        </button>
        <button style={{ background: '#fff', color: '#d7263d', border: '2px solid #d7263d', borderRadius: 10, padding: '1rem 2.5rem', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #d7263d11' }}>
          Login
        </button>
      </section>
      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#888', fontSize: '1rem', paddingBottom: '1rem' }}>
        &copy; {new Date().getFullYear()} Mike's NY Giant Pizza
      </footer>
    </div>
  );
}

export default Home;
