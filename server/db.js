const Pool = require("pg").Pool;
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

// Configuration for Local (No SSL) vs Production (SSL Required)
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction
    ? { rejectUnauthorized: false } // Render needs this
    : false // Localhost does NOT need this
});

module.exports = pool;