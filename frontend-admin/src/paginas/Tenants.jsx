import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { listarTenants } from '../servicos/admin.js';
import { formatarData, ESTADO_BADGE } from '../utils/formatadores.js';
import Carregando from '../componentes/ui/Carregando.jsx';
import Paginacao from '../componentes/ui/Paginacao.jsx';

const ESTADOS = ['', 'trial', 'activo', 'suspenso', 'expirado', 'cancelado'];

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [paginacao, setPaginacao] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [aCarregar, setACarregar] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const navegar = useNavigate();

  const carregar = useCallback(async (pagina = 1) => {
    setACarregar(true);
    try {
      const resposta = await listarTenants({
        pagina,
        limite: 20,
        estado: filtroEstado || undefined,
        pesquisa: pesquisa || undefined,
      });
      setTenants(resposta.dados);
      setPaginacao(resposta.paginacao);
    } finally {
      setACarregar(false);
    }
  }, [filtroEstado, pesquisa]);

  useEffect(() => { carregar(1); }, [carregar]);

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tenants</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {paginacao.total} contas registadas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="flex gap-3 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar por nome ou email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="">Todos os estados</option>
            {ESTADOS.filter(Boolean).map((e) => (
              <option key={e} value={e}>{ESTADO_BADGE[e]?.texto ?? e}</option>
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
                <tr className="border-t border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Criado em</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Nenhum tenant encontrado.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => {
                    const badge = ESTADO_BADGE[t.estado] ?? { texto: t.estado, classe: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr
                        key={t.id}
                        onClick={() => navegar(`/tenants/${t.id}`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{t.nome}</td>
                        <td className="px-4 py-3 text-gray-500">{t.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.classe}`}>
                            {badge.texto}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{t.plano ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatarData(t.criadoEm)}</td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-gray-300" />
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
