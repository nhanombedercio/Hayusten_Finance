import api from './api.js';

// Gera o relatório mensal com resumo de receitas, despesas e categorias.
export const gerarMensal = (mes, ano) =>
  api.get('/relatorios/mensal', { params: { mes, ano } });

// Exporta o relatório em PDF — retorna blob para download no browser.
export const exportarPDF = (mes, ano) =>
  api.get('/relatorios/exportar/pdf', {
    params: { mes, ano },
    responseType: 'blob',
  });

// Exporta o relatório em Excel — retorna blob para download no browser.
export const exportarExcel = (mes, ano) =>
  api.get('/relatorios/exportar/excel', {
    params: { mes, ano },
    responseType: 'blob',
  });
