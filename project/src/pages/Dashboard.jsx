import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, saveStoredUser } from '../api';
import UserNavbar from '../components/UserNavbar';
import { ActivityChart, ActivityHeatmap, SkillRadar } from '../components/ProgressCharts';
import { normalizeCategory, skills } from '../lib/skills';

function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(30);

  useEffect(() => {
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    Promise.all([
      api(`/progress/me?timezone=${encodeURIComponent(timezone)}`),
      api('/submissions/mine?limit=5'),
      api('/users/me'),
    ]).then(([stats, submissions, profile]) => {
      if (!active) return;
      setAnalytics(stats);
      setRecent(submissions.slice(0, 5));
      setUser(profile);
      saveStoredUser(profile);
    }).catch((requestError) => {
      if (active) setError(requestError.message || 'Dashboard data could not be loaded.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const summary = analytics?.summary;
  const categories = analytics?.categories || [];
  const statsBySkill = new Map(categories.map((item) => [item.category, item]));
  const progressToNext = summary && analytics.next_level_at > analytics.level_solved
    ? Math.min(100, analytics.level_solved / analytics.next_level_at * 100) : 100;

  return <div className="dashboard-page sf-dashboard-page">
    <UserNavbar />
    <main className="dashboard-main sf-dashboard-main">
      <header className="sf-dash-hero"><div><p className="sf-kicker">PERSONAL PERFORMANCE</p><h1>{user ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Your cognitive practice'}</h1><p>Your results come from your saved practice. Unassessed skills remain unscored.</p></div><Link className="sf-button sf-button-primary" to="/assessments">Start assessment ↗</Link></header>
      {error && <p className="problems-status problems-error" role="alert">{error}</p>}
      {loading && <div className="sf-loading-panel" role="status">Loading your saved performance…</div>}
      {!loading && analytics && <>
        <section className="sf-overview-grid" aria-label="Practice overview">
          <article className="sf-overview-feature"><span className="sf-stat-icon">✦</span><small>Current streak</small><strong>{analytics.current_streak}<i> days</i></strong><span>Longest: {analytics.longest_streak} days</span></article>
          <article><small>Questions attempted</small><strong>{summary.total_attempted}</strong><span>All submitted answers</span></article>
          <article><small>Correct answers</small><strong>{summary.correct_attempts}</strong><span>{summary.total_solved} unique questions solved</span></article>
          <article><small>Overall accuracy</small><strong>{summary.accuracy_percentage === null ? '—' : `${summary.accuracy_percentage}%`}</strong><span>{summary.total_attempted ? 'Across saved attempts' : 'Not assessed yet'}</span></article>
          <article className="sf-level-card"><div><small>Current level</small><strong>Level {analytics.level}</strong></div><span>{analytics.level_solved} correct unique answers · {analytics.next_level_at} to next level</span><div className="sf-level-track"><i style={{ width: `${progressToNext}%` }} /></div></article>
        </section>

        <section className="sf-dashboard-section"><div className="sf-section-heading"><div><p className="sf-kicker">SIX PRACTICE AREAS</p><h2>Your skill map</h2></div><Link to="/progress" className="sf-inline-link">Detailed progress ↗</Link></div>
          <div className="sf-dashboard-skills">{skills.map((skill) => { const stat = statsBySkill.get(skill.name); const assessed = stat?.attempted > 0; return <article className={`sf-dashboard-skill ${skill.color}`} key={skill.name}><div className="sf-skill-card-top"><span className="sf-skill-icon">{skill.icon}</span><span className="sf-skill-index">{assessed ? `${stat.attempted} tries` : 'NEW'}</span></div><h3>{skill.name}</h3><div className="sf-skill-metric">{assessed ? <><strong>{stat.accuracy_percentage}%</strong><span>accuracy · {stat.correct} correct</span></> : <span className="sf-unassessed">Not assessed yet</span>}</div>{assessed && <div className="sf-mini-track"><i style={{ width: `${stat.accuracy_percentage}%` }} /></div>}<Link to={`/problems?category=${encodeURIComponent(skill.name)}`}>Practise this skill <b>↗</b></Link></article>; })}</div>
        </section>

        <div className="sf-dashboard-panels">
          <section className="sf-data-panel"><div className="sf-section-heading"><div><p className="sf-kicker">CATEGORY ACCURACY</p><h2>Cognitive profile</h2></div></div><SkillRadar categories={categories} /></section>
          <section className="sf-data-panel"><div className="sf-section-heading"><div><p className="sf-kicker">PRACTICE TREND</p><h2>Attempts over time</h2></div><div className="sf-range-switch">{[7, 30, 90].map((days) => <button type="button" className={range === days ? 'active' : ''} onClick={() => setRange(days)} key={days}>{days}d</button>)}</div></div><ActivityChart trend={analytics.trend} days={range} /><p className="sf-panel-note">Daily attempts from your saved submissions. Days without activity stay at zero.</p></section>
        </div>

        <section className="sf-data-panel sf-heat-panel"><div className="sf-section-heading"><div><p className="sf-kicker">LAST 12 WEEKS</p><h2>Your practice rhythm</h2><p>{analytics.practice_days} practice days · {analytics.current_streak}-day current streak</p></div><div className="sf-heat-legend"><span>Less</span>{[0,1,2,3,4].map((i)=><i key={i} className={`sf-heat-cell level-${i}`} />)}<span>More</span></div></div><ActivityHeatmap activity={analytics.activity} /></section>

        <div className="sf-dashboard-panels sf-lower-panels"><section className="sf-data-panel"><div className="sf-section-heading"><div><p className="sf-kicker">WHAT YOUR PRACTICE SAYS</p><h2>Strengths & focus</h2></div></div>{analytics.insights.strongest ? <p><b>Strongest assessed:</b> {analytics.insights.strongest}</p> : <p>Complete at least five questions in a skill to see a reliable strength signal.</p>}{analytics.insights.weakest && <p><b>Lowest assessed:</b> {analytics.insights.weakest}</p>}{analytics.insights.most_improved && <p><b>Most improved:</b> {analytics.insights.most_improved}</p>}{analytics.insights.needing_practice.length > 0 ? <p><b>Focus areas:</b> {analytics.insights.needing_practice.join(', ')}</p> : <p>No assessed skill is below the practice threshold.</p>}{analytics.insights.next_practice ? <p><b>Recommended next:</b> {analytics.insights.next_practice}</p> : null}<Link className="sf-inline-link" to={analytics.insights.next_practice ? `/assessment?category=${encodeURIComponent(analytics.insights.next_practice)}` : '/assessments'}>Start recommended practice ↗</Link></section>
          <section className="sf-data-panel"><div className="sf-section-heading"><div><p className="sf-kicker">MILESTONES</p><h2>Earned achievements</h2></div></div>{analytics.achievements.length ? <div className="sf-badges">{analytics.achievements.map((badge)=><span key={badge}>✦ {badge}</span>)}</div> : <p>Milestones unlock as you practise. Your first ten submitted questions unlock the first badge.</p>}</section></div>

        <section className="sf-data-panel sf-recent-panel"><div className="sf-section-heading"><div><p className="sf-kicker">RECENT ACTIVITY</p><h2>Latest answers</h2></div></div>{recent.length ? <div className="sf-recent-list">{recent.map((item)=><Link to={`/problem/${item.question_id}`} key={item.id}><span className={item.is_correct ? 'sf-result-dot correct' : 'sf-result-dot'}>{item.is_correct ? '✓' : '×'}</span><b>{item.title}</b><small>{normalizeCategory(item.category)} · {item.difficulty}</small><time>{new Date(item.submitted_at).toLocaleDateString()}</time></Link>)}</div> : <p>No saved attempts yet. Start with a short assessment to establish a baseline.</p>}</section>
      </>}
    </main>
  </div>;
}

export default Dashboard;
