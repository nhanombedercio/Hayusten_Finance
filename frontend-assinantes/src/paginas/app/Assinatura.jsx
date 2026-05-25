import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import * as assinaturaServico from '../../servicos/assinatura.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarDataCompleta } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';

const FEATURES_PREMIUM = [
  'Contas ilimitadas',
  'Categorias ilimitadas',
  'Análise IA avançada',
  'Relatórios PDF e Excel',
  'Histórico completo',
  'Suporte prioritário',
];

export default function Assinatura() {
  const { tenant } = useTenantStore.getState ? useTenantStore() : { tenant: null };
  const store = useTenantStore();
  const moeda = store.tenant?.moedaPrincipal ?? 'MZN';
  const diasRestantes = store.diasTrialRestantes;

  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [metodoPagamento, setMetodoPagamento] = useState('mpesa');
  const [numero, setNumero] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  useEffect(() => {
    assinaturaServico.buscar()
      .then((r) => setDados(r.data.dados))
      .catch(() => toast.error('Erro ao carregar informações de assinatura.'))
      .finally(() => setCarregando(false));
  }, []);

  const assinarComMpesa = async () => {
    if (!numero.trim()) { toast.error('Indique o número M-Pesa.'); return; }
    setAProcessar(true);
    try {
      await assinaturaServico.iniciarMpesa(numero);
      toast.success('Pedido de pagamento enviado para o seu M-Pesa. Confirme no telemóvel.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao iniciar pagamento M-Pesa.');
    } finally {
      setAProcessar(false);
    }
  };

  const assinarComEmola = async () => {
    if (!numero.trim()) { toast.error('Indique o número Emola.'); return; }
    setAProcessar(true);
    try {
      await assinaturaServico.iniciarEmola(numero);
      toast.success('Pedido de pagamento enviado para o seu Emola. Confirme no telemóvel.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao iniciar pagamento Emola.');
    } finally {
      setAProcessar(false);
    }
  };

  const assinarComStripe = async () => {
    setAProcessar(true);
    try {
      const r = await assinaturaServico.criarSessaoStripe('premium');
      window.location.href = r.data.dados.url;
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao iniciar pagamento.');
      setAProcessar(false);
    }
  };

  const cancelarAssinatura = async () => {
    if (!confirm('Tem a certeza? A assinatura permanecerá activa até ao fim do período já pago.')) return;
    try {
      await assinaturaServico.cancelar();
      toast.success('Assinatura cancelada. Continuará activa até ao fim do período pago.');
    } catch {
      toast.error('Erro ao cancelar assinatura.');
    }
  };

  const aoClicarPagar = () => {
    if (metodoPagamento === 'mpesa') assinarComMpesa();
    else if (metodoPagamento === 'emola') assinarComEmola();
    else assinarComStripe();
  };

  if (carregando) return <Carregando />;

  const emTrial = store.estaEmTrial;
  const estaActivo = store.estaActivo && !emTrial;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Assinatura</h1>
        <p className="text-sm text-gray-500">Gerencie o seu plano Hayusten Finance</p>
      </div>

      {/* Estado actual */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Estado actual</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Plano</span>
            <span className="text-sm font-semibold text-gray-900 capitalize">{dados?.plano ?? 'Trial'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Estado</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              estaActivo ? 'bg-emerald-50 text-emerald-700' :
              emTrial ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-600'
            }`}>
              {estaActivo ? 'Activo' : emTrial ? `Trial · ${diasRestantes} dias` : 'Expirado'}
            </span>
          </div>
          {dados?.proximaRenovacao && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Próxima renovação</span>
              <span className="text-sm text-gray-700">{formatarDataCompleta(dados.proximaRenovacao)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de subscrição (apenas em trial) */}
      {(emTrial || !estaActivo) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Cartão do plano */}
          <div className="bg-violet-700 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Plano Premium</h3>
                <p className="text-violet-200 text-sm">Acesso completo a todas as funcionalidades</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">99 MZN</p>
                <p className="text-violet-200 text-xs">/mês</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES_PREMIUM.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-violet-100">
                  <CheckCircle2 size={14} className="text-violet-300 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="p-5 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-700">Método de pagamento</h4>
            <div className="flex flex-col gap-2">
              {[
                { id: 'mpesa', rotulo: 'M-Pesa (Vodacom)', detalhe: 'Pagamento instantâneo' },
                { id: 'emola', rotulo: 'Emola (Movitel)', detalhe: 'Pagamento instantâneo' },
                { id: 'stripe', rotulo: 'Cartão bancário', detalhe: 'Visa, Mastercard' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${
                    metodoPagamento === m.id ? 'border-violet-700 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="metodo"
                    value={m.id}
                    checked={metodoPagamento === m.id}
                    onChange={(e) => setMetodoPagamento(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    metodoPagamento === m.id ? 'border-violet-700' : 'border-gray-300'
                  }`}>
                    {metodoPagamento === m.id && <div className="w-2 h-2 rounded-full bg-violet-700" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.rotulo}</p>
                    <p className="text-xs text-gray-400">{m.detalhe}</p>
                  </div>
                  {m.id === 'stripe' && <ExternalLink size={14} className="text-gray-400 ml-auto" />}
                </label>
              ))}
            </div>

            {/* Campo de número para M-Pesa/Emola */}
            {(metodoPagamento === 'mpesa' || metodoPagamento === 'emola') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Número {metodoPagamento === 'mpesa' ? 'M-Pesa' : 'Emola'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">+258</span>
                  <input
                    type="tel"
                    placeholder="84 000 0000"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            )}

            <Botao variante="primario" tamanho="lg" onClick={aoClicarPagar} carregando={aProcessar} className="w-full">
              {metodoPagamento === 'stripe' ? 'Pagar com cartão' : `Pagar com ${metodoPagamento === 'mpesa' ? 'M-Pesa' : 'Emola'}`}
            </Botao>
          </div>
        </div>
      )}

      {/* Opção de cancelamento (apenas se activo) */}
      {estaActivo && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Cancelar assinatura</h3>
          <p className="text-sm text-gray-500 mb-4">
            A assinatura permanecerá activa até ao fim do período pago. Não serão feitos reembolsos.
          </p>
          <Botao variante="perigo" tamanho="md" onClick={cancelarAssinatura}>
            Cancelar assinatura
          </Botao>
        </div>
      )}

      {/* Histórico de pagamentos */}
      {dados?.historicoPagamentos?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Histórico de pagamentos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Método</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dados.historicoPagamentos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{formatarDataCompleta(p.data)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.metodo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatarMoeda(p.valor, moeda)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.estado === 'pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {p.estado === 'pago' ? 'Pago' : 'Falhou'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
