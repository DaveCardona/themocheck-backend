const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "thermocheck_db",
  password: "123456",
  port: 5432,
});

pool.connect()
  .then(() => console.log("Conectado a PostgreSQL ✅"))
  .catch(err => console.error("Error de conexión ❌", err));

module.exports = pool;