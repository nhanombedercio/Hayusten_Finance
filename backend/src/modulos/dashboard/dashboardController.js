import { buscarDados } from './dashboardServico.js';
import { sucesso } from '../../utils/respostas.js';

export async function dashboard(req, res, next) {
  try {
    const { periodo, contaId, dataInicio, dataFim } = req.query;
    sucesso(res, await buscarDados(req.tenant.id, { periodo, contaId, dataInicio, dataFim }));
  } catch (e) { next(e); }
}
