const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("Conectado a PostgreSQL Neon ✅"))
  .catch(err => console.error("Error de conexión ❌", err));

module.exports = pool;