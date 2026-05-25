import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { confirmarEmail } from '../../servicos/auth.js';
import { Botao } from '../../componentes/ui/Botao.jsx';

export default function ConfirmarEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('carregando'); // carregando | sucesso | erro

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setEstado('erro');
      return;
    }

    confirmarEmail(token)
      .then(() => setEstado('sucesso'))
      .catch(() => setEstado('erro'));
  }, [params]);

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-violet-700" />
          <p className="text-gray-600">A confirmar o seu email…</p>
        </div>
      </div>
    );
  }

  if (estado === 'sucesso') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email confirmado!</h1>
          <p className="text-sm text-gray-500 mb-6">
            A sua conta está activa. Vamos configurar o seu espaço financeiro.
          </p>
          <Botao variante="primario" tamanho="lg" onClick={() => navigate('/configuracao-inicial')}>
            Continuar
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <XCircle size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
        <p className="text-sm text-gray-500 mb-6">
          O link de confirmação é inválido ou expirou. Faça login para receber um novo link.
        </p>
        <Botao variante="primario" tamanho="lg" onClick={() => navigate('/login')}>
          Ir para o início de sessão
        </Botao>
      </div>
    </div>
  );
}
