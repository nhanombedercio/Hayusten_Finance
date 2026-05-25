import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../baseDados/schema/index.js';

// Pool de conexões MySQL — reutiliza conexões em vez de abrir uma por pedido.
// O tamanho do pool deve ser ajustado conforme a carga do VPS.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: Number(process.env.DB_POOL_MAX) || 10,
  waitForConnections: true,
  queueLimit: 0,
  // Reconecta automaticamente em caso de perda de conexão
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(pool, { schema, mode: 'default' });

// Verifica que a base de dados está acessível no arranque
export async function verificarConexaoBD() {
  const conexao = await pool.getConnection();
  await conexao.ping();
  conexao.release();
}
