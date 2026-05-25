import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserCircle, Lock } from 'lucide-react';
import * as perfilServico from '../../servicos/perfil.js';
import useAuthStore from '../../store/authStore.js';
import useTenantStore from '../../store/tenantStore.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { nomeIniciais } from '../../utils/formatadores.js';

const esquemaDados = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
});

const esquemaPassword = z
  .object({
    passwordActual: z.string().min(1, 'Password actual obrigatória.'),
    novaPassword: z.string().min(8, 'A nova password deve ter pelo menos 8 caracteres.'),
    confirmacao: z.string(),
  })
  .refine((d) => d.novaPassword === d.confirmacao, {
    message: 'As passwords não coincidem.',
    path: ['confirmacao'],
  });

export default function Perfil() {
  const { utilizador, definirUtilizador, accessToken } = useAuthStore();
  const { tenant, definirTenant } = useTenantStore();
  const [moeda, setMoeda] = useState(tenant?.moedaPrincipal ?? 'MZN');
  const [relatoriosPorEmail, setRelatoriosPorEmail] = useState(utilizador?.relatoriosPorEmail ?? false);

  const formDados = useForm({
    resolver: zodResolver(esquemaDados),
    defaultValues: { nome: utilizador?.nome ?? '' },
  });

  const formPassword = useForm({ resolver: zodResolver(esquemaPassword) });

  const aoSubmeterDados = async (dados) => {
    try {
      const r = await perfilServico.actualizarPerfil(dados);
      definirUtilizador(r.data.dados, accessToken);
      toast.success('Perfil actualizado.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao actualizar perfil.');
    }
  };

  const aoSubmeterPassword = async (dados) => {
    try {
      await perfilServico.alterarPassword({
        passwordActual: dados.passwordActual,
        novaPassword: dados.novaPassword,
      });
      formPassword.reset();
      toast.success('Password alterada com sucesso.');
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao alterar password.');
    }
  };

  const aoGuardarPreferencias = async () => {
    try {
      const r = await perfilServico.actualizarPreferencias({ moedaPrincipal: moeda, relatoriosPorEmail });
      definirTenant({ ...tenant, moedaPrincipal: r.data.dados.moedaPrincipal });
      toast.success('Preferências guardadas.');
    } catch {
      toast.error('Erro ao guardar preferências.');
    }
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Perfil</h1>
        <p className="text-sm text-gray-500">Gerencie as suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
          <span className="text-violet-700 text-xl font-bold">{nomeIniciais(utilizador?.nome)}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{utilizador?.nome}</p>
          <p className="text-sm text-gray-500">{utilizador?.email}</p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <UserCircle size={16} className="text-violet-700" />
          Informações pessoais
        </h3>
        <form onSubmit={formDados.handleSubmit(aoSubmeterDados)} className="flex flex-col gap-4">
          <Input label="Nome completo" type="text" erro={formDados.formState.errors.nome?.message} {...formDados.register('nome')} />
          <Input label="Email" type="email" value={utilizador?.email ?? ''} disabled />
          <Botao variante="primario" tamanho="md" type="submit" carregando={formDados.formState.isSubmitting} className="self-start">
            Guardar alterações
          </Botao>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-violet-700" />
          Alterar password
        </h3>
        <form onSubmit={formPassword.handleSubmit(aoSubmeterPassword)} className="flex flex-col gap-4">
          <Input label="Password actual" type="password" placeholder="A sua password actual" erro={formPassword.formState.errors.passwordActual?.message} {...formPassword.register('passwordActual')} />
          <Input label="Nova password" type="password" placeholder="Mínimo 8 caracteres" erro={formPassword.formState.errors.novaPassword?.message} {...formPassword.register('novaPassword')} />
          <Input label="Confirmar nova password" type="password" placeholder="Repita a nova password" erro={formPassword.formState.errors.confirmacao?.message} {...formPassword.register('confirmacao')} />
          <Botao variante="primario" tamanho="md" type="submit" carregando={formPassword.formState.isSubmitting} className="self-start">
            Alterar password
          </Botao>
        </form>
      </div>

      {/* Preferências */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Preferências</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Moeda principal</label>
            <select
              value={moeda}
              onChange={(e) => setMoeda(e.target.value)}
              className="w-full max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="MZN">Metical Moçambicano (MZN)</option>
              <option value="USD">Dólar Americano (USD)</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setRelatoriosPorEmail(!relatoriosPorEmail)}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${relatoriosPorEmail ? 'bg-violet-700' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${relatoriosPorEmail ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Receber relatórios mensais por email</span>
          </label>
          <Botao variante="primario" tamanho="md" onClick={aoGuardarPreferencias} className="self-start">
            Guardar preferências
          </Botao>
        </div>
      </div>
    </div>
  );
}
