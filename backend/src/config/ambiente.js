// Valida todas as variáveis de ambiente obrigatórias no arranque do servidor.
// Falhar cedo e ruidosamente é melhor do que descobrir em produção que falta uma variável.

const VARIAVEIS_OBRIGATORIAS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'REDIS_HOST',
  'REDIS_PORT',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRECO_PREMIUM',
  'MPESA_API_KEY',
  'MPESA_PUBLIC_KEY',
  'MPESA_SERVICE_PROVIDER_CODE',
  'MPESA_CALLBACK_URL',
  'EMOLA_API_KEY',
  'EMOLA_API_SECRET',
  'EMOLA_MERCHANT_CODE',
  'EMOLA_CALLBACK_URL',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_UTILIZADOR',
  'EMAIL_PASSWORD',
  'EMAIL_REMETENTE',
  'ANTHROPIC_API_KEY',
  'FRONTEND_URL',
  'ADMIN_URL',
  'API_URL',
];

export function validarAmbiente() {
  const emFalta = VARIAVEIS_OBRIGATORIAS.filter((v) => !process.env[v]);

  if (emFalta.length > 0) {
    throw new Error(
      `Variáveis de ambiente em falta. O servidor não pode arrancar.\n` +
        `Variáveis em falta:\n${emFalta.map((v) => `  - ${v}`).join('\n')}\n` +
        `Copie .env.example para .env e preencha os valores.`
    );
  }
}
