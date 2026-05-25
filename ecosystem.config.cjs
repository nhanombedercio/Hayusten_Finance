// Configuração PM2 para produção no VPS.
// Deploy: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'hayusten-api',
      script: './backend/src/servidor.js',
      cwd: '/var/www/hayusten',
      instances: 2,         // dois processos para aproveitar múltiplos cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // PM2 reinicia automaticamente em caso de crash.
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/log/hayusten/api-error.log',
      out_file: '/var/log/hayusten/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Graceful shutdown: espera 10s pelos pedidos activos.
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 5000,
    },
  ],
};
