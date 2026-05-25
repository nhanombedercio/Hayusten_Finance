import * as servico from './metasServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.listar(req.tenant.id)); } catch (e) { next(e); }
};
export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};
export const criar = async (req, res, next) => {
  try { sucesso(res, await servico.criar(req.tenant.id, req.body), 'Meta criada.', 201); } catch (e) { next(e); }
};
export const editar = async (req, res, next) => {
  try { sucesso(res, await servico.editar(req.tenant.id, req.params.id, req.body), 'Meta actualizada.'); } catch (e) { next(e); }
};
export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id);
    sucesso(res, null, 'Meta eliminada.');
  } catch (e) { next(e); }
};
export const adicionarContribuicao = async (req, res, next) => {
  try {
    sucesso(res, await servico.adicionarContribuicao(req.tenant.id, req.params.id, req.body), 'Contribuição adicionada.', 201);
  } catch (e) { next(e); }
};
export const listarContribuicoes = async (req, res, next) => {
  try { sucesso(res, await servico.listarContribuicoes(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};
export const eliminarContribuicao = async (req, res, next) => {
  try {
    await servico.eliminarContribuicao(req.tenant.id, req.params.id, req.params.contribuicaoId);
    sucesso(res, null, 'Contribuição eliminada.');
  } catch (e) { next(e); }
};
