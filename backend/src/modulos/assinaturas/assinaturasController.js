import * as servico from './assinaturasServico.js';
import { sucesso } from '../../utils/respostas.js';

export const buscarEstado = async (req, res, next) => {
  try { sucesso(res, await servico.buscarEstado(req.tenant.id)); } catch (e) { next(e); }
};

export const cancelar = async (req, res, next) => {
  try {
    await servico.cancelar(req.tenant.id);
    sucesso(res, null, 'Assinatura cancelada com sucesso.');
  } catch (e) { next(e); }
};

export const reactivar = async (req, res, next) => {
  try {
    await servico.reactivar(req.tenant.id);
    sucesso(res, null, 'Conta reactivada.');
  } catch (e) { next(e); }
};

export const alterarPlano = async (req, res, next) => {
  try {
    await servico.alterarPlano(req.tenant.id, req.body.plano);
    sucesso(res, null, 'Plano actualizado.');
  } catch (e) { next(e); }
};
