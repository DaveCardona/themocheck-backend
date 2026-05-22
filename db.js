const { Pool } = require("pg");

const isProduction = !!process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        // PRODUCCIÓN (Neon)
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        // LOCAL
        user: "postgres",
        host: "localhost",
        database: "thermocheck_db",
        password: "123456",
        port: 5432
      }
);

pool.connect()
  .then(() => {
    console.log(
      isProduction
        ? "Conectado a PostgreSQL Neon ✅"
        : "Conectado a PostgreSQL Local ✅"
    );
  })
  .catch(err =>
    console.error("Error de conexión ❌", err)
  );

module.exports = pool;