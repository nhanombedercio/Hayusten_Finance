import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, UserPlus, UserMinus, BarChart2,
} from 'lucide-react';
import { buscarMetricas } from '../servicos/admin.js';
import { formatarMoeda } from '../utils/formatadores.js';
import Carregando from '../componentes/ui/Carregando.jsx';

function CartaoMetrica({ titulo, valor, icone: Icone, corIcone, subValor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{titulo}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${corIcone}`}>
          <Icone className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      {subValor && <p className="text-xs text-gray-400 mt-1">{subValor}</p>}
    </div>
  );
}

export default function Metricas() {
  const [metricas, setMetricas] = useState(null);
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    buscarMetricas()
      .then((res) => setMetricas(res.dados))
      .finally(() => setACarregar(false));
  }, []);

  if (aCarregar) return <div className="p-6"><Carregando /></div>;
  if (!metricas) return null;

  const taxaConversao = metricas.totalTrials > 0
    ? Math.round((metricas.totalActivos / metricas.totalTrials) * 100)
    : 0;

  return (
    <div className="p-6 max-w-6xl">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Métricas do Negócio</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral em tempo real</p>
      </div>

      {/* Cartões de métricas */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <CartaoMetrica
          titulo="Contas Activas"
          valor={metricas.totalActivos ?? 0}
          icone={Users}
          corIcone="bg-green-50 text-green-600"
          subValor={`${metricas.totalTrials ?? 0} em trial`}
        />
        <CartaoMetrica
          titulo="MRR"
          valor={formatarMoeda(metricas.mrr ?? 0)}
          icone={TrendingUp}
          corIcone="bg-violet-50 text-violet-600"
          subValor="Receita mensal recorrente"
        />
        <CartaoMetrica
          titulo="Novas Subscrições"
          valor={metricas.novasSubscricoesMes ?? 0}
          icone={UserPlus}
          corIcone="bg-blue-50 text-blue-600"
          subValor="Este mês"
        />
        <CartaoMetrica
          titulo="Taxa de Conversão"
          valor={`${taxaConversao}%`}
          icone={BarChart2}
          corIcone="bg-amber-50 text-amber-600"
          subValor="Trial → Activo"
        />
      </div>

      {/* Segunda linha de métricas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CartaoMetrica
          titulo="Total de Tenants"
          valor={metricas.total ?? 0}
          icone={Users}
          corIcone="bg-gray-100 text-gray-600"
        />
        <CartaoMetrica
          titulo="Em Trial"
          valor={metricas.totalTrials ?? 0}
          icone={UserPlus}
          corIcone="bg-blue-50 text-blue-600"
        />
        <CartaoMetrica
          titulo="Suspensos"
          valor={metricas.totalSuspensos ?? 0}
          icone={UserMinus}
          corIcone="bg-red-50 text-red-600"
        />
        <CartaoMetrica
          titulo="Cancelamentos"
          valor={metricas.cancelamentosMes ?? 0}
          icone={UserMinus}
          corIcone="bg-orange-50 text-orange-600"
          subValor="Este mês"
        />
      </div>
    </div>
  );
}
