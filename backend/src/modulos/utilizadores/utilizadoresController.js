import * as servico from './utilizadoresServico.js';
import { sucesso } from '../../utils/respostas.js';

export const listar = async (req, res, next) => {
  try { sucesso(res, await servico.listar(req.tenant.id)); } catch (e) { next(e); }
};

export const buscarPorId = async (req, res, next) => {
  try { sucesso(res, await servico.buscarPorId(req.tenant.id, req.params.id)); } catch (e) { next(e); }
};

export const criar = async (req, res, next) => {
  try { sucesso(res, await servico.criar(req.tenant.id, req.body), 'Utilizador criado.', 201); } catch (e) { next(e); }
};

export const editar = async (req, res, next) => {
  try { sucesso(res, await servico.editar(req.tenant.id, req.params.id, req.body), 'Utilizador actualizado.'); } catch (e) { next(e); }
};

export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.tenant.id, req.params.id, req.usuario.id);
    sucesso(res, null, 'Utilizador desactivado.');
  } catch (e) { next(e); }
};

export const actualizarPerfil = async (req, res, next) => {
  try { sucesso(res, await servico.actualizarPerfil(req.tenant.id, req.usuario.id, req.body), 'Perfil actualizado.'); } catch (e) { next(e); }
};

export const alterarPassword = async (req, res, next) => {
  try {
    await servico.alterarPassword(req.tenant.id, req.usuario.id, req.body);
    sucesso(res, null, 'Password alterada com sucesso.');
  } catch (e) { next(e); }
};
