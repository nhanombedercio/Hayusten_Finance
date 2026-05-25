import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { registar } from '../../servicos/auth.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';

const esquema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Email inválido.'),
    password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres.'),
    confirmacao: z.string(),
  })
  .refine((d) => d.password === d.confirmacao, {
    message: 'As passwords não coincidem.',
    path: ['confirmacao'],
  });

export default function Registo() {
  const [emailEnviado, setEmailEnviado] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
  });

  const aoSubmeter = async (dados) => {
    try {
      await registar({ nome: dados.nome, email: dados.email, password: dados.password });
      setEmailEnviado(true);
    } catch (erro) {
      const msg = erro.response?.data?.mensagem ?? 'Erro ao criar conta. Tente novamente.';
      toast.error(msg);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifique o seu email</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enviámos um link de confirmação para o seu email. Clique no link para activar a sua conta.
          </p>
          <Link to="/login" className="text-violet-700 text-sm font-medium hover:underline">
            Voltar ao início de sessão
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-700 mb-4">
            <span className="text-white font-bold text-lg">HF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Começa gratuitamente por 14 dias</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              type="text"
              placeholder="Ana Beatriz Silva"
              icone={User}
              erro={errors.nome?.message}
              {...register('nome')}
            />
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
              placeholder="Mínimo 8 caracteres"
              icone={Lock}
              erro={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar password"
              type="password"
              placeholder="Repita a password"
              icone={Lock}
              erro={errors.confirmacao?.message}
              {...register('confirmacao')}
            />

            <Botao variante="primario" tamanho="lg" type="submit" carregando={isSubmitting} className="w-full mt-1">
              Criar conta
            </Botao>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-violet-700 font-medium hover:underline">
            Iniciar sessão
          </Link>
        </p>
      </div>
    </div>
  );
}
