import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import * as assinaturaServico from '../servicos/assinatura.js';
import useAuthStore from '../store/authStore.js';
import useTenantStore from '../store/tenantStore.js';
import { useNavigate } from 'react-router-dom';
import { Botao } from '../componentes/ui/Botao.jsx';

const FEATURES_PREMIUM = [
  'Contas ilimitadas',
  'Categorias ilimitadas',
  'Análise IA avançada',
  'Relatórios PDF e Excel',
  'Histórico completo',
  'Suporte prioritário',
];

export default function TrialExpirado() {
  const navigate = useNavigate();
  const { limparAuth } = useAuthStore();
  const { limparTenant } = useTenantStore();
  const [metodoPagamento, setMetodoPagamento] = useState('mpesa');
  const [numero, setNumero] = useState('');
  const [aProcessar, setAProcessar] = useState(false);

  const sair = () => {
    limparAuth();
    limparTenant();
    navigate('/login');
  };

  const assinarComMpesa = async () => {
    if (!numero.trim()) { toast.error('Indique o número M-Pesa.'); return; }
    setAProcessar(true);
    try {
      await assinaturaServico.iniciarMpesa(numero);
      toast.success('Pedido enviado para o M-Pesa. Confirme no telemóvel.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao iniciar pagamento.');
    } finally {
      setAProcessar(false);
    }
  };

  const assinarComEmola = async () => {
    if (!numero.trim()) { toast.error('Indique o número Emola.'); return; }
    setAProcessar(true);
    try {
      await assinaturaServico.iniciarEmola(numero);
      toast.success('Pedido enviado para o Emola. Confirme no telemóvel.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao iniciar pagamento.');
    } finally {
      setAProcessar(false);
    }
  };

  const assinarComStripe = async () => {
    setAProcessar(true);
    try {
      const r = await assinaturaServico.criarSessaoStripe('premium');
      window.location.href = r.data.dados.url;
    } catch {
      toast.error('Erro ao iniciar pagamento com cartão.');
      setAProcessar(false);
    }
  };

  const aoClicarPagar = () => {
    if (metodoPagamento === 'mpesa') assinarComMpesa();
    else if (metodoPagamento === 'emola') assinarComEmola();
    else assinarComStripe();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Mensagem de expiração */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Clock size={28} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Período de teste expirado</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            O seu período de teste de 14 dias terminou. Subscreva o plano Premium para continuar a aceder a todas as funcionalidades.
          </p>
        </div>

        {/* Cartão do plano */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="bg-violet-700 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Plano Premium</h3>
                <p className="text-violet-200 text-sm">Acesso completo sem restrições</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">99 MZN</p>
                <p className="text-violet-200 text-sm">/mês</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {FEATURES_PREMIUM.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-violet-100">
                  <CheckCircle2 size={14} className="text-violet-300 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-gray-700">Método de pagamento</h4>
            <div className="flex flex-col gap-2">
              {[
                { id: 'mpesa', rotulo: 'M-Pesa (Vodacom)' },
                { id: 'emola', rotulo: 'Emola (Movitel)' },
                { id: 'stripe', rotulo: 'Cartão bancário' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    metodoPagamento === m.id ? 'border-violet-700 bg-violet-50' : 'border-gray-200'
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
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${metodoPagamento === m.id ? 'border-violet-700' : 'border-gray-300'}`}>
                    {metodoPagamento === m.id && <div className="w-2 h-2 rounded-full bg-violet-700" />}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{m.rotulo}</span>
                  {m.id === 'stripe' && <ExternalLink size={12} className="text-gray-400 ml-auto" />}
                </label>
              ))}
            </div>

            {(metodoPagamento === 'mpesa' || metodoPagamento === 'emola') && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">+258</span>
                <input
                  type="tel"
                  placeholder="84 000 0000"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}

            <Botao variante="primario" tamanho="lg" onClick={aoClicarPagar} carregando={aProcessar} className="w-full">
              Subscrever por 99 MZN/mês
            </Botao>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400">
          <button onClick={sair} className="text-gray-500 hover:underline">
            Sair da conta
          </button>
        </p>
      </div>
    </div>
  );
}
