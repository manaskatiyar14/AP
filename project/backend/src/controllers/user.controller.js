const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { isAdminEmail } = require('../config/admin');

function publicUser(user) {
  return { ...user, is_admin: isAdminEmail(user.email) };
}

async function getMe(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(publicUser(result.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  const name = req.body.full_name?.trim();

  if (!name || name.length < 2 || name.length > 120) {
    return res.status(400).json({ message: 'Invalid name' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET full_name = $1 WHERE id = $2
       RETURNING id, full_name, email, created_at`,
      [name, req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(publicUser(result.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password || new_password.length < 8) {
    return res.status(400).json({ message: 'Enter valid passwords' });
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await bcrypt.compare(
      current_password,
      result.rows[0].password_hash
    );

    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMe, updateMe, changePassword };