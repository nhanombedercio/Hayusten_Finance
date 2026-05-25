import { ZodError } from 'zod';
import { ErroValidacao } from '../utils/erros.js';

// Fábrica de middlewares de validação Zod.
// Centraliza o tratamento de erros de validação com mensagens em português europeu.
// O schema recebe o body e lança ZodError se inválido — o tratamentoErros.js mapeia para 422.
export function validar(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const campos = err.errors.map((e) => ({
          campo: e.path.join('.'),
          mensagem: traduzirMensagemZod(e),
        }));
        next(new ErroValidacao(campos));
      } else {
        next(err);
      }
    }
  };
}

// Traduz mensagens de erro Zod para português europeu.
// Cobre os casos mais comuns — erros não mapeados mantêm a mensagem original.
function traduzirMensagemZod(erro) {
  const traducoes = {
    invalid_type: `Campo obrigatório ou tipo inválido (esperado: ${erro.expected})`,
    too_small: `Valor mínimo: ${erro.minimum}`,
    too_big: `Valor máximo: ${erro.maximum}`,
    invalid_string: 'Formato inválido',
    invalid_enum_value: `Valor inválido. Opções: ${erro.options?.join(', ')}`,
    invalid_literal: 'Valor não permitido',
    unrecognized_keys: `Campos desconhecidos: ${erro.keys?.join(', ')}`,
    custom: erro.message,
  };
  return traducoes[erro.code] || erro.message;
}
