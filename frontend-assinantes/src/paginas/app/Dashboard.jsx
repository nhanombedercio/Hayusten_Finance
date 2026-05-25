import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { buscarDashboard } from '../../servicos/dashboard.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarData } from '../../utils/formatadores.js';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const PERIODOS = [
  { valor: 'mes_actual', rotulo: 'Mês actual' },
  { valor: 'mes_anterior', rotulo: 'Mês anterior' },
  { valor: 'ultimos_3_meses', rotulo: 'Últimos 3 meses' },
  { valor: 'ultimos_12_meses', rotulo: 'Últimos 12 meses' },
];

const CORES_GRAFICO = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

function CartaoEstatistica({ titulo, valor, moeda, tendencia, icone: Icone, cor }) {
  const positivo = tendencia >= 0;
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{titulo}</p>
        <div className={`p-2 rounded-lg ${cor}`}>
          <Icone size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{formatarMoeda(valor, moeda)}</p>
      {tendencia != null && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${positivo ? 'text-emerald-600' : 'text-red-500'}`}>
          {positivo ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{Math.abs(tendencia).toFixed(1)}% vs período anterior</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [periodo, setPeriodo] = useState('mes_actual');
  const [contaId, setContaId] = useState('');
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    buscarDashboard({ periodo, contaId: contaId || undefined })
      .then((r) => setDados(r.data.dados))
      .catch(() => setDados(null))
      .finally(() => setCarregando(false));
  }, [periodo, contaId]);

  if (carregando) return <Carregando texto="A carregar dashboard…" />;

  const semTransacoes = !dados?.transacoesRecentes?.length && !dados?.totalReceitas;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6">
      {/* Cabeçalho + filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral das suas finanças</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {PERIODOS.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {dados?.contas?.length > 0 && (
            <div className="relative">
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Todas as contas</option>
                {dados.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {semTransacoes ? (
        <EstadoVazio
          icone={Wallet}
          titulo="Bem-vindo à Hayusten Finance!"
          descricao="Comece por adicionar a sua primeira transacção para ver as suas finanças em acção."
        />
      ) : (
        <>
          {/* Cartões de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CartaoEstatistica titulo="Saldo total" valor={dados?.saldoTotal ?? 0} moeda={moeda} icone={Wallet} cor="bg-violet-700" />
            <CartaoEstatistica titulo="Receitas" valor={dados?.totalReceitas ?? 0} moeda={moeda} tendencia={dados?.tendenciaReceitas} icone={TrendingUp} cor="bg-emerald-500" />
            <CartaoEstatistica titulo="Despesas" valor={dados?.totalDespesas ?? 0} moeda={moeda} tendencia={dados?.tendenciaDespesas} icone={TrendingDown} cor="bg-red-500" />
            <CartaoEstatistica titulo="Poupança" valor={dados?.poupanca ?? 0} moeda={moeda} icone={PiggyBank} cor="bg-amber-500" />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Evolução do saldo */}
            {dados?.evolucaoSaldo?.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolução do saldo</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dados.evolucaoSaldo}>
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => formatarMoeda(v, moeda)} />
                    <Tooltip formatter={(v) => formatarMoeda(v, moeda)} />
                    <Line type="monotone" dataKey="saldo" stroke="#7C3AED" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Despesas por categoria */}
            {dados?.despesasPorCategoria?.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Despesas por categoria</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dados.despesasPorCategoria} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {dados.despesasPorCategoria.map((_, i) => (
                        <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatarMoeda(v, moeda)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Últimas transacções */}
          {dados?.transacoesRecentes?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Últimas transacções</h3>
                <Link to="/transacoes" className="text-xs text-violet-700 hover:underline">Ver todas</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {dados.transacoesRecentes.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.tipo === 'receita' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {t.tipo === 'receita' ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.descricao}</p>
                        <p className="text-xs text-gray-400">{t.categoria} · {formatarData(t.data)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor, moeda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metas activas */}
          {dados?.metas?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Metas activas</h3>
                <Link to="/metas" className="text-xs text-violet-700 hover:underline">Ver todas</Link>
              </div>
              <div className="px-5 py-4 flex flex-col gap-4">
                {dados.metas.slice(0, 3).map((m) => {
                  const pct = Math.min(100, (m.valorActual / m.valorObjectivo) * 100);
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{m.nome}</span>
                        <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">{formatarMoeda(m.valorActual, moeda)}</span>
                        <span className="text-xs text-gray-400">{formatarMoeda(m.valorObjectivo, moeda)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
