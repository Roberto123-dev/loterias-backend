// meus-projetos-principais\meu-projeto\backend\src\config\database.js
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: isProduction ? { rejectUnauthorized: false } : false,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
          }
        : {
              host: process.env.DB_HOST || "localhost",
              port: process.env.DB_PORT || 5432,
              user: process.env.DB_USER || "postgres",
              password: process.env.DB_PASSWORD,
              database: process.env.DB_NAME || "postgres",
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
          },
);

// Log de conexão
pool.on("connect", () => {
    console.log("✅ Conectado ao PostgreSQL");
});

pool.on("error", (err) => {
    console.error("❌ Erro inesperado no PostgreSQL:", err);
    process.exit(1);
});

module.exports = pool;
