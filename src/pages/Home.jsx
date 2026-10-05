import Navbar from '../components/Navbar'

function Home() {
  return (
    <main className="home-page">
      <Navbar />
      <section className="home-hero">
        <div className="home-badge">
          ✦ PROBLEM SOLVING & COGNITIVE GROWTH
        </div>

        <h1 className="home-title">
          Know Your Ability.
          <br />
          <span className="home-title-highlight">Improve It.</span>
        </h1>

        <p className="home-description">
          Challenge yourself, discover your strengths, and improve every day.
        </p>

        <div className="home-actions">
          <button className="home-primary-button">
            Start Your Journey →
          </button>

          <button className="home-secondary-button">
            Learn More
          </button>
        </div>
      </section>

      <section className="home-mastery">

        <div className="home-section-header">
          <p className="home-section-label">
            A CLEAR, DELIBERATE PATHWAY
          </p>

          <h2 className="home-section-title">
            The Science of Mastery
          </h2>
        </div>

        <div className="home-cards">

          <div className="home-card">
            <div className="home-card-icon">✓</div>

            <p className="home-card-phase">Phase 01</p>

            <h3 className="home-card-title">Test</h3>

            <p className="home-card-description">
              Assess your problem-solving baseline across core disciplines
              without timer anxiety or clutter.
            </p>

            <span className="home-card-footer">
              Precision Diagnostics
            </span>
          </div>

          <div className="home-card">
            <div className="home-card-icon">♧</div>

            <p className="home-card-phase">Phase 02</p>

            <h3 className="home-card-title">Learn</h3>

            <p className="home-card-description">
              Target the underlying concepts behind mistakes and dissolve
              cognitive bottlenecks step by step.
            </p>

            <span className="home-card-footer">
              Root-Cause Clarification
            </span>
          </div>

          <div className="home-card">
            <div className="home-card-icon">↗</div>

            <p className="home-card-phase">Phase 03</p>

            <h3 className="home-card-title">Improve</h3>

            <p className="home-card-description">
              Reinforce with focused practice, track intuitive leaps, and
              watch your confidence grow over time.
            </p>

            <span className="home-card-footer">
              Continuous Improvement
            </span>
          </div>

        </div>
      </section>

      <section className="home-quote">

        <div className="home-quote-mark">“</div>

        <p className="home-quote-text">
          Clarity is not the absence of difficulty,
          but the presence of deliberate structure.
        </p>

        <p className="home-quote-author">
          COGNITIVE FOUNDATIONS MANIFESTO
        </p>

      </section>

      <footer className="home-footer">

        <div className="home-footer-brand">
          <strong>● SkillForge</strong>
          <span>© 2025 SkillForge Learning Inc.</span>
        </div>

        <div className="home-footer-links">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>

      </footer>

    </main>
  )
}

export default Home