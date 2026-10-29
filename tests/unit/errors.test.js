const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  AppError,
  BadRequestError,
  ConflictError,
  DatabaseError,
  ForeignKeyViolationError,
  NotFoundError,
} = require('../../src/utils/errors');

describe('custom errors', () => {
  test('AppError keeps the message and the status, and it is operational', () => {
    const error = new AppError('Something happened', 418);

    assert.equal(error.message, 'Something happened');
    assert.equal(error.statusCode, 418);
    assert.equal(error.isOperational, true);
    assert.ok(error instanceof Error);
  });

  test('each error has its own status', () => {
    assert.equal(new BadRequestError().statusCode, 400);
    assert.equal(new NotFoundError().statusCode, 404);
    assert.equal(new ConflictError().statusCode, 409);
    assert.equal(new ForeignKeyViolationError().statusCode, 409);
    assert.equal(new DatabaseError().statusCode, 500);
  });

  test('all of them extend AppError', () => {
    for (const ErrorClass of [
      BadRequestError,
      NotFoundError,
      ConflictError,
      ForeignKeyViolationError,
      DatabaseError,
    ]) {
      assert.ok(new ErrorClass() instanceof AppError, ErrorClass.name);
    }
  });

  test('only DatabaseError is not operational', () => {
    assert.equal(new NotFoundError().isOperational, true);
    assert.equal(new ConflictError().isOperational, true);
    assert.equal(new ForeignKeyViolationError().isOperational, true);
    assert.equal(new DatabaseError().isOperational, false);
  });

  test('DatabaseError keeps the original error in cause', () => {
    const original = new Error('connection lost');
    const error = new DatabaseError('Could not get tickets', { cause: original });

    assert.equal(error.cause, original);
  });
});
