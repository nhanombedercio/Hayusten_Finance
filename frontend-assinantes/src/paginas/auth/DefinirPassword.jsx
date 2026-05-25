import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { definirPassword } from '../../servicos/auth.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';

const esquema = z
  .object({
    password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres.'),
    confirmacao: z.string(),
  })
  .refine((d) => d.password === d.confirmacao, {
    message: 'As passwords não coincidem.',
    path: ['confirmacao'],
  });

export default function DefinirPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
  });

  const aoSubmeter = async (dados) => {
    if (!token) {
      toast.error('Link inválido. Solicite um novo link de recuperação.');
      return;
    }
    try {
      await definirPassword(token, dados.password);
      toast.success('Password alterada com sucesso!');
      navigate('/login');
    } catch (erro) {
      const msg = erro.response?.data?.mensagem ?? 'Erro ao definir password. O link pode ter expirado.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Nova password</h1>
          <p className="text-sm text-gray-500 mt-1">Defina a sua nova password de acesso.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
            <Input
              label="Nova password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              icone={Lock}
              erro={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar nova password"
              type="password"
              placeholder="Repita a nova password"
              icone={Lock}
              erro={errors.confirmacao?.message}
              {...register('confirmacao')}
            />
            <Botao variante="primario" tamanho="lg" type="submit" carregando={isSubmitting} className="w-full">
              Guardar nova password
            </Botao>
          </form>
        </div>
      </div>
    </div>
  );
}
