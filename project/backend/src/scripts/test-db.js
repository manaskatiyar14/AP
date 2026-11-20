const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('../config/db');

async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT current_database(), version()');
    const databaseName = result.rows[0].current_database;

    if (databaseName !== 'skillforge') {
      console.error(`Connected to "${databaseName}", expected "skillforge".`);
      process.exitCode = 1;
      return;
    }

    console.log(`Connected to database: ${databaseName}`);
    console.log(`PostgreSQL version: ${result.rows[0].version}`);
    console.log('Database connection test passed.');
  } catch (error) {
    if (error.code === '28P01') {
      console.error('Database connection failed: PostgreSQL rejected the configured login. Check DB_USER and DB_PASSWORD in backend/.env.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Database connection failed: PostgreSQL is not accepting connections at the configured host and port.');
    } else {
      console.error(`Database connection failed (${error.code || 'unknown error'}). Check backend/.env and PostgreSQL status.`);
    }
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();
