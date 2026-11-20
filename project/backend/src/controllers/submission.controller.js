const pool = require('../config/db');

async function submitAnswer(req, res, next) {
  const { question_id, selected_option, attempt_id } = req.body;

  if (!Number.isInteger(Number(question_id)) || Number(question_id) <= 0 ||
      !['A', 'B', 'C', 'D'].includes(selected_option?.toUpperCase()) ||
      !/^[0-9a-f-]{36}$/i.test(attempt_id || '') ||
      req.body.user_id !== undefined) {
    return res.status(400).json({ message: 'Invalid submission data' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const question = await client.query(
      'SELECT correct_option, explanation FROM questions WHERE id = $1',
      [question_id]
    );

    if (!question.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Question not found' });
    }

    const correct = selected_option.toUpperCase() === question.rows[0].correct_option;

    const result = await client.query(
      `INSERT INTO submissions
       (user_id, question_id, selected_option, is_correct, attempt_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, question_id, selected_option.toUpperCase(), correct, attempt_id]
    );

    await client.query(
      `INSERT INTO user_progress (user_id, total_solved, overall_rating)
       VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
      [req.user.id]
    );

    const progress = await client.query(
      `SELECT COUNT(DISTINCT question_id)::integer AS total
       FROM submissions WHERE user_id = $1 AND is_correct = TRUE`,
      [req.user.id]
    );

    const total = progress.rows[0].total;

    await client.query(
      `UPDATE user_progress SET total_solved = $1,
       overall_rating = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [total, total * 10, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      submission: result.rows[0],
      correct_option: question.rows[0].correct_option,
      explanation: question.rows[0].explanation,
      progress: { total_solved: total, overall_rating: total * 10 }
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Attempt already submitted' });
    }

    next(error);
  } finally {
    client.release();
  }
}

async function getMySubmissions(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT s.id, s.question_id, q.title, q.category, q.difficulty,
       s.selected_option, s.is_correct, s.submitted_at
       FROM submissions s
       JOIN questions q ON q.id = s.question_id
       WHERE s.user_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

module.exports = { submitAnswer, getMySubmissions };