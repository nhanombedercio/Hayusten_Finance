import * as servico from './transacoesServico.js';
import { sucesso, paginado } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try {
    const { dados, total, pagina, limite } = await servico.listar(req.tenant.id, req.query);
    paginado(res, dados, { pagina, limite, total });
  } catch (e) { next(e); }
};

export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};

export const criar = async (req, res, next) => {
  try {
    sucesso(res, await servico.criar(req.tenant.id, req.usuario.id, req.body), 'Transacção registada.', 201);
  } catch (e) { next(e); }
};

export const editar = async (req, res, next) => {
  try {
    sucesso(res, await servico.editar(req.tenant.id, req.params.id, req.body), 'Transacção actualizada.');
  } catch (e) { next(e); }
};

export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id);
    sucesso(res, null, 'Transacção eliminada.');
  } catch (e) { next(e); }
};
