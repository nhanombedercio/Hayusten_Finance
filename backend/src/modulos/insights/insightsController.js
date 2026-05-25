import * as servico from './insightsServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.listar(req.tenant.id)); } catch (e) { next(e); }
};

export const marcarLido = async (req, res, next) => {
  try {
    await servico.marcarLido(req.tenant.id, req.params.id);
    sucesso(res, null, 'Insight marcado como lido.');
  } catch (e) { next(e); }
};

export const gerar = async (req, res, next) => {
  try {
    await servico.gerarInsights(req.tenant.id);
    sucesso(res, null, 'Insights regenerados com sucesso.');
  } catch (e) { next(e); }
};
