const pool = require('../config/db');

const fields = [
  'title', 'description', 'option_a', 'option_b', 'option_c',
  'option_d', 'correct_option', 'explanation', 'category', 'difficulty'
];

const columns = 'id, title, description, option_a, option_b, option_c, option_d, category, difficulty, created_at';

function validId(id) {
  return /^\d+$/.test(String(id)) && Number(id) > 0;
}

function validateQuestion(data, partial = false) {
  const errors = [];

  for (const field of Object.keys(data)) {
    if (!fields.includes(field)) errors.push(`Invalid field: ${field}`);
  }

  for (const field of fields) {
    const value = data[field];

    if (!partial && !value) errors.push(`${field} is required`);
    if (value !== undefined && (typeof value !== 'string' || !value.trim())) {
      errors.push(`${field} must be valid`);
    }
  }

  if (data.correct_option) {
    data.correct_option = data.correct_option.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(data.correct_option)) {
      errors.push('Invalid correct option');
    }
  }

  if (data.difficulty) {
    data.difficulty = data.difficulty.trim().toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
      errors.push('Invalid difficulty');
    }
  }

  return errors;
}

async function getQuestions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${columns} FROM questions
       WHERE ($1 = '' OR LOWER(category) = LOWER($1))
       AND ($2 = '' OR LOWER(difficulty) = LOWER($2))
       ORDER BY id`,
      [req.query.category || '', req.query.difficulty || '']
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function getQuestionSummary(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT CASE
          WHEN LOWER(category) IN ('maths', 'mathematics') THEN 'Mathematics'
          WHEN LOWER(category) IN ('eq', 'emotional intelligence') THEN 'EQ'
          WHEN LOWER(category) IN ('iq', 'iq & logic', 'iq and logic') THEN 'IQ'
          WHEN LOWER(category) = 'aptitude' THEN 'Aptitude'
          WHEN LOWER(category) IN ('mental maths', 'mental ability') THEN 'Mental Ability'
          WHEN LOWER(category) IN ('puzzles', 'puzzles and brain teasers') THEN 'Puzzles'
          ELSE category
        END AS category,
        difficulty,
        COUNT(*)::integer AS count
       FROM questions
       GROUP BY 1, difficulty
       ORDER BY 1, difficulty`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function getQuestionById(req, res, next) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid question ID' });
  }

  try {
    const result = await pool.query(
      `SELECT ${columns} FROM questions WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function getAdminQuestions(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function createQuestion(req, res, next) {
  const data = req.body || {};
  const errors = validateQuestion(data);

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid question', errors });
  }

  try {
    const values = fields.map(field => data[field].trim());

    const result = await pool.query(
      `INSERT INTO questions (${fields.join(', ')})
       VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING ${columns}`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateQuestion(req, res, next) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid question ID' });
  }

  const data = req.body || {};
  const errors = validateQuestion(data, true);
  const updates = Object.keys(data).filter(field => fields.includes(field));

  if (errors.length || !updates.length) {
    return res.status(400).json({ message: 'Invalid question data', errors });
  }

  try {
    const values = updates.map(field => data[field].trim());
    values.push(req.params.id);

    const query = updates.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE questions SET ${query}
       WHERE id = $${values.length}
       RETURNING ${columns}`,
      values
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteQuestion(req, res, next) {
  if (!validId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid question ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM questions WHERE id = $1',
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(409).json({ message: 'Question has existing submissions' });
    }
    next(error);
  }
}

module.exports = {
  getQuestions,
  getQuestionSummary,
  getQuestionById,
  getAdminQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
};