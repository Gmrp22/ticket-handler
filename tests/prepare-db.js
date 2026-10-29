// Creates the test database from zero and runs the migrations on it. It runs before the API tests
const { execFileSync } = require('node:child_process');
const { Sequelize } = require('sequelize');
require('dotenv').config({ quiet: true });
const { TEST_DB_NAME } = require('./helpers/test-config');

const prepare = async () => {
  // To create or drop a database we connect to the default one (postgres)
  const admin = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  });

  try {
    await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  } finally {
    await admin.close();
  }

  execFileSync('npx', ['sequelize-cli', 'db:migrate'], {
    env: { ...process.env, DB_NAME: TEST_DB_NAME },
    stdio: 'pipe',
  });
  console.log(`Test database "${TEST_DB_NAME}" is ready`);
};

prepare().catch((error) => {
  console.error('Could not prepare the test database. Is it running? (docker compose up -d)');
  console.error(error.stderr?.toString() || error.message);
  process.exit(1);
});
