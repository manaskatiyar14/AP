const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function main() {
  const seedPath = path.resolve(__dirname, '../../sql/seed_skillforge_2.sql');
  let sql = fs.readFileSync(seedPath, 'utf8');
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) sql = sql.replace(/(^|\n)COMMIT;(\s*(?:\n|$))/, '$1ROLLBACK;$2');

  await pool.query(sql);
  if (dryRun) {
    console.log('Seed validation passed; transaction rolled back (no question rows changed).');
  } else {
    const result = await pool.query(
      `SELECT category, difficulty, COUNT(*)::integer AS count
       FROM questions
       WHERE category IN ('Mathematics','EQ','IQ','Aptitude','Mental Ability','Puzzles')
       GROUP BY category, difficulty
       ORDER BY category, CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`
    );
    console.log('SkillForge 2.0 question distribution:');
    for (const row of result.rows) console.log(`${row.category} | ${row.difficulty} | ${row.count}`);
  }
}

main()
  .catch((error) => {
    console.error('SkillForge 2.0 seed failed:', error.code || 'ERROR', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
