import * as servico from './tenantsServico.js';
import { sucesso } from '../../utils/respostas.js';

export const buscar = async (req, res, next) => {
  try { sucesso(res, await servico.buscarTenant(req.tenant.id)); } catch (e) { next(e); }
};

export const actualizar = async (req, res, next) => {
  try {
    const { nome, moedaPrincipal, relatoriosEmailActivo } = req.body;
    const actualizado = await servico.actualizarTenant(req.tenant.id, { nome, moedaPrincipal, relatoriosEmailActivo });
    sucesso(res, actualizado, 'Definições actualizadas.');
  } catch (e) { next(e); }
};

export const activar = async (req, res, next) => {
  try { sucesso(res, await servico.activar(req.params.id), 'Tenant activado.'); } catch (e) { next(e); }
};

export const suspender = async (req, res, next) => {
  try {
    await servico.suspender(req.params.id);
    sucesso(res, null, 'Tenant suspenso.');
  } catch (e) { next(e); }
};

export const reactivar = async (req, res, next) => {
  try {
    await servico.reactivar(req.params.id);
    sucesso(res, null, 'Tenant reactivado.');
  } catch (e) { next(e); }
};

export const cancelar = async (req, res, next) => {
  try {
    await servico.cancelar(req.tenant.id, req.body.dataFimAcesso);
    sucesso(res, null, 'Assinatura cancelada.');
  } catch (e) { next(e); }
};

export const eliminar = async (req, res, next) => {
  try {
    await servico.eliminar(req.params.id);
    sucesso(res, null, 'Dados eliminados conforme RGPD.');
  } catch (e) { next(e); }
};
