require('dotenv').config();
const DB = require('./config/database'); // Ensure database connection is established
const http = require('http');
const app = require('./app');

DB.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    const PORT = process.env.PORT || 3000;

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });

    // Handle graceful shutdown
    const shutdown = (signal) => {
      console.log(`${signal} signal received: closing HTTP server`);
      server.close(async () => {
        console.log('HTTP server closed');
        await DB.close();
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  });
