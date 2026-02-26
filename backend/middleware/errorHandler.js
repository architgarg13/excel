const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large. Maximum size is 10MB.',
      });
    }
    return res.status(400).json({
      error: err.message,
    });
  }

  if (err.type === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      error: 'Invalid file type. Only .xlsx and .xls files are allowed.',
    });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
