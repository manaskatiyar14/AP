const { isAdminEmail } = require('../config/admin');

function adminMiddleware(req, res, next) {
  if (!process.env.ADMIN_EMAIL?.trim()) {
    return res.status(403).json({ message: 'Administrator features are not enabled on this server' });
  }
  if (!isAdminEmail(req.user?.email)) {
    return res.status(403).json({ message: 'You are not allowed to perform this administrator action' });
  }
  return next();
}

module.exports = adminMiddleware;
