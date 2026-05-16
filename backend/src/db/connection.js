const sql = require('mssql');

// Azure SQL connection configuration
// All values come from environment variables — never hardcoded
const config = {
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,           // Required for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

/**
 * Returns a singleton connection pool.
 * Creates the pool on first call, reuses it on subsequent calls.
 */
async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('[db] Connected to Azure SQL Database');
  }
  return pool;
}

module.exports = { getPool, sql };
