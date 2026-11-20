import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <p className="not-found-eyebrow">SKILLFORGE</p>

        <h1>Page not found</h1>

        <p>The page you’re looking for doesn’t exist or may have moved.</p>

        <Link to="/" className="not-found-link">
          Back to Home →
        </Link>
      </section>
    </main>
  );
}

export default NotFound;
