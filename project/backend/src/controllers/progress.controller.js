const pool = require('../config/db');

function localDateKey(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayBefore(day) {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function consecutiveDays(days) {
  const set = new Set(days);
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const day of days) {
    current = previous && dayBefore(day) === previous ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }
  return { set, longest };
}

function accuracy(correct, attempted) {
  return attempted ? Math.round((correct * 1000) / attempted) / 10 : null;
}

async function getMyProgress(req, res, next) {
  try {
    const requestedZone = typeof req.query.timezone === 'string' ? req.query.timezone : 'UTC';
    let timeZone = 'UTC';
    try {
      timeZone = new Intl.DateTimeFormat('en-US', { timeZone: requestedZone }).resolvedOptions().timeZone;
    } catch {
      return res.status(400).json({ message: 'Invalid timezone' });
    }

    const [summaryResult, categoryResult, dailyResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(s.id)::integer AS total_attempted,
          COUNT(s.id) FILTER (WHERE s.is_correct)::integer AS correct_attempts,
          COUNT(s.id) FILTER (WHERE NOT s.is_correct)::integer AS incorrect_answers,
          COUNT(DISTINCT s.question_id) FILTER (WHERE s.is_correct)::integer AS total_solved,
          COALESCE(MAX(up.overall_rating), 0)::integer AS overall_rating
         FROM users u
         LEFT JOIN submissions s ON s.user_id = u.id
         LEFT JOIN user_progress up ON up.user_id = u.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [req.user.id]
      ),
      pool.query(
        `WITH category_names(name) AS (VALUES
          ('Mathematics'), ('EQ'), ('IQ'), ('Aptitude'), ('Mental Ability'), ('Puzzles')
        ), user_submissions AS (
          SELECT CASE
              WHEN LOWER(q.category) IN ('maths', 'mathematics') THEN 'Mathematics'
              WHEN LOWER(q.category) IN ('eq', 'emotional intelligence') THEN 'EQ'
              WHEN LOWER(q.category) IN ('iq', 'iq & logic', 'iq and logic') THEN 'IQ'
              WHEN LOWER(q.category) = 'aptitude' THEN 'Aptitude'
              WHEN LOWER(q.category) IN ('mental maths', 'mental ability') THEN 'Mental Ability'
              WHEN LOWER(q.category) IN ('puzzles', 'puzzles and brain teasers') THEN 'Puzzles'
              ELSE NULL
            END AS category,
            s.is_correct, s.submitted_at
          FROM submissions s
          JOIN questions q ON q.id = s.question_id
          WHERE s.user_id = $1
        )
        SELECT c.name AS category,
          COUNT(s.category)::integer AS attempted,
          COUNT(s.category) FILTER (WHERE s.is_correct)::integer AS correct,
          COUNT(s.category) FILTER (WHERE s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '30 days')::integer AS recent_attempted,
          COUNT(s.category) FILTER (WHERE s.is_correct AND s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '30 days')::integer AS recent_correct,
          COUNT(s.category) FILTER (WHERE s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '60 days' AND s.submitted_at < CURRENT_TIMESTAMP - INTERVAL '30 days')::integer AS previous_attempted,
          COUNT(s.category) FILTER (WHERE s.is_correct AND s.submitted_at >= CURRENT_TIMESTAMP - INTERVAL '60 days' AND s.submitted_at < CURRENT_TIMESTAMP - INTERVAL '30 days')::integer AS previous_correct
        FROM category_names c
        LEFT JOIN user_submissions s ON s.category = c.name
        GROUP BY c.name ORDER BY c.name`,
        [req.user.id]
      ),
      pool.query(
        `SELECT (s.submitted_at AT TIME ZONE $2)::date::text AS day,
          COUNT(*)::integer AS attempted,
          COUNT(*) FILTER (WHERE s.is_correct)::integer AS correct
         FROM submissions s
         WHERE s.user_id = $1
         GROUP BY 1 ORDER BY 1`,
        [req.user.id, timeZone]
      )
    ]);

    if (!summaryResult.rowCount) return res.status(404).json({ message: 'User not found' });

    const summary = summaryResult.rows[0];
    summary.accuracy_percentage = accuracy(summary.correct_attempts, summary.total_attempted);

    const categoryStats = categoryResult.rows.map((row) => {
      const recentAccuracy = accuracy(row.recent_correct, row.recent_attempted);
      const previousAccuracy = accuracy(row.previous_correct, row.previous_attempted);
      return {
        category: row.category,
        attempted: row.attempted,
        correct: row.correct,
        accuracy_percentage: accuracy(row.correct, row.attempted),
        improvement: recentAccuracy === null || previousAccuracy === null
          ? null
          : Math.round((recentAccuracy - previousAccuracy) * 10) / 10
      };
    });

    const dailyByKey = new Map(dailyResult.rows.map((row) => [row.day, {
      attempted: row.attempted,
      correct: row.correct
    }]));
    const activeDays = [...dailyByKey.keys()].sort();
    const { longest } = consecutiveDays(activeDays);
    const today = localDateKey(new Date(), timeZone);
    const yesterday = dayBefore(today);
    let currentStreak = 0;
    let cursor = dailyByKey.has(today) ? today : dailyByKey.has(yesterday) ? yesterday : null;
    while (cursor && dailyByKey.has(cursor)) {
      currentStreak += 1;
      cursor = dayBefore(cursor);
    }

    const activity = [];
    const trend = [];
    const start = new Date(`${today}T00:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() - 89);
    for (let offset = 0; offset < 90; offset += 1) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + offset);
      const day = date.toISOString().slice(0, 10);
      const item = dailyByKey.get(day) || { attempted: 0, correct: 0 };
      trend.push({ day, ...item, accuracy_percentage: accuracy(item.correct, item.attempted) });
      if (offset >= 6) activity.push({ day, attempted: item.attempted });
    }

    const solved = Number(summary.total_solved);
    const thresholds = [0, 10, 25, 50, 100, 200];
    const level = thresholds.filter((value) => solved >= value).length;
    const nextLevelAt = thresholds[level] ?? thresholds[thresholds.length - 1];
    const unlocked = [];
    if (summary.total_attempted >= 10) unlocked.push('First 10 Questions');
    if (solved >= 50) unlocked.push('50 Questions Solved');
    if (summary.total_attempted >= 100) unlocked.push('100 Questions Attempted');
    if (currentStreak >= 5) unlocked.push('5-Day Streak');
    if (currentStreak >= 7) unlocked.push('7-Day Streak');
    if (currentStreak >= 7) unlocked.push('Consistency Champion');
    if (categoryStats.some((item) => item.category === 'Mathematics' && item.attempted >= 10)) unlocked.push('Mathematics Explorer');
    if (categoryStats.some((item) => item.category === 'IQ' && item.attempted >= 10)) unlocked.push('Logic Champion');
    if (categoryStats.some((item) => item.category === 'Puzzles' && item.attempted >= 10)) unlocked.push('Puzzle Master');
    if (dailyResult.rows.some((row) => row.attempted >= 5 && row.attempted === row.correct)) unlocked.push('Perfect Accuracy Session');

    const assessed = categoryStats.filter((item) => item.attempted >= 5);
    const strongest = [...assessed].sort((a, b) => b.accuracy_percentage - a.accuracy_percentage)[0] || null;
    const weakest = [...assessed].sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)[0] || null;
    const needsPractice = assessed.filter((item) => item.accuracy_percentage < 70).map((item) => item.category);
    const skillOrder = ['Mathematics', 'EQ', 'IQ', 'Aptitude', 'Mental Ability', 'Puzzles'];
    const nextPractice = skillOrder.find((name) => !categoryStats.find((item) => item.category === name)?.attempted)
      || weakest?.category || null;
    const mostImproved = [...categoryStats]
      .filter((item) => item.improvement !== null && item.attempted >= 5)
      .sort((a, b) => b.improvement - a.improvement)[0] || null;

    res.json({
      summary,
      categories: categoryStats,
      activity,
      trend,
      current_streak: currentStreak,
      longest_streak: longest,
      practice_days: activeDays.length,
      level,
      level_solved: solved,
      next_level_at: nextLevelAt,
      achievements: unlocked,
      insights: {
        strongest: strongest?.category || null,
        weakest: weakest?.category || null,
        needing_practice: needsPractice,
        most_improved: mostImproved?.category || null,
        next_practice: nextPractice
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMyProgress };
