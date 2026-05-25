import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2, Repeat2, ArrowRight } from 'lucide-react';
import * as transferenciasServico from '../../servicos/transferencias.js';
import * as contasServico from '../../servicos/contas.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarData } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Modal } from '../../componentes/ui/Modal.jsx';
import Input from '../../componentes/ui/Input.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const esquema = z.object({
  contaOrigemId: z.string().min(1, 'Seleccione a conta de origem.'),
  contaDestinoId: z.string().min(1, 'Seleccione a conta de destino.'),
  valor: z.coerce.number().positive('Valor deve ser positivo.'),
  data: z.string().min(1, 'Data obrigatória.'),
  descricao: z.string().optional(),
}).refine((d) => d.contaOrigemId !== d.contaDestinoId, {
  message: 'A conta de origem e destino não podem ser iguais.',
  path: ['contaDestinoId'],
});

export default function Transferencias() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [transferencias, setTransferencias] = useState([]);
  const [contas, setContas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { data: new Date().toISOString().slice(0, 10) },
  });

  const carregar = useCallback(() => {
    setCarregando(true);
    Promise.all([transferenciasServico.listar(), contasServico.listar()])
      .then(([tResp, cResp]) => {
        setTransferencias(tResp.data.dados);
        setContas(cResp.data.dados);
      })
      .catch(() => toast.error('Erro ao carregar transferências.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNova = () => {
    reset({ data: new Date().toISOString().slice(0, 10) });
    setModalAberto(true);
  };

  const aoSubmeter = async (dados) => {
    try {
      await transferenciasServico.criar(dados);
      toast.success('Transferência registada.');
      setModalAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao criar transferência.');
    }
  };

  const aoEliminar = async (id) => {
    if (!confirm('Tem a certeza que pretende eliminar esta transferência?')) return;
    try {
      await transferenciasServico.eliminar(id);
      toast.success('Transferência eliminada.');
      carregar();
    } catch {
      toast.error('Erro ao eliminar transferência.');
    }
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transferências</h1>
          <p className="text-sm text-gray-500">Movimentações entre as suas contas</p>
        </div>
        <Botao variante="primario" onClick={abrirNova}>
          <Plus size={16} /> Nova transferência
        </Botao>
      </div>

      {carregando ? (
        <Carregando />
      ) : transferencias.length === 0 ? (
        <EstadoVazio
          icone={Repeat2}
          titulo="Sem transferências"
          descricao="Registe movimentações entre as suas contas."
          acaoLabel="Nova transferência"
          aoClicarAccao={abrirNova}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">De → Para</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Descrição</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transferencias.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatarData(t.data)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-700">{t.contaOrigemNome}</span>
                        <ArrowRight size={12} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700">{t.contaDestinoNome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 hidden sm:table-cell">{t.descricao || '—'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-violet-700 text-right">{formatarMoeda(t.valor, moeda)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <button onClick={() => aoEliminar(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Nova transferência">
        <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Conta de origem</label>
            <select {...register('contaOrigemId')} className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.contaOrigemId ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.contaOrigemId && <p className="text-xs text-red-500">{errors.contaOrigemId.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Conta de destino</label>
            <select {...register('contaDestinoId')} className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.contaDestinoId ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.contaDestinoId && <p className="text-xs text-red-500">{errors.contaDestinoId.message}</p>}
          </div>
          <Input label="Valor" type="number" step="0.01" placeholder="0.00" erro={errors.valor?.message} {...register('valor')} />
          <Input label="Data" type="date" erro={errors.data?.message} {...register('data')} />
          <Input label="Descrição (opcional)" type="text" placeholder="ex: Poupança mensal" {...register('descricao')} />
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={isSubmitting} className="flex-1">Registar</Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
