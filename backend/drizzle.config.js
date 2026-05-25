import 'dotenv/config';

/** @type {import('drizzle-kit').Config} */
export default {
  schema: './src/baseDados/schema/index.js',
  out: './src/baseDados/migracoes',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  // Verbose para ver todas as queries geradas durante desenvolvimento
  verbose: process.env.NODE_ENV !== 'production',
  strict: true,
};
