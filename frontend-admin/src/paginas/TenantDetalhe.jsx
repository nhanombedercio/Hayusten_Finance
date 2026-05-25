import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  buscarTenant, suspenderTenant, reactivarTenant, eliminarTenant,
} from '../servicos/admin.js';
import { formatarData, formatarMoeda, ESTADO_BADGE, ESTADO_PAGAMENTO_BADGE } from '../utils/formatadores.js';
import Carregando from '../componentes/ui/Carregando.jsx';
import Modal from '../componentes/ui/Modal.jsx';

export default function TenantDetalhe() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [aCarregar, setACarregar] = useState(true);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [aProcessar, setAProcessar] = useState(false);

  useEffect(() => {
    buscarTenant(id)
      .then((res) => setTenant(res.dados))
      .finally(() => setACarregar(false));
  }, [id]);

  async function suspender() {
    if (!confirm('Confirmar suspensão desta conta?')) return;
    setAProcessar(true);
    try {
      await suspenderTenant(id);
      toast.success('Conta suspensa com sucesso.');
      setTenant((t) => ({ ...t, estado: 'suspenso' }));
    } catch {
      toast.error('Erro ao suspender conta.');
    } finally {
      setAProcessar(false);
    }
  }

  async function reactivar() {
    setAProcessar(true);
    try {
      await reactivarTenant(id);
      toast.success('Conta reactivada com sucesso.');
      setTenant((t) => ({ ...t, estado: 'activo' }));
    } catch {
      toast.error('Erro ao reactivar conta.');
    } finally {
      setAProcessar(false);
    }
  }

  async function eliminar() {
    setAProcessar(true);
    try {
      await eliminarTenant(id);
      toast.success('Conta eliminada (dados anonimizados — RGPD).');
      navegar('/tenants');
    } catch {
      toast.error('Erro ao eliminar conta.');
    } finally {
      setAProcessar(false);
      setModalEliminar(false);
    }
  }

  if (aCarregar) return <div className="p-6"><Carregando /></div>;
  if (!tenant) return null;

  const badge = ESTADO_BADGE[tenant.estado] ?? { texto: tenant.estado, classe: 'bg-gray-100 text-gray-600' };

  return (
    <div className="p-6 max-w-4xl">
      {/* Cabeçalho */}
      <button
        onClick={() => navegar('/tenants')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar a Tenants
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{tenant.nome}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.classe}`}>
              {badge.texto}
            </span>
          </div>
          <p className="text-sm text-gray-500">{tenant.email}</p>
        </div>

        {/* Acções */}
        <div className="flex gap-2">
          {tenant.estado === 'suspenso' ? (
            <button
              onClick={reactivar}
              disabled={aProcessar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Reactivar
            </button>
          ) : (
            <button
              onClick={suspender}
              disabled={aProcessar || tenant.estado === 'cancelado'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
            >
              <ShieldOff className="w-4 h-4" />
              Suspender
            </button>
          )}
          <button
            onClick={() => setModalEliminar(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar (RGPD)
          </button>
        </div>
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Informação da Conta</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Plano</dt>
              <dd className="font-medium text-gray-900 capitalize">{tenant.plano ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Moeda</dt>
              <dd className="font-medium text-gray-900">{tenant.moedaPrincipal ?? 'MZN'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Criado em</dt>
              <dd className="font-medium text-gray-900">{formatarData(tenant.criadoEm)}</dd>
            </div>
            {tenant.trialFim && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Fim do Trial</dt>
                <dd className="font-medium text-gray-900">{formatarData(tenant.trialFim)}</dd>
              </div>
            )}
            {tenant.proximaRenovacao && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Próx. Renovação</dt>
                <dd className="font-medium text-gray-900">{formatarData(tenant.proximaRenovacao)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Utilizadores */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Utilizadores ({tenant.utilizadores?.length ?? 0})
          </h2>
          <div className="space-y-3">
            {(tenant.utilizadores ?? []).map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.nome}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u.papel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de Pagamentos */}
      {tenant.pagamentos?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Histórico de Pagamentos ({tenant.pagamentos.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Data</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Método</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Valor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenant.pagamentos.map((p) => {
                const pbadge = ESTADO_PAGAMENTO_BADGE[p.estado] ?? { texto: p.estado, classe: 'bg-gray-100 text-gray-600' };
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-gray-600">{formatarData(p.criadoEm)}</td>
                    <td className="px-5 py-3 text-gray-600 capitalize">{p.metodo}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatarMoeda(p.valor, p.moeda)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pbadge.classe}`}>
                        {pbadge.texto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmação de eliminação */}
      <Modal
        titulo="Eliminar Conta — RGPD"
        aberto={modalEliminar}
        onFechar={() => setModalEliminar(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esta acção <strong>anonimiza permanentemente</strong> os dados pessoais desta
            conta (email e nome) em cumprimento do RGPD. Os registos financeiros são
            mantidos para efeitos de integridade referencial.
          </p>
          <p className="text-sm font-medium text-red-700 bg-red-50 rounded-lg p-3">
            Esta operação é irreversível. Confirma a eliminação da conta de{' '}
            <strong>{tenant.nome}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setModalEliminar(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={eliminar}
              disabled={aProcessar}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {aProcessar ? 'A eliminar...' : 'Confirmar Eliminação'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
