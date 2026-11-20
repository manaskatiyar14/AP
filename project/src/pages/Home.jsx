import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../api';
import { normalizeCategory, skills } from '../lib/skills';

export default function Home() {
  const [counts, setCounts] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api('/questions/summary'), api('/questions')])
      .then(([summary, questions]) => {
        if (!active) return;
        const bySkill = Object.fromEntries(skills.map((skill) => [skill.name, { total: 0, easy: 0, medium: 0, hard: 0 }]));
        summary.forEach((row) => {
          const category = normalizeCategory(row.category);
          if (bySkill[category]) {
            bySkill[category].total += Number(row.count);
            bySkill[category][row.difficulty] = Number(row.count);
          }
        });
        setCounts(bySkill);
        setFeatured(questions.slice(0, 3));
      })
      .catch((error) => { if (active) setLoadError(error.message); });
    return () => { active = false; };
  }, []);

  const totalQuestions = counts ? Object.values(counts).reduce((sum, item) => sum + item.total, 0) : null;

  return (
    <main className="home-page">
      <Navbar />
      <section className="sf-hero">
        <div className="sf-hero-copy">
          <p className="sf-kicker"><span /> PRACTISE WITH PURPOSE</p>
          <h1>Discover your potential.<br /><em>Train your mind.</em><br />Measure your growth.</h1>
          <p className="sf-hero-lede">Test your reasoning, sharpen how you solve problems, and learn where to focus next through structured practice.</p>
          <div className="sf-hero-actions">
            <Link className="sf-button sf-button-primary" to="/assessments">Start assessment <span aria-hidden="true">↗</span></Link>
            <a className="sf-button sf-button-secondary" href="#skills">Explore skills <span aria-hidden="true">↓</span></a>
          </div>
          <p className="sf-hero-note">Practice results reflect your saved answers. SkillForge is a learning tool, not a clinical assessment.</p>
        </div>
        <div className="sf-hero-art" aria-label="Six connected cognitive skill areas">
          <div className="sf-orbit sf-orbit-one" /><div className="sf-orbit sf-orbit-two" />
          <div className="sf-orbit-center"><span>SF</span><small>THINK<br />BETTER</small></div>
          <span className="sf-orbit-node node-a">∑</span><span className="sf-orbit-node node-b">◎</span><span className="sf-orbit-node node-c">◇</span><span className="sf-orbit-node node-d">↗</span><span className="sf-orbit-node node-e">◈</span><span className="sf-orbit-node node-f">⌘</span>
          <div className="sf-art-caption"><b>Six ways to grow</b><span>One focused session at a time</span></div>
        </div>
      </section>

      <section className="sf-intro sf-section-wrap">
        <div><p className="sf-kicker">A PRACTICE SYSTEM FOR CURIOUS MINDS</p><h2>Better thinking is built,<br />one challenge at a time.</h2></div>
        <p>SkillForge brings reasoning challenges and honest progress tracking together. Explore a skill, answer at your own pace, and use explanations to decide what to practise next.</p>
      </section>

      <section className="sf-skills sf-section-wrap" id="skills">
        <div className="sf-section-heading"><div><p className="sf-kicker">YOUR SKILL MAP</p><h2>Choose a direction</h2><p>Each area includes a mix of difficulty levels. Counts come from the question bank.</p></div><span className="sf-total-count">{totalQuestions === null ? '—' : totalQuestions.toLocaleString()}<small>questions available</small></span></div>
        <div className="sf-skill-grid">
          {skills.map((skill, index) => {
            const stat = counts?.[skill.name];
            return <Link className={`sf-skill-card ${skill.color}`} to={`/problems?category=${encodeURIComponent(skill.name)}`} key={skill.name}>
              <div className="sf-skill-card-top"><span className="sf-skill-icon">{skill.icon}</span><span className="sf-skill-index">0{index + 1}</span></div>
              <h3>{skill.name}</h3><p>{skill.description}</p>
              <div className="sf-difficulty-line"><span>{stat ? `${stat.total} questions` : counts ? 'No questions yet' : 'Count unavailable'}</span><span>{stat ? `${stat.easy}E · ${stat.medium}M · ${stat.hard}H` : '—'}</span></div>
              <span className="sf-card-link">Explore skill <b>↗</b></span>
            </Link>;
          })}
        </div>
        {loadError && <p className="sf-data-note" role="status">Question totals are unavailable: {loadError}</p>}
      </section>

      <section className="sf-method">
        <div className="sf-section-wrap"><div className="sf-section-heading"><div><p className="sf-kicker">A SIMPLE LOOP</p><h2>Learn by doing</h2></div></div>
          <div className="sf-method-grid"><article><span>01</span><h3>Try a challenge</h3><p>Pick a category and difficulty that matches your curiosity.</p></article><article><span>02</span><h3>Understand the why</h3><p>Review the answer and explanation after each submission.</p></article><article><span>03</span><h3>Notice your patterns</h3><p>Your dashboard uses saved attempts to show progress over time.</p></article></div>
        </div>
      </section>

      <section className="sf-featured sf-section-wrap"><div className="sf-section-heading"><div><p className="sf-kicker">FROM THE QUESTION BANK</p><h2>Featured challenges</h2></div><Link to="/problems" className="sf-inline-link">Browse all questions ↗</Link></div>
        {featured.length ? <div className="sf-featured-list">{featured.map((question) => <Link to={`/problem/${question.id}`} className="sf-featured-row" key={question.id}><span>{normalizeCategory(question.category)}</span><b>{question.title}</b><small>{question.difficulty}</small><i>↗</i></Link>)}</div> : <p className="sf-empty-copy">{loadError ? 'Question bank could not be loaded.' : 'No questions are available yet.'}</p>}
      </section>

      <section className="sf-progress-preview"><div className="sf-section-wrap sf-preview-inner"><div><p className="sf-kicker">GROWTH YOU CAN SEE</p><h2>Your progress should be<br />grounded in your practice.</h2><p>Once you start answering, SkillForge tracks real attempts, accuracy, category patterns, and practice days. Unattempted skills stay unassessed.</p><Link className="sf-button sf-button-light" to="/dashboard">View your dashboard ↗</Link></div><div className="sf-preview-chart" aria-label="Illustration of skill progress tracking"><div className="sf-chart-labels"><span>SKILL SIGNAL</span><span>BASED ON SAVED ANSWERS</span></div><div className="sf-chart-grid"><div className="sf-chart-line line-one"/><div className="sf-chart-line line-two"/><div className="sf-chart-line line-three"/><svg viewBox="0 0 440 180" role="img" aria-label="An illustrative chart outline, no user data shown"><path d="M10 148 C60 140 68 110 112 122 S170 92 214 104 S265 66 306 80 S370 35 430 40" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="6 7"/><circle cx="112" cy="122" r="4"/><circle cx="214" cy="104" r="4"/><circle cx="306" cy="80" r="4"/><circle cx="430" cy="40" r="4"/></svg></div><p>Illustrative only · your chart uses your actual submissions</p></div></div></section>

      <section className="sf-why sf-section-wrap"><p className="sf-kicker">THINKING IS A PRACTICE</p><h2>Curiosity over labels.<br /><em>Progress over guesses.</em></h2><p>SkillForge reports how you performed on its questions. It does not claim to measure a person's full intelligence or emotional ability. Use each result as a prompt for reflection and focused practice.</p></section>
      <footer className="sf-footer"><Link to="/" className="sf-footer-brand"><span>✦</span> SkillForge</Link><span>Practice with purpose.</span><div><Link to="/problems">Practice</Link><Link to="/assessments">Assessments</Link><Link to="/login">Sign in</Link></div><small>© {new Date().getFullYear()} SkillForge</small></footer>
    </main>
  );
}
