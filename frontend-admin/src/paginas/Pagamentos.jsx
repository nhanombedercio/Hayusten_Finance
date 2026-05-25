import { useState, useEffect, useCallback } from 'react';
import { listarPagamentos } from '../servicos/admin.js';
import {
  formatarData, formatarMoeda, ESTADO_PAGAMENTO_BADGE,
} from '../utils/formatadores.js';
import Carregando from '../componentes/ui/Carregando.jsx';
import Paginacao from '../componentes/ui/Paginacao.jsx';

const METODOS = ['', 'stripe', 'mpesa', 'emola'];
const ESTADOS = ['', 'pendente', 'confirmado', 'falhado', 'reembolsado'];

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [paginacao, setPaginacao] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [aCarregar, setACarregar] = useState(true);
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const carregar = useCallback(async (pagina = 1) => {
    setACarregar(true);
    try {
      const resposta = await listarPagamentos({
        pagina,
        limite: 25,
        metodo: filtroMetodo || undefined,
        estado: filtroEstado || undefined,
      });
      setPagamentos(resposta.dados);
      setPaginacao(resposta.paginacao);
    } finally {
      setACarregar(false);
    }
  }, [filtroMetodo, filtroEstado]);

  useEffect(() => { carregar(1); }, [carregar]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {paginacao.total} transacções processadas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {/* Filtros */}
        <div className="flex gap-3 p-4 border-b border-gray-100">
          <select
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="">Todos os métodos</option>
            {METODOS.filter(Boolean).map((m) => (
              <option key={m} value={m} className="capitalize">{m}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="">Todos os estados</option>
            {ESTADOS.filter(Boolean).map((e) => (
              <option key={e} value={e}>{ESTADO_PAGAMENTO_BADGE[e]?.texto ?? e}</option>
            ))}
          </select>
        </div>

        {/* Tabela */}
        {aCarregar ? (
          <Carregando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Método</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Referência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Nenhum pagamento encontrado.
                    </td>
                  </tr>
                ) : (
                  pagamentos.map((p) => {
                    const badge = ESTADO_PAGAMENTO_BADGE[p.estado] ?? {
                      texto: p.estado, classe: 'bg-gray-100 text-gray-600',
                    };
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600">{formatarData(p.criadoEm)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.tenantNome ?? '—'}</p>
                          <p className="text-xs text-gray-400">{p.tenantEmail ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{p.metodo}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatarMoeda(p.valor, p.moeda)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.classe}`}>
                            {badge.texto}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                          {p.referencia?.slice(0, 20) ?? '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao
          pagina={paginacao.pagina}
          totalPaginas={paginacao.totalPaginas}
          onMudar={(p) => carregar(p)}
        />
      </div>
    </div>
  );
}
