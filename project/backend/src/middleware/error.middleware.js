const databaseUnavailableCodes = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT',
  '28P01', '3D000', '57P03'
]);

function errorMiddleware(error, req, res, _next) {
  console.error(`[api] ${req.method} ${req.originalUrl}`, {
    code: error.code || 'UNSPECIFIED',
    message: error.message
  });

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  if (databaseUnavailableCodes.has(error.code)) {
    return res.status(503).json({ message: 'Database connection failed.' });
  }

  if (error.code === '42P01') {
    return res.status(500).json({
      message: 'The database schema is missing a required table. Check the SkillForge schema setup.'
    });
  }

  const status = Number(error.status) >= 400 && Number(error.status) < 500
    ? Number(error.status)
    : 500;
  return res.status(status).json({
    message: status < 500 ? 'Request failed' : 'Server error. Please try again later.'
  });
}

module.exports = errorMiddleware;
