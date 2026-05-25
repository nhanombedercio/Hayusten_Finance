import * as servico from './transferenciasServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.listar(req.tenant.id)); } catch (e) { next(e); }
};
export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};
export const criar = async (req, res, next) => {
  try { sucesso(res, await servico.criar(req.tenant.id, req.body), 'Transferência registada.', 201); } catch (e) { next(e); }
};
export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id);
    sucesso(res, null, 'Transferência eliminada.');
  } catch (e) { next(e); }
};
