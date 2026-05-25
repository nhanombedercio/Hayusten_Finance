import winston from 'winston';

// Logger estruturado em JSON para facilitar filtragem por tenantId em produção.
// Em desenvolvimento, o formato 'simple' é mais legível no terminal.
const formatoDesenvolvimento = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

const formatoProducao = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? formatoProducao : formatoDesenvolvimento,
  transports: [new winston.transports.Console()],
  // Não terminar o processo em excepções não tratadas — o PM2 trata disso
  exitOnError: false,
});
