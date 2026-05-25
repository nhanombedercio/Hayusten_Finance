import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2 } from 'lucide-react';
import { recuperarPassword } from '../../servicos/auth.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';

const esquema = z.object({
  email: z.string().email('Email inválido.'),
});

export default function RecuperarPassword() {
  const [enviado, setEnviado] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
  });

  const aoSubmeter = async (dados) => {
    try {
      await recuperarPassword(dados.email);
      setEnviado(true);
    } catch {
      // Não revelamos se o email existe ou não por motivos de segurança.
      setEnviado(true);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email enviado</h1>
          <p className="text-sm text-gray-500 mb-6">
            Se existir uma conta com esse email, receberá instruções para redefinir a password.
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
          <h1 className="text-2xl font-bold text-gray-900">Recuperar password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Indique o seu email e enviamos as instruções de recuperação.
          </p>
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
            <Botao variante="primario" tamanho="lg" type="submit" carregando={isSubmitting} className="w-full">
              Enviar instruções
            </Botao>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-violet-700 font-medium hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    </div>
  );
}
