import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Lightbulb, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import * as insightsServico from '../../servicos/insights.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const prioridadesCores = {
  alta: 'border-l-red-500',
  media: 'border-l-amber-400',
  baixa: 'border-l-violet-400',
};

export default function Insights() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = () => {
    setCarregando(true);
    insightsServico.listar()
      .then((r) => setDados(r.data.dados))
      .catch(() => toast.error('Erro ao carregar insights.'))
      .finally(() => setCarregando(false));
  };

  useEffect(() => { carregar(); }, []);

  const marcarLido = async (id) => {
    try {
      await insightsServico.marcarLido(id);
      // Actualiza localmente para evitar novo pedido ao servidor.
      setDados((prev) => ({
        ...prev,
        insights: prev.insights.map((i) => i.id === id ? { ...i, lido: true } : i),
      }));
    } catch {
      toast.error('Erro ao marcar insight como lido.');
    }
  };

  if (carregando) return <Carregando />;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-500">Análise das tendências financeiras</p>
      </div>

      {/* Gráfico de tendência mensal */}
      {dados?.tendenciaMensal?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Receitas vs Despesas — últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dados.tendenciaMensal}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => formatarMoeda(v, moeda)} />
              <Tooltip formatter={(v) => formatarMoeda(v, moeda)} />
              <Legend />
              <Line type="monotone" dataKey="receitas" stroke="#10B981" strokeWidth={2} dot={false} name="Receitas" />
              <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={2} dot={false} name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resumo por categoria */}
      {dados?.categorias?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Despesas por categoria — comparação com mês anterior</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {dados.categorias.map((c) => {
              const variacao = c.mesActual - c.mesAnterior;
              const subiu = variacao > 0;
              return (
                <div key={c.nome} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-800 font-medium">{c.nome}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatarMoeda(c.mesActual, moeda)}</p>
                    <p className={`text-xs ${subiu ? 'text-red-500' : 'text-emerald-600'}`}>
                      {subiu ? '+' : ''}{formatarMoeda(variacao, moeda)} vs mês anterior
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de insights */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Insights activos</h3>
        {!dados?.insights?.length ? (
          <EstadoVazio
            icone={Lightbulb}
            titulo="Sem insights disponíveis"
            descricao="Continue a registar as suas transacções para receber análises personalizadas."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {dados.insights.map((insight) => (
              <div
                key={insight.id}
                className={`bg-white rounded-xl border border-gray-100 border-l-4 shadow-sm p-4 flex gap-4 ${prioridadesCores[insight.prioridade] ?? 'border-l-gray-300'} ${insight.lido ? 'opacity-60' : ''}`}
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <Lightbulb size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-0.5">{insight.titulo}</p>
                  <p className="text-xs text-gray-500">{insight.descricao}</p>
                </div>
                {!insight.lido && (
                  <button
                    onClick={() => marcarLido(insight.id)}
                    className="shrink-0 p-1.5 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Marcar como lido"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
