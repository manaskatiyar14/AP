import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import { api } from '../api';
import { normalizeCategory, skills } from '../lib/skills';

export default function Problems() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [difficulty, setDifficulty] = useState(() => searchParams.get('difficulty') || '');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api('/questions', { signal: controller.signal })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The questions service returned an unexpected response.');
        setQuestions(data);
      })
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (category) next.set('category', category);
    if (difficulty) next.set('difficulty', difficulty);
    setSearchParams(next, { replace: true });
  }, [category, difficulty, setSearchParams]);

  const filtered = useMemo(() => questions.filter((question) => {
    const matchesCategory = !category || normalizeCategory(question.category) === category;
    const matchesDifficulty = !difficulty || question.difficulty === difficulty;
    const matchesText = !query || `${question.title} ${question.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesText;
  }), [questions, category, difficulty, query]);
  const grouped = skills.map((skill) => ({
    skill,
    questions: filtered.filter((item) => normalizeCategory(item.category) === skill.name)
  })).filter((group) => group.questions.length > 0);

  return <div className="problems-page sf-practice-page"><UserNavbar /><main className="problems-main sf-practice-main">
    <header className="sf-page-heading"><div><p className="sf-kicker">THE QUESTION BANK</p><h1>Practice with intent.</h1><p>Choose a skill, set a difficulty, and work through the questions stored in your database.</p></div><Link to="/assessments" className="sf-button sf-button-primary">Take an assessment ↗</Link></header>
    <div className="sf-filter-bar"><label>Skill <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All skills</option>{skills.map((skill)=><option value={skill.name} key={skill.name}>{skill.name}</option>)}</select></label><label>Difficulty <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label className="sf-search-label">Find a question <input type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search question titles" /></label><span className="sf-result-count">{loading ? 'Loading…' : `${filtered.length} questions`}</span></div>
    {error && <div className="sf-inline-error" role="alert">{error}<button type="button" onClick={()=>window.location.reload()}>Retry</button></div>}
    {loading && <div className="sf-loading-panel" role="status">Loading the database question bank…</div>}
    {!loading && !error && questions.length === 0 && <div className="sf-empty-state"><span>∑</span><h2>No questions stored yet</h2><p>Questions will appear here after the approved seed is applied.</p></div>}
    {!loading && !error && questions.length > 0 && filtered.length === 0 && <div className="sf-empty-state"><span>⌕</span><h2>No matches for these filters</h2><p>Try a different skill, difficulty, or search term.</p><button className="sf-button sf-button-secondary" onClick={()=>{setCategory('');setDifficulty('');setQuery('');}}>Clear filters</button></div>}
    {!loading && grouped.map(({skill, questions: groupQuestions})=><section className="sf-question-group" key={skill.name}><div className="sf-question-group-head"><span className={`sf-skill-icon ${skill.color}`}>{skill.icon}</span><div><h2>{skill.name}</h2><p>{groupQuestions.length} database questions</p></div><Link to={`/assessments?category=${encodeURIComponent(skill.name)}`}>Assess this skill ↗</Link></div><div className="sf-question-grid">{groupQuestions.map((question)=><Link className="sf-question-tile" to={`/problem/${question.id}`} key={question.id}><span className={`sf-difficulty-tag ${question.difficulty}`}>{question.difficulty}</span><b>{question.title}</b><p>{question.description}</p><span className="sf-question-open">Open question <i>↗</i></span></Link>)}</div></section>)}
  </main></div>;
}
