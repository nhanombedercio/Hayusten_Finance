import * as servico from './categoriasServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.listar(req.tenant.id)); } catch (e) { next(e); }
};
export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};
export const criar = async (req, res, next) => {
  try { sucesso(res, await servico.criar(req.tenant.id, req.body), 'Categoria criada.', 201); } catch (e) { next(e); }
};
export const editar = async (req, res, next) => {
  try { sucesso(res, await servico.editar(req.tenant.id, req.params.id, req.body), 'Categoria actualizada.'); } catch (e) { next(e); }
};
export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id);
    sucesso(res, null, 'Categoria desactivada.');
  } catch (e) { next(e); }
};
