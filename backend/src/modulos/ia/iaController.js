import * as servico from './iaServico.js';
import { enviarMensagem } from './iaChat.js';
import { sucesso } from '../../utils/respostas.js';

export const score = async (req, res, next) => {
  try { sucesso(res, await servico.calcularScoreFinanceiro(req.tenant.id)); } catch (e) { next(e); }
};

export const previsoes = async (req, res, next) => {
  try { sucesso(res, await servico.gerarPrevisoesDespesas(req.tenant.id)); } catch (e) { next(e); }
};

export const projecao = async (req, res, next) => {
  try {
    const meses = Number(req.query.meses) || 6;
    sucesso(res, await servico.calcularProjecaoSaldo(req.tenant.id, meses));
  } catch (e) { next(e); }
};

export const simular = async (req, res, next) => {
  try {
    const { categoria, percentagem } = req.body;
    sucesso(res, await servico.simularCenario(req.tenant.id, categoria, percentagem));
  } catch (e) { next(e); }
};

export const planoPoupancaMeta = async (req, res, next) => {
  try { sucesso(res, await servico.calcularPoupancaMeta(req.tenant.id, req.params.metaId)); } catch (e) { next(e); }
};

export const chat = async (req, res, next) => {
  try {
    const { mensagem, historico } = req.body;
    sucesso(res, await enviarMensagem(req.tenant.id, mensagem, historico || []));
  } catch (e) { next(e); }
};
