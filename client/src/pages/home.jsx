function Home() {
	return (
		<div style={{ fontFamily: 'sans-serif', background: 'linear-gradient(120deg, #fff8f0 60%, #ffd6d6 100%)', minHeight: '100vh' }}>
			<nav style={{ background: '#d7263d', color: '#fff', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px #0002' }}>
				<span style={{ fontWeight: 'bold', fontSize: '2rem', letterSpacing: '2px' }}>Mike's NY Giant Pizza</span>
				<div>
					<a href="#menu" style={{ color: '#fff', margin: '0 1.5rem', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem' }}>Menu</a>
					<a href="#location" style={{ color: '#fff', margin: '0 1.5rem', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem' }}>Location</a>
					<a href="#delivery" style={{ color: '#fff', margin: '0 1.5rem', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem' }}>Delivery</a>
				</div>
			</nav>
			<header style={{ textAlign: 'center', padding: '4rem 2rem 2rem 2rem' }}>
				<h1 style={{ fontSize: '3.5rem', color: '#d7263d', margin: 0, fontWeight: 900 }}>Welcome to Mike's NY Giant Pizza</h1>
				<p style={{ fontSize: '1.3rem', color: '#333', marginTop: '1rem', fontWeight: 500 }}>Authentic New York-style pizza, made fresh daily!</p>
			</header>
			<section id="menu" style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem' }}>
				<h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Menu</h2>
				<p>Check out our delicious New York-style pizzas and sides!</p>
			</section>
			<section id="location" style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem' }}>
				<h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Location</h2>
				<p style={{ fontSize: '1.1rem', margin: 0 }}>123 Main St, New York, NY 10001</p>
				<p style={{ fontSize: '1.1rem', margin: '0.5rem 0 0 0' }}>Open daily: 11am - 11pm</p>
			</section>
			<section id="delivery" style={{ maxWidth: 600, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #0001', padding: '2.5rem', textAlign: 'center' }}>
				<h2 style={{ color: '#d7263d', fontSize: '2rem', marginBottom: '1rem' }}>Delivery</h2>
				<p style={{ fontSize: '1.1rem' }}>Order online for fast delivery or pickup!</p>
				<button style={{ background: '#d7263d', color: '#fff', border: 'none', borderRadius: 10, padding: '1rem 2.5rem', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #d7263d22', marginTop: '1rem' }}>
					Start Order
				</button>
			</section>
			<footer style={{ textAlign: 'center', marginTop: '3rem', color: '#888', fontSize: '1rem', paddingBottom: '1rem' }}>
				&copy; {new Date().getFullYear()} Mike's NY Giant Pizza
			</footer>
		</div>
	);
}

export default Home;
