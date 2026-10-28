// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error({
    message: err.message,
    statusCode: err.statusCode,
    errors: err.errors,
  });

  // Errors from libraries (for example an invalid JSON body) carry a 4xx status
  const statusCode = err.statusCode || err.status;
  const isClientError = statusCode >= 400 && statusCode < 500;

  if (err.isOperational || isClientError) {
    return res.status(statusCode).json({
      status: statusCode,
      error: err.errors || err.message,
    });
  }

  res.status(500).json({ status: 500, error: 'Internal Server Error' });
}

module.exports = errorHandler;
