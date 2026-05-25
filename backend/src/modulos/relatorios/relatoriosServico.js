import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { db } from '../../config/baseDados.js';
import { transacoes, categorias, contasFinanceiras, tenants } from '../../baseDados/schema/index.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { enviarRelatorioMensal } from '../../utils/email.js';
import { ErroNaoEncontrado } from '../../utils/erros.js';

export async function gerarRelatorioMensal(tenantId, mes, ano) {
  const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);

  const conds = [
    eq(transacoes.tenantId, tenantId),
    gte(transacoes.data, inicio),
    lte(transacoes.data, fim),
  ];

  const [resumo] = await db.select({
    receitas: sql`COALESCE(SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END),0)`,
    despesas: sql`COALESCE(SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END),0)`,
    totalTransacoes: sql`COUNT(*)`,
  }).from(transacoes).where(and(...conds));

  const lista = await db.select({
    id: transacoes.id,
    tipo: transacoes.tipo,
    valor: transacoes.valor,
    descricao: transacoes.descricao,
    data: transacoes.data,
    categoria: categorias.nome,
    conta: contasFinanceiras.nome,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .leftJoin(contasFinanceiras, eq(transacoes.contaId, contasFinanceiras.id))
    .where(and(...conds))
    .orderBy(transacoes.data);

  const gastosCat = await db.select({
    nome: categorias.nome,
    total: sql`SUM(${transacoes.valor})`,
  }).from(transacoes)
    .leftJoin(categorias, eq(transacoes.categoriaId, categorias.id))
    .where(and(...conds, eq(transacoes.tipo, 'despesa')))
    .groupBy(categorias.nome)
    .orderBy(sql`SUM(${transacoes.valor}) DESC`)
    .limit(5);

  return {
    mes, ano,
    totalReceitas: Number(resumo.receitas),
    totalDespesas: Number(resumo.despesas),
    poupanca: Number(resumo.receitas) - Number(resumo.despesas),
    totalTransacoes: Number(resumo.totalTransacoes),
    transacoes: lista,
    topCategorias: gastosCat.map((c) => ({ nome: c.nome || 'Sem categoria', valor: Number(c.total).toFixed(2) })),
  };
}

export async function exportarPDF(tenantId, mes, ano) {
  const dados = await gerarRelatorioMensal(tenantId, mes, ano);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks = [];

  doc.on('data', (c) => chunks.push(c));
  await new Promise((res) => doc.on('end', res));

  doc.fontSize(20).text(`Relatório Financeiro — ${mes}/${ano}`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Receitas: ${dados.totalReceitas.toFixed(2)} MZN`);
  doc.text(`Despesas: ${dados.totalDespesas.toFixed(2)} MZN`);
  doc.text(`Poupança: ${dados.poupanca.toFixed(2)} MZN`);
  doc.moveDown();
  doc.fontSize(14).text('Transacções:');
  doc.fontSize(10);

  for (const t of dados.transacoes) {
    doc.text(`${t.data}  [${t.tipo}]  ${Number(t.valor).toFixed(2)} MZN  ${t.descricao || ''}  (${t.categoria || '-'})`);
  }

  doc.end();
  return Buffer.concat(chunks);
}

export async function exportarExcel(tenantId, mes, ano) {
  const dados = await gerarRelatorioMensal(tenantId, mes, ano);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${mes}-${ano}`);

  ws.columns = [
    { header: 'Data', key: 'data', width: 14 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Valor (MZN)', key: 'valor', width: 16 },
    { header: 'Descrição', key: 'descricao', width: 30 },
    { header: 'Categoria', key: 'categoria', width: 20 },
    { header: 'Conta', key: 'conta', width: 20 },
  ];

  ws.getRow(1).font = { bold: true };
  dados.transacoes.forEach((t) => ws.addRow({
    data: t.data,
    tipo: t.tipo,
    valor: Number(t.valor),
    descricao: t.descricao || '',
    categoria: t.categoria || '',
    conta: t.conta || '',
  }));

  ws.addRow([]);
  ws.addRow(['', 'Total Receitas', dados.totalReceitas, '', '', '']);
  ws.addRow(['', 'Total Despesas', dados.totalDespesas, '', '', '']);
  ws.addRow(['', 'Poupança', dados.poupanca, '', '', '']);

  return wb.xlsx.writeBuffer();
}

export async function enviarRelatorioEmailServico(tenantId, mes, ano) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) throw new ErroNaoEncontrado('Tenant');
  if (!tenant.relatoriosEmailActivo) return;

  const dados = await gerarRelatorioMensal(tenantId, mes, ano);
  await enviarRelatorioMensal(tenant.email, tenant.nome, dados, tenant.plano);
}
