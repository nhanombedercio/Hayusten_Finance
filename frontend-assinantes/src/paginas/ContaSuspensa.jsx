import { useNavigate } from 'react-router-dom';
import { ShieldOff, Mail, ExternalLink } from 'lucide-react';
import useAuthStore from '../store/authStore.js';
import useTenantStore from '../store/tenantStore.js';
import { Botao } from '../componentes/ui/Botao.jsx';

export default function ContaSuspensa() {
  const navigate = useNavigate();
  const { limparAuth } = useAuthStore();
  const { limparTenant } = useTenantStore();

  const sair = () => {
    limparAuth();
    limparTenant();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <ShieldOff size={28} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta suspensa</h1>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          O acesso à sua conta foi suspenso temporariamente devido a um pagamento em falta ou violação dos termos de utilização.
        </p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 text-left">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Para regularizar a sua situação:</h3>
          <ol className="flex flex-col gap-2.5">
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              Verifique se existe algum pagamento pendente na sua conta M-Pesa, Emola ou cartão.
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              Contacte o nosso suporte indicando o seu email de registo.
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              Após confirmação do pagamento, a conta será reactivada em até 24 horas.
            </li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="mailto:suporte@hayusten.com"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-700 text-white rounded-lg text-sm font-medium hover:bg-violet-800 transition-colors"
          >
            <Mail size={16} />
            Contactar suporte
          </a>
          <Botao variante="secundario" tamanho="md" onClick={sair} className="w-full">
            Sair da conta
          </Botao>
        </div>
      </div>
    </div>
  );
}
