import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { api } from '../api';
import { skills, normalizeCategory } from '../lib/skills';

export default function Assessments() {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    let active = true;
    api('/questions/summary').then((data) => { if (active) setSummary(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const preferred = searchParams.get('category');
  const counts = new Map();
  summary.forEach((row) => { const name = normalizeCategory(row.category); counts.set(name, (counts.get(name) || 0) + Number(row.count)); });

  return <div className="sf-page"><UserNavbar /><main className="sf-content"><header className="sf-page-heading"><div><p className="sf-kicker">PRACTICE ASSESSMENTS</p><h1>Set a baseline.<br /><em>Build from there.</em></h1><p>These sessions summarize performance on SkillForge questions. They are not scientifically validated IQ or EQ tests.</p></div></header>
    {error && <div className="sf-inline-error" role="alert">{error}</div>}{loading && <div className="sf-loading-panel" role="status">Checking question availability…</div>}
    <div className="sf-assessment-grid">{skills.map((skill) => { const count = counts.get(skill.name) || 0; return <article className={`sf-assessment-card ${skill.color} ${preferred === skill.name ? 'is-preferred' : ''}`} key={skill.name}><span className="sf-skill-icon">{skill.icon}</span><small>{count} questions available</small><h2>{skill.name}</h2><p>{skill.description}</p><Link className="sf-button sf-button-primary" aria-disabled={!count} to={count ? `/assessment?category=${encodeURIComponent(skill.name)}` : '#'} onClick={(event)=>{if(!count)event.preventDefault();}}>Start assessment ↗</Link></article>; })}</div>
    <section className="sf-assessment-note"><b>How sessions work</b><p>A session selects up to ten available questions with an easy, medium, and hard mix. Each answer is saved to your account. Results summarize your submitted answers and the time spent in this session.</p><Link to="/progress">View progress tracking ↗</Link></section>
  </main></div>;
}
