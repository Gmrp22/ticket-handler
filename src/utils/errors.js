class AppError extends Error {
  constructor(message, statusCode, options) {
    super(message, options);
    this.isOperational = true;
    this.statusCode = statusCode;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error', options) {
    super(message, 500, options);
    // It is a server problem: it is logged, and the client only gets a generic 500
    this.isOperational = false;
  }
}
class ForeignKeyViolationError extends AppError {
  constructor(message = 'Foreign key constraint violation', options) {
    super(message, 409, options);
    this.isOperational = true;
  }
}

module.exports = { AppError, ConflictError, NotFoundError, DatabaseError, ForeignKeyViolationError  };
