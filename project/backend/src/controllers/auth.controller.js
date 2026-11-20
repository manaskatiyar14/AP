const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { isAdminEmail } = require('../config/admin');

function makeToken(user) {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    created_at: user.created_at,
    is_admin: isAdminEmail(user.email)
  };
}

async function signup(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8 && !isAdminEmail(email)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, created_at`,
      [full_name.trim(), email.trim().toLowerCase(), hash]
    );

    const user = publicUser(result.rows[0]);

    res.status(201).json({ token: makeToken(user), user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const safeUser = publicUser(user);
    res.json({ token: makeToken(safeUser), user: safeUser });
  } catch (error) {
    next(error);
  }
}

async function demoSession(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    const email = (process.env.DEMO_EMAIL || 'demo@skillforge.local').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || isAdminEmail(email)) {
      return res.status(503).json({ message: 'Development demo is not configured safely' });
    }
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ('SkillForge Demo', $1, $2)
       ON CONFLICT (email) DO NOTHING`,
      [email, await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 12)]
    );
    const result = await pool.query(
      'SELECT id, full_name, email, created_at FROM users WHERE email = $1',
      [email]
    );
    if (!result.rowCount || isAdminEmail(result.rows[0].email)) {
      return res.status(503).json({ message: 'Development demo is not configured safely' });
    }
    const user = publicUser(result.rows[0]);
    return res.json({ token: makeToken(user), user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signup, login, demoSession };