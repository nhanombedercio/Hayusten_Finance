import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { login } from '../../servicos/auth.js';
import useAuthStore from '../../store/authStore.js';
import useTenantStore from '../../store/tenantStore.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';

const esquema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Password obrigatória.'),
});

export default function Login() {
  const navigate = useNavigate();
  const { definirUtilizador } = useAuthStore();
  const { definirTenant } = useTenantStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
  });

  const aoSubmeter = async (dados) => {
    try {
      const resposta = await login(dados.email, dados.password);
      const { utilizador, tenant, accessToken } = resposta.data.dados;

      definirUtilizador(utilizador, accessToken);
      definirTenant(tenant);

      // Redireccionamento baseado no estado do tenant após login.
      if (tenant.estado === 'suspenso') return navigate('/conta-suspensa');
      if (tenant.estado === 'trial_expirado') return navigate('/trial-expirado');
      if (!tenant.configurado) return navigate('/configuracao-inicial');
      navigate('/dashboard');
    } catch (erro) {
      const msg = erro.response?.data?.mensagem ?? 'Erro ao iniciar sessão. Tente novamente.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-700 mb-4">
            <span className="text-white font-bold text-lg">HF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="text-sm text-gray-500 mt-1">Inicie sessão na sua conta Hayusten Finance</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="nome@exemplo.com"
              icone={Mail}
              erro={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="A sua password"
              icone={Lock}
              erro={errors.password?.message}
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link to="/recuperar-password" className="text-xs text-violet-700 hover:underline">
                Esqueceu a password?
              </Link>
            </div>

            <Botao variante="primario" tamanho="lg" type="submit" carregando={isSubmitting} className="w-full">
              Iniciar sessão
            </Botao>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <Link to="/registo" className="text-violet-700 font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
