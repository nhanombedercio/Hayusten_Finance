import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileBarChart2, Download } from 'lucide-react';
import * as relatoriosServico from '../../servicos/relatorios.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Trigger de download de blob no browser sem abrir nova janela.
function descarregarBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState(null); // 'pdf' | 'excel' | null

  const gerarRelatorio = async () => {
    setCarregando(true);
    try {
      const r = await relatoriosServico.gerarMensal(mes, ano);
      setRelatorio(r.data.dados);
    } catch {
      toast.error('Erro ao gerar relatório.');
    } finally {
      setCarregando(false);
    }
  };

  const exportarPDF = async () => {
    setExportando('pdf');
    try {
      const r = await relatoriosServico.exportarPDF(mes, ano);
      descarregarBlob(r.data, `relatorio-${ano}-${String(mes).padStart(2, '0')}.pdf`);
      toast.success('PDF descarregado.');
    } catch {
      toast.error('Erro ao exportar PDF.');
    } finally {
      setExportando(null);
    }
  };

  const exportarExcel = async () => {
    setExportando('excel');
    try {
      const r = await relatoriosServico.exportarExcel(mes, ano);
      descarregarBlob(r.data, `relatorio-${ano}-${String(mes).padStart(2, '0')}.xlsx`);
      toast.success('Excel descarregado.');
    } catch {
      toast.error('Erro ao exportar Excel.');
    } finally {
      setExportando(null);
    }
  };

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - i);

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-sm text-gray-500">Relatórios mensais detalhados das suas finanças</p>
      </div>

      {/* Selecção de período */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Seleccionar período</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Mês</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Ano</label>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Botao variante="primario" tamanho="md" onClick={gerarRelatorio} carregando={carregando}>
            <FileBarChart2 size={16} /> Gerar relatório
          </Botao>
        </div>
      </div>

      {/* Relatório gerado */}
      {carregando && <Carregando texto="A gerar relatório…" />}
      {relatorio && !carregando && (
        <>
          {/* Resumo */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Relatório — {MESES[mes - 1]} {ano}
              </h3>
              <div className="flex gap-2">
                <Botao variante="secundario" tamanho="sm" onClick={exportarPDF} carregando={exportando === 'pdf'}>
                  <Download size={14} /> PDF
                </Botao>
                <Botao variante="secundario" tamanho="sm" onClick={exportarExcel} carregando={exportando === 'excel'}>
                  <Download size={14} /> Excel
                </Botao>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="px-5 py-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Receitas</p>
                <p className="text-lg font-bold text-emerald-600">{formatarMoeda(relatorio.totalReceitas, moeda)}</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Despesas</p>
                <p className="text-lg font-bold text-red-500">{formatarMoeda(relatorio.totalDespesas, moeda)}</p>
              </div>
              <div className="px-5 py-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Saldo</p>
                <p className={`text-lg font-bold ${relatorio.saldo >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                  {formatarMoeda(relatorio.saldo, moeda)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela por categoria */}
          {relatorio.categorias?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Despesas por categoria</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Categoria</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">% do total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {relatorio.categorias.map((c) => (
                      <tr key={c.nome} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{c.nome}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{formatarMoeda(c.valor, moeda)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{c.percentagem?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
