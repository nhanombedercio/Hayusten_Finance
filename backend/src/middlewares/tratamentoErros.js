import { ZodError } from 'zod';
import { ErroNegocio, ErroNaoEncontrado, ErroIntegracao, ErroValidacao } from '../utils/erros.js';
import { erro } from '../utils/respostas.js';
import { logger } from '../utils/logger.js';
import * as Sentry from '@sentry/node';

// Handler global de erros — deve ser o último middleware registado no app.js.
// Mapeia cada tipo de erro para o código HTTP e formato de resposta correctos.
// eslint-disable-next-line no-unused-vars
export function tratamentoErros(err, req, res, next) {
  if (err instanceof ErroValidacao) {
    return erro(res, err.message, 422, err.campos);
  }

  if (err instanceof ErroNaoEncontrado) {
    return erro(res, err.message, 404);
  }

  if (err instanceof ErroNegocio) {
    return erro(res, err.message, err.codigo || 400);
  }

  if (err instanceof ZodError) {
    const campos = err.errors.map((e) => ({ campo: e.path.join('.'), mensagem: e.message }));
    return erro(res, 'Os dados enviados são inválidos.', 422, campos);
  }

  if (err instanceof ErroIntegracao) {
    // Log do erro original para debugging sem o expor ao cliente.
    logger.error('Erro de integração', {
      servico: err.servico,
      mensagem: err.message,
      original: err.erroOriginal?.message,
    });
    Sentry.captureException(err.erroOriginal || err);
    return erro(res, `Erro ao comunicar com ${err.servico}. Tente novamente.`, 502);
  }

  // Erros inesperados — log completo e notificação Sentry.
  logger.error('Erro não tratado', { mensagem: err.message, stack: err.stack, url: req.originalUrl });
  Sentry.captureException(err);

  return erro(res, 'Ocorreu um erro interno. A equipa foi notificada.', 500);
}
