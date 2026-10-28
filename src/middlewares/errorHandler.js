// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errors from libraries (for example an invalid JSON body) carry a 4xx status
  const statusCode = err.statusCode || err.status;
  const isClientError = statusCode >= 400 && statusCode < 500;

  if (err.isOperational || isClientError) {
    console.warn(`${req.method} ${req.originalUrl} [${statusCode}] ${err.message}`);
    return res.status(statusCode).json({
      status: statusCode,
      error: err.errors || err.message,
    });
  }

  // Unexpected error: log the request and the full error (type, message and stack)
  console.error(`${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ status: 500, error: 'Internal Server Error' });
}

module.exports = errorHandler;
