import { skills } from '../lib/skills';

export function SkillRadar({ categories = [] }) {
  const stats = new Map(categories.map((item) => [item.category, item]));
  const center = 140;
  const radius = 96;
  const angle = (index) => (-Math.PI / 2) + (index * Math.PI * 2 / skills.length);
  const point = (index, scale) => [center + Math.cos(angle(index)) * radius * scale, center + Math.sin(angle(index)) * radius * scale];
  const assessed = skills.map((skill, index) => ({ skill, index, stat: stats.get(skill.name) })).filter(({ stat }) => stat?.accuracy_percentage !== null && stat?.accuracy_percentage !== undefined);
  // A partial radar polygon visually suggests values for unassessed axes. Keep
  // the six-axis chart empty until every category has real saved attempts.
  const polygon = assessed.length === skills.length ? assessed.map(({ index, stat }) => point(index, Math.max(0.08, stat.accuracy_percentage / 100)).join(',')).join(' ') : '';
  return <div className="sf-radar-wrap"><svg className="sf-radar" viewBox="0 0 280 280" role="img" aria-label="Skill accuracy radar; only assessed categories are plotted">
    {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={skills.map((_, i) => point(i, scale).join(',')).join(' ')} className="sf-radar-grid" />)}
    {skills.map((skill, i) => { const [x, y] = point(i, 1); return <line key={skill.name} x1={center} y1={center} x2={x} y2={y} className="sf-radar-spoke" />; })}
    {polygon && <polygon points={polygon} className="sf-radar-area" />}
    {polygon && assessed.map(({ skill, index, stat }) => { const [x, y] = point(index, Math.max(0.08, stat.accuracy_percentage / 100)); return <circle key={skill.name} cx={x} cy={y} r="4" className="sf-radar-dot"><title>{skill.name}: {stat.accuracy_percentage}%</title></circle>; })}
    {skills.map((skill, i) => { const [x, y] = point(i, 1.22); return <text key={skill.name} x={x} y={y} className="sf-radar-label" textAnchor="middle" dominantBaseline="middle">{skill.name}</text>; })}
  </svg><p>{assessed.length ? 'Assessed categories only' : 'Complete questions to build your skill map.'}</p></div>;
}

export function ActivityHeatmap({ activity = [] }) {
  const values = new Map(activity.map((item) => [item.day, item.attempted]));
  const max = Math.max(1, ...values.values());
  return <div className="sf-heatmap" role="img" aria-label="Question attempts by day for the last 12 weeks">
    {activity.map((item) => { const value = values.get(item.day) || 0; const level = value === 0 ? 0 : Math.min(4, Math.ceil(value / max * 4)); return <span key={item.day} className={`sf-heat-cell level-${level}`} title={`${item.day}: ${value} ${value === 1 ? 'attempt' : 'attempts'}`} />; })}
  </div>;
}

export function ActivityChart({ trend = [], days = 30 }) {
  const visible = trend.slice(-days);
  const width = 640;
  const height = 180;
  const pad = 18;
  const max = Math.max(1, ...visible.map((item) => item.attempted));
  const accuracyPoints = visible.map((item, index) => ({
    x: pad + (visible.length <= 1 ? 0 : index * (width - pad * 2) / (visible.length - 1)),
    y: height - pad - ((item.accuracy_percentage ?? 0) / 100) * (height - pad * 2),
    item
  })).filter((point) => point.item.accuracy_percentage !== null && point.item.accuracy_percentage !== undefined);
  const points = visible.map((item, index) => ({
    x: pad + (visible.length <= 1 ? 0 : index * (width - pad * 2) / (visible.length - 1)),
    y: height - pad - (item.attempted / max) * (height - pad * 2),
    item
  }));
  const path = points.map((p, index) => `${index ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const accuracyPath = accuracyPoints.map((p, index) => `${index ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  return <div className="sf-activity-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Daily attempts and accuracy over ${days} days`}>
    {[0, 1, 2, 3].map((line) => <line key={line} x1={pad} x2={width - pad} y1={pad + line * (height - pad * 2) / 3} y2={pad + line * (height - pad * 2) / 3} className="sf-chart-rule" />)}
    <path d={path} className="sf-chart-stroke" />
    {accuracyPoints.length > 1 && <path d={accuracyPath} className="sf-chart-accuracy" />}
    {points.map((p) => p.item.attempted > 0 ? <circle key={p.item.day} cx={p.x} cy={p.y} r="3" className="sf-chart-point"><title>{p.item.day}: {p.item.attempted} attempted</title></circle> : null)}
    {accuracyPoints.map((p) => <circle key={`accuracy-${p.item.day}`} cx={p.x} cy={p.y} r="2.5" className="sf-chart-accuracy-point"><title>{p.item.day}: {p.item.accuracy_percentage}% accuracy</title></circle>)}
  </svg><div className="sf-chart-axis"><span>{visible[0]?.day || ''}</span><span>{visible.at(-1)?.day || ''}</span></div><div className="sf-chart-legend"><span><i />Questions attempted</span><span><i />Accuracy on active days</span></div></div>;
}
