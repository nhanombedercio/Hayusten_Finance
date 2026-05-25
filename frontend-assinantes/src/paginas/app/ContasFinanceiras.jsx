import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Wallet, Banknote, Smartphone } from 'lucide-react';
import * as contasServico from '../../servicos/contas.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Modal } from '../../componentes/ui/Modal.jsx';
import Input from '../../componentes/ui/Input.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const esquema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  tipo: z.enum(['banco', 'dinheiro', 'mobile_money']),
  saldoInicial: z.coerce.number().default(0),
});

const iconesPorTipo = {
  banco: Wallet,
  dinheiro: Banknote,
  mobile_money: Smartphone,
};

const rotulosTipo = {
  banco: 'Banco',
  dinheiro: 'Dinheiro',
  mobile_money: 'Mobile Money',
};

export default function ContasFinanceiras() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { tipo: 'banco', saldoInicial: 0 },
  });

  const carregar = useCallback(() => {
    setCarregando(true);
    contasServico.listar()
      .then((r) => setContas(r.data.dados))
      .catch(() => toast.error('Erro ao carregar contas.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNova = () => {
    setAEditar(null);
    reset({ tipo: 'banco', saldoInicial: 0 });
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setAEditar(c);
    reset({ nome: c.nome, tipo: c.tipo, saldoInicial: c.saldoActual });
    setModalAberto(true);
  };

  const aoSubmeter = async (dados) => {
    try {
      if (aEditar) {
        await contasServico.actualizar(aEditar.id, { nome: dados.nome, tipo: dados.tipo });
        toast.success('Conta actualizada.');
      } else {
        await contasServico.criar(dados);
        toast.success('Conta criada.');
      }
      setModalAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao guardar conta.');
    }
  };

  const aoEliminar = async (id) => {
    if (!confirm('Tem a certeza? Esta acção eliminará também todas as transacções associadas.')) return;
    try {
      await contasServico.eliminar(id);
      toast.success('Conta eliminada.');
      carregar();
    } catch {
      toast.error('Erro ao eliminar conta.');
    }
  };

  const tipoVigiado = watch('tipo');

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contas</h1>
          <p className="text-sm text-gray-500">Gerencie as suas contas financeiras</p>
        </div>
        <Botao variante="primario" onClick={abrirNova}>
          <Plus size={16} /> Nova conta
        </Botao>
      </div>

      {carregando ? (
        <Carregando />
      ) : contas.length === 0 ? (
        <EstadoVazio
          icone={Wallet}
          titulo="Sem contas"
          descricao="Adicione a sua primeira conta financeira."
          acaoLabel="Nova conta"
          aoClicarAccao={abrirNova}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((c) => {
            const Icone = iconesPorTipo[c.tipo] ?? Wallet;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Icone size={20} className="text-violet-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{c.nome}</p>
                      <p className="text-xs text-gray-400">{rotulosTipo[c.tipo]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(c)} className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => aoEliminar(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs text-gray-400 mb-0.5">Saldo actual</p>
                  <p className={`text-lg font-bold ${c.saldoActual >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                    {formatarMoeda(c.saldoActual, moeda)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo={aEditar ? 'Editar conta' : 'Nova conta'}>
        <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
          <Input label="Nome da conta" type="text" placeholder="ex: M-Pesa pessoal" erro={errors.nome?.message} {...register('nome')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <div className="flex flex-col gap-2">
              {Object.entries(rotulosTipo).map(([val, rot]) => (
                <label key={val} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${tipoVigiado === val ? 'border-violet-700 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value={val} {...register('tipo')} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${tipoVigiado === val ? 'border-violet-700' : 'border-gray-300'}`}>
                    {tipoVigiado === val && <div className="w-2 h-2 rounded-full bg-violet-700" />}
                  </div>
                  <span className="text-sm text-gray-700">{rot}</span>
                </label>
              ))}
            </div>
          </div>
          {!aEditar && (
            <Input label="Saldo inicial" type="number" step="0.01" placeholder="0.00" erro={errors.saldoInicial?.message} {...register('saldoInicial')} />
          )}
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={isSubmitting} className="flex-1">
              {aEditar ? 'Guardar' : 'Criar conta'}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
