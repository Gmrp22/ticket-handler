const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startApi } = require('../helpers/api');

describe('General behavior of the API', () => {
  let api;

  before(async () => {
    api = await startApi();
  });
  after(() => api.stop());

  test('a route that does not exist answers 404 in JSON', async () => {
    const { status, body } = await api.call('GET', '/api/nothing');

    assert.equal(status, 404);
    assert.deepEqual(body, { status: 404, error: 'Route GET /api/nothing not found' });
  });

  test('an invalid JSON body answers 400', async () => {
    const { status, body } = await api.call('POST', '/api/suppliers', '{bad');

    assert.equal(status, 400);
    assert.deepEqual(body, { status: 400, error: 'Invalid JSON body' });
  });

  test('CORS only allows the origin of the frontend', async () => {
    const { headers } = await api.call('GET', '/api/nothing');

    assert.equal(headers.get('access-control-allow-origin'), 'http://localhost:5173');
  });
});
