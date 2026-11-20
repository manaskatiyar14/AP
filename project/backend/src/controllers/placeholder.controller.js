function notImplemented(req, res) {
  res.status(501).json({
    status: 'error',
    message: 'This endpoint is not ready yet'
  });
}

module.exports = notImplemented;