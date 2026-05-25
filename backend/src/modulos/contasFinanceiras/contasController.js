import * as servico from './contasServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.buscarTodas(req.tenant.id)); } catch (e) { next(e); }
};

export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};

export const criar = async (req, res, next) => {
  try { sucesso(res, await servico.criar(req.tenant.id, req.body), 'Conta criada.', 201); } catch (e) { next(e); }
};

export const editar = async (req, res, next) => {
  try { sucesso(res, await servico.editar(req.tenant.id, req.params.id, req.body), 'Conta actualizada.'); } catch (e) { next(e); }
};

export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id);
    sucesso(res, null, 'Conta desactivada.');
  } catch (e) { next(e); }
};

export const reordenar = async (req, res, next) => {
  try {
    await servico.reordenar(req.tenant.id, req.body.ordem);
    sucesso(res, null, 'Ordem actualizada.');
  } catch (e) { next(e); }
};
