import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '../store/adminStore.js';
import { loginAdmin } from '../servicos/admin.js';

const esquema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Palavra-passe obrigatória'),
  adminKey: z.string().min(1, 'Chave de administração obrigatória'),
});

export default function Login() {
  const [verPassword, setVerPassword] = useState(false);
  const definirAuth = useAdminStore((s) => s.definirAuth);
  const navegar = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
  });

  async function onSubmit(dados) {
    try {
      // O JWT vem do endpoint de auth regular; a adminKey é guardada localmente
      // para ser enviada como X-Admin-Key em todos os pedidos ao painel admin.
      const resposta = await loginAdmin(dados.email, dados.password);
      definirAuth(resposta.dados.accessToken, dados.adminKey);
      navegar('/metricas');
    } catch (erro) {
      const mensagem = erro.response?.data?.mensagem || 'Credenciais inválidas.';
      toast.error(mensagem);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center mb-1">
          Painel de Administração
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Hayusten Finance — Uso interno
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="admin@hayusten.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Palavra-passe
            </label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setVerPassword(!verPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chave de Administração
            </label>
            <input
              type="password"
              {...register('adminKey')}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            {errors.adminKey && (
              <p className="text-xs text-red-600 mt-1">{errors.adminKey.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {isSubmitting ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
