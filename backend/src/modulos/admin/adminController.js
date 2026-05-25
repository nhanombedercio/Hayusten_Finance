import * as servico from './adminServico.js';
import { sucesso, paginado } from '../../utils/respostas.js';

export const metricas = async (req, res, next) => {
  try { sucesso(res, await servico.buscarMetricas()); } catch (e) { next(e); }
};

export const listarTenants = async (req, res, next) => {
  try {
    const { dados, total, pagina, limite } = await servico.listarTenants(req.query);
    paginado(res, dados, { pagina, limite, total });
  } catch (e) { next(e); }
};

export const buscarTenant = async (req, res, next) => {
  try { sucesso(res, await servico.buscarTenant(req.params.id)); } catch (e) { next(e); }
};

export const suspenderTenant = async (req, res, next) => {
  try {
    await servico.suspenderTenant(req.params.id);
    sucesso(res, null, 'Tenant suspenso.');
  } catch (e) { next(e); }
};

export const reactivarTenant = async (req, res, next) => {
  try {
    await servico.reactivarTenant(req.params.id);
    sucesso(res, null, 'Tenant reactivado.');
  } catch (e) { next(e); }
};

export const eliminarTenant = async (req, res, next) => {
  try {
    await servico.eliminarTenant(req.params.id);
    sucesso(res, null, 'Dados eliminados (RGPD).');
  } catch (e) { next(e); }
};

export const listarPagamentos = async (req, res, next) => {
  try {
    const { dados, total, pagina, limite } = await servico.listarPagamentos(req.query);
    paginado(res, dados, { pagina, limite, total });
  } catch (e) { next(e); }
};
