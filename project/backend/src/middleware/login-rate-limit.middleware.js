const attempts = new Map();

function loginRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  let data = attempts.get(ip);

  if (!data || now > data.time) {
    data = { count: 0, time: now + 15 * 60 * 1000 };
    attempts.set(ip, data);
  }

  if (data.count >= 10) {
    return res.status(429).json({
      message: 'Too many attempts. Try again later.'
    });
  }

  res.on('finish', () => {
    if (res.statusCode === 401) {
      data.count++;
    } else if (res.statusCode < 400) {
      attempts.delete(ip);
    }
  });

  next();
}

module.exports = loginRateLimit;