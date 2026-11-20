const pool = require('../config/db');

async function createContest(req, res, next) {
  const { title, description, start_time, end_time } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: 'Enter a valid title' });
  }

  if (new Date(start_time) <= new Date() ||
      new Date(end_time) <= new Date(start_time)) {
    return res.status(400).json({ message: 'Invalid contest dates' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO contests (title, description, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), description || null, start_time, end_time]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function getContests(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(r.id)::integer AS registration_count
       FROM contests c
       LEFT JOIN contest_registrations r ON c.id = r.contest_id
       GROUP BY c.id
       ORDER BY c.start_time ASC`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function getContestById(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT * FROM contests WHERE id = $1',
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function getMyContests(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT c.*, r.registered_at
       FROM contests c
       JOIN contest_registrations r ON c.id = r.contest_id
       WHERE r.user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function registerForContest(req, res, next) {
  try {
    const result = await pool.query(
      `INSERT INTO contest_registrations (user_id, contest_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.user.id, req.params.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Already registered' });
    }
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Contest not found' });
    }
    next(error);
  }
}

module.exports = {
  createContest,
  getContests,
  getContestById,
  getMyContests,
  registerForContest
};