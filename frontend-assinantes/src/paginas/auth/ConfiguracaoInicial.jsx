import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Wallet, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { configurarInicial } from '../../servicos/auth.js';
import * as contasServico from '../../servicos/contas.js';
import useTenantStore from '../../store/tenantStore.js';
import Input from '../../componentes/ui/Input.jsx';
import { Botao } from '../../componentes/ui/Botao.jsx';

const esquemaPasso1 = z.object({
  nomeConta: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
});

const esquemaPasso3 = z.object({
  nomePrimeiraConta: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  tipoConta: z.enum(['banco', 'dinheiro', 'mobile_money']),
});

const tiposConta = [
  { valor: 'banco', rotulo: 'Conta bancária' },
  { valor: 'dinheiro', rotulo: 'Dinheiro em mão' },
  { valor: 'mobile_money', rotulo: 'Mobile Money (M-Pesa/Emola)' },
];

export default function ConfiguracaoInicial() {
  const navigate = useNavigate();
  const { definirTenant } = useTenantStore();
  const [passo, setPasso] = useState(1);
  const [moeda, setMoeda] = useState('MZN');
  const [nomeConta, setNomeConta] = useState('');
  const [aSubmeter, setASubmeter] = useState(false);

  const formPasso1 = useForm({ resolver: zodResolver(esquemaPasso1) });
  const formPasso3 = useForm({
    resolver: zodResolver(esquemaPasso3),
    defaultValues: { tipoConta: 'mobile_money' },
  });

  const avancarPasso1 = (dados) => {
    setNomeConta(dados.nomeConta);
    setPasso(2);
  };

  const avancarPasso2 = () => setPasso(3);

  const aoSubmeterFinal = async (dados) => {
    setASubmeter(true);
    try {
      // Configura o tenant com o nome e moeda principal.
      const respTenant = await configurarInicial({ nomeConta, moedaPrincipal: moeda });
      definirTenant(respTenant.data.dados);

      // Cria a primeira conta financeira do utilizador.
      await contasServico.criar({
        nome: dados.nomePrimeiraConta,
        tipo: dados.tipoConta,
        saldoInicial: 0,
      });

      toast.success('Conta configurada com sucesso!');
      navigate('/dashboard');
    } catch (erro) {
      const msg = erro.response?.data?.mensagem ?? 'Erro ao configurar a conta.';
      toast.error(msg);
    } finally {
      setASubmeter(false);
    }
  };

  const indicadorPassos = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((p) => (
        <div key={p} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            p < passo ? 'bg-violet-700 text-white' :
            p === passo ? 'bg-violet-700 text-white ring-2 ring-violet-200' :
            'bg-gray-100 text-gray-400'
          }`}>
            {p < passo ? <Check size={14} /> : p}
          </div>
          {p < 3 && <div className={`w-8 h-0.5 ${p < passo ? 'bg-violet-700' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-700 mb-4">
            <span className="text-white font-bold text-lg">HF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração inicial</h1>
          <p className="text-sm text-gray-500 mt-1">Vamos preparar o seu espaço financeiro</p>
        </div>

        {indicadorPassos}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Passo 1: Nome da conta */}
          {passo === 1 && (
            <form onSubmit={formPasso1.handleSubmit(avancarPasso1)} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Como se chama a sua conta?</h2>
                <p className="text-sm text-gray-500">Este é o nome do seu espaço financeiro pessoal.</p>
              </div>
              <Input
                label="Nome da conta"
                placeholder="ex: Finanças do João"
                erro={formPasso1.formState.errors.nomeConta?.message}
                {...formPasso1.register('nomeConta')}
              />
              <Botao variante="primario" tamanho="lg" type="submit" className="w-full">
                Continuar <ChevronRight size={16} />
              </Botao>
            </form>
          )}

          {/* Passo 2: Moeda principal */}
          {passo === 2 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Qual é a sua moeda principal?</h2>
                <p className="text-sm text-gray-500">Usada em relatórios e no dashboard.</p>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { valor: 'MZN', rotulo: 'Metical Moçambicano (MZN)', detalhe: 'Moçambique' },
                  { valor: 'USD', rotulo: 'Dólar Americano (USD)', detalhe: 'Internacional' },
                ].map((m) => (
                  <label
                    key={m.valor}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      moeda === m.valor ? 'border-violet-700 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="moeda"
                      value={m.valor}
                      checked={moeda === m.valor}
                      onChange={(e) => setMoeda(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      moeda === m.valor ? 'border-violet-700' : 'border-gray-300'
                    }`}>
                      {moeda === m.valor && <div className="w-2 h-2 rounded-full bg-violet-700" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{m.rotulo}</p>
                      <p className="text-xs text-gray-500">{m.detalhe}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <Botao variante="secundario" tamanho="lg" onClick={() => setPasso(1)} className="flex-1">
                  <ChevronLeft size={16} /> Voltar
                </Botao>
                <Botao variante="primario" tamanho="lg" onClick={avancarPasso2} className="flex-1">
                  Continuar <ChevronRight size={16} />
                </Botao>
              </div>
            </div>
          )}

          {/* Passo 3: Primeira conta financeira */}
          {passo === 3 && (
            <form onSubmit={formPasso3.handleSubmit(aoSubmeterFinal)} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Adicione a sua primeira conta</h2>
                <p className="text-sm text-gray-500">Pode adicionar mais contas depois.</p>
              </div>
              <Input
                label="Nome da conta"
                placeholder="ex: M-Pesa pessoal"
                icone={Wallet}
                erro={formPasso3.formState.errors.nomePrimeiraConta?.message}
                {...formPasso3.register('nomePrimeiraConta')}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tipo de conta</label>
                <div className="flex flex-col gap-2">
                  {tiposConta.map((t) => (
                    <label
                      key={t.valor}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formPasso3.watch('tipoConta') === t.valor
                          ? 'border-violet-700 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={t.valor}
                        {...formPasso3.register('tipoConta')}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formPasso3.watch('tipoConta') === t.valor ? 'border-violet-700' : 'border-gray-300'
                      }`}>
                        {formPasso3.watch('tipoConta') === t.valor && (
                          <div className="w-2 h-2 rounded-full bg-violet-700" />
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{t.rotulo}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Botao variante="secundario" tamanho="lg" onClick={() => setPasso(2)} className="flex-1" type="button">
                  <ChevronLeft size={16} /> Voltar
                </Botao>
                <Botao variante="primario" tamanho="lg" type="submit" carregando={aSubmeter} className="flex-1">
                  Concluir
                </Botao>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
