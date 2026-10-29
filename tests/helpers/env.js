// Preloaded before every API test file (node --require), so no file can load the app with the real
// database. dotenv does not replace the variables that already exist
const { TEST_DB_NAME } = require('./test-config');

process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.DB_NAME = TEST_DB_NAME;
