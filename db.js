const { Pool } = require("pg");

const isProduction = !!process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },

        // límites recomendados para Neon
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "thermocheck_db",
        password: "123456",
        port: 5432
      }
);

// Escuchar errores del pool
pool.on("error", (err) => {
  console.error(
    "Error inesperado PostgreSQL ❌",
    err
  );
});

// Solo probar conexión (sin mantenerla abierta)
(async () => {
  try {
    await pool.query("SELECT NOW()");

    console.log(
      isProduction
        ? "Conectado a PostgreSQL Neon ✅"
        : "Conectado a PostgreSQL Local ✅"
    );

  } catch (err) {

    console.error(
      "Error de conexión ❌",
      err
    );
  }
})();

module.exports = pool;