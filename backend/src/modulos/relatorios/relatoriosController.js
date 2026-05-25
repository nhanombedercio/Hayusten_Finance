import * as servico from './relatoriosServico.js';
import { sucesso } from '../../utils/respostas.js';

function parsarMesAno(query) {
  const agora = new Date();
  return {
    mes: Number(query.mes) || agora.getMonth() + 1,
    ano: Number(query.ano) || agora.getFullYear(),
  };
}

export const mensal = async (req, res, next) => {
  try {
    const { mes, ano } = parsarMesAno(req.query);
    sucesso(res, await servico.gerarRelatorioMensal(req.tenant.id, mes, ano));
  } catch (e) { next(e); }
};

export const exportarPDF = async (req, res, next) => {
  try {
    const { mes, ano } = parsarMesAno(req.query);
    const buffer = await servico.exportarPDF(req.tenant.id, mes, ano);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${mes}-${ano}.pdf`);
    res.send(buffer);
  } catch (e) { next(e); }
};

export const exportarExcel = async (req, res, next) => {
  try {
    const { mes, ano } = parsarMesAno(req.query);
    const buffer = await servico.exportarExcel(req.tenant.id, mes, ano);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${mes}-${ano}.xlsx`);
    res.send(buffer);
  } catch (e) { next(e); }
};

export const enviarAgora = async (req, res, next) => {
  try {
    const { mes, ano } = parsarMesAno(req.body);
    await servico.enviarRelatorioEmailServico(req.tenant.id, mes, ano);
    sucesso(res, null, 'Relatório enviado por email.');
  } catch (e) { next(e); }
};
