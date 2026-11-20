export const skills = [
  { name: 'Mathematics', icon: '∑', color: 'math', description: 'Build confidence with algebra, probability, geometry, and multi-step quantitative reasoning.' },
  { name: 'EQ', icon: '◎', color: 'eq', description: 'Explore perspective-taking, emotional awareness, communication, and thoughtful responses.' },
  { name: 'IQ', icon: '◇', color: 'iq', description: 'Practise deduction, patterns, sequences, analogies, and structured logical reasoning.' },
  { name: 'Aptitude', icon: '↗', color: 'aptitude', description: 'Work through practical quantitative, analytical, and decision-making challenges.' },
  { name: 'Mental Ability', icon: '◈', color: 'mental', description: 'Strengthen spatial, verbal, and abstract reasoning with focused challenges.' },
  { name: 'Puzzles', icon: '⌘', color: 'puzzles', description: 'Tackle constraint puzzles, truth problems, scheduling, and lateral-thinking challenges.' },
];

export function normalizeCategory(value = '') {
  const key = value.trim().toLowerCase();
  if (['maths', 'mathematics'].includes(key)) return 'Mathematics';
  if (['eq', 'emotional intelligence'].includes(key)) return 'EQ';
  if (['iq', 'iq & logic', 'iq and logic'].includes(key)) return 'IQ';
  if (key === 'aptitude') return 'Aptitude';
  if (['mental maths', 'mental ability'].includes(key)) return 'Mental Ability';
  if (['puzzles', 'puzzles and brain teasers'].includes(key)) return 'Puzzles';
  return value;
}
