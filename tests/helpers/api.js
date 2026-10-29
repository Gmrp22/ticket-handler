const http = require('node:http');
const { mock } = require('node:test');
const { TEST_DB_NAME } = require('./test-config');

const app = require('../../src/app');
const models = require('../../src/models');

const assertTestDatabase = () => {
  if (models.sequelize.config.database !== TEST_DB_NAME) {
    throw new Error(
      `The tests must use "${TEST_DB_NAME}", not "${models.sequelize.config.database}"`,
    );
  }
};

// Starts the app in a free port and gives a function to call it, like the frontend does
const startApi = async () => {
  assertTestDatabase();
  // The app writes its errors in the console, we do not want that noise in the tests
  mock.method(console, 'warn', () => {});
  mock.method(console, 'error', () => {});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://localhost:${server.address().port}`;

  const call = async (method, path, body) => {
    const response = await fetch(baseUrl + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : body && JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text ? JSON.parse(text) : null,
    };
  };

  const stop = async () => {
    mock.restoreAll();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await models.sequelize.close();
  };

  return { call, stop };
};

// Empties all the tables, so each test starts from zero
const resetData = async () => {
  assertTestDatabase();
  await models.sequelize.query(
    'TRUNCATE ticket_items, tickets, suppliers, lands, products RESTART IDENTITY CASCADE',
  );
};

module.exports = { startApi, resetData, models };
