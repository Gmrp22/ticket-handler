const { ZodError } = require('zod');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Invalid request data: one message per wrong field, for example "items.0.price: ..."
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => [issue.path.join('.'), issue.message].filter(Boolean).join(': '));
    console.warn(`${req.method} ${req.originalUrl} [400] ${errors.join(', ')}`);
    return res.status(400).json({ status: 400, error: errors });
  }

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
