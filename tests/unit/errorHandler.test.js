const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../../src/middlewares/errorHandler');
const { catalogSchema } = require('../../src/schemas/catalog.schema');
const {
  ConflictError,
  DatabaseError,
  ForeignKeyViolationError,
  NotFoundError,
} = require('../../src/utils/errors');

const request = { method: 'GET', originalUrl: '/api/test' };

// A fake response that saves the status and the body, to check what the client receives
const fakeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const handle = (error) => {
  const response = fakeResponse();
  errorHandler(error, request, response, () => {});
  return response;
};

describe('errorHandler', () => {
  // The handler writes in the console, we do not want that noise in the tests
  beforeEach((t) => {
    t.mock.method(console, 'warn', () => {});
    t.mock.method(console, 'error', () => {});
  });

  test('turns a validation error into a 400 with one message per field', () => {
    const { error } = catalogSchema.safeParse({});
    const response = handle(error);

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      status: 400,
      error: ['code: is required', 'name: is required'],
    });
  });

  test('answers an expected error with its own status and message', () => {
    const notFound = handle(new NotFoundError('Ticket not found'));
    const conflict = handle(new ConflictError('Ticket code already exists'));
    const inUse = handle(new ForeignKeyViolationError('Supplier has tickets'));

    assert.deepEqual(notFound.body, { status: 404, error: 'Ticket not found' });
    assert.deepEqual(conflict.body, { status: 409, error: 'Ticket code already exists' });
    assert.equal(inUse.statusCode, 409);
  });

  test('never shows the details of a database error to the client', (t) => {
    const original = new Error('relation "tickets" does not exist');
    const response = handle(new DatabaseError('Could not get tickets', { cause: original }));

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, { status: 500, error: 'Internal Server Error' });
    assert.ok(!JSON.stringify(response.body).includes('tickets'));
    // ...but it is logged with all the details, to debug it
    assert.equal(console.error.mock.callCount(), 1);
  });

  test('answers an unexpected error with a generic 500', () => {
    const response = handle(new TypeError("Cannot read properties of undefined (reading 'map')"));

    assert.deepEqual(response.body, { status: 500, error: 'Internal Server Error' });
  });

  test('answers an invalid JSON body with our own message', () => {
    const parserError = Object.assign(new SyntaxError('Unexpected token b in JSON'), {
      type: 'entity.parse.failed',
      status: 400,
    });
    const response = handle(parserError);

    assert.deepEqual(response.body, { status: 400, error: 'Invalid JSON body' });
  });

  test('keeps the status of other errors from libraries with a 4xx status', () => {
    const tooLarge = Object.assign(new Error('request entity too large'), { status: 413 });
    const response = handle(tooLarge);

    assert.deepEqual(response.body, { status: 413, error: 'request entity too large' });
  });
});
