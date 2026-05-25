import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import * as transacoesServico from '../../servicos/transacoes.js';
import * as contasServico from '../../servicos/contas.js';
import * as categoriasServico from '../../servicos/categorias.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarData } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Modal } from '../../componentes/ui/Modal.jsx';
import Input from '../../componentes/ui/Input.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';
import { Paginacao } from '../../componentes/ui/Paginacao.jsx';

const esquema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  valor: z.coerce.number().positive('Valor deve ser positivo.'),
  contaId: z.string().min(1, 'Seleccione uma conta.'),
  categoriaId: z.string().min(1, 'Seleccione uma categoria.'),
  data: z.string().min(1, 'Data obrigatória.'),
  descricao: z.string().min(1, 'Descrição obrigatória.'),
});

export default function Transacoes() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [transacoes, setTransacoes] = useState([]);
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroContaId, setFiltroContaId] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { tipo: 'despesa', data: new Date().toISOString().slice(0, 10) },
  });

  const carregar = useCallback(() => {
    setCarregando(true);
    Promise.all([
      transacoesServico.listar({ pagina, limite: 15, texto: filtroTexto, tipo: filtroTipo, contaId: filtroContaId }),
      contasServico.listar(),
      categoriasServico.listar(),
    ])
      .then(([tResp, cResp, catResp]) => {
        setTransacoes(tResp.data.dados);
        setTotalPaginas(tResp.data.paginacao?.totalPaginas ?? 1);
        setContas(cResp.data.dados);
        setCategorias(catResp.data.dados);
      })
      .catch(() => toast.error('Erro ao carregar transacções.'))
      .finally(() => setCarregando(false));
  }, [pagina, filtroTexto, filtroTipo, filtroContaId]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNova = () => {
    setAEditar(null);
    reset({ tipo: 'despesa', data: new Date().toISOString().slice(0, 10) });
    setModalAberto(true);
  };

  const abrirEditar = (t) => {
    setAEditar(t);
    reset({
      tipo: t.tipo,
      valor: t.valor,
      contaId: t.contaId,
      categoriaId: t.categoriaId,
      data: t.data?.slice(0, 10),
      descricao: t.descricao,
    });
    setModalAberto(true);
  };

  const aoSubmeter = async (dados) => {
    try {
      if (aEditar) {
        await transacoesServico.actualizar(aEditar.id, dados);
        toast.success('Transacção actualizada.');
      } else {
        await transacoesServico.criar(dados);
        toast.success('Transacção criada.');
      }
      setModalAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao guardar transacção.');
    }
  };

  const aoEliminar = async (id) => {
    if (!confirm('Tem a certeza que pretende eliminar esta transacção?')) return;
    try {
      await transacoesServico.eliminar(id);
      toast.success('Transacção eliminada.');
      carregar();
    } catch {
      toast.error('Erro ao eliminar transacção.');
    }
  };

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transacções</h1>
          <p className="text-sm text-gray-500">Registo de todas as movimentações</p>
        </div>
        <Botao variante="primario" onClick={abrirNova}>
          <Plus size={16} /> Nova transacção
        </Botao>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar…"
            value={filtroTexto}
            onChange={(e) => { setFiltroTexto(e.target.value); setPagina(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select value={filtroContaId} onChange={(e) => { setFiltroContaId(e.target.value); setPagina(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">Todas as contas</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Tabela */}
      {carregando ? (
        <Carregando />
      ) : transacoes.length === 0 ? (
        <EstadoVazio
          icone={ArrowUpRight}
          titulo="Sem transacções"
          descricao="Adicione a sua primeira transacção para começar a controlar as suas finanças."
          acaoLabel="Nova transacção"
          aoClicarAccao={abrirNova}
        />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Conta</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transacoes.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatarData(t.data)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-900 font-medium">{t.descricao}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 hidden sm:table-cell">{t.categoriaNome ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 hidden md:table-cell">{t.contaNome ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.tipo === 'receita' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {t.tipo === 'receita' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 text-sm font-semibold text-right ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.tipo === 'receita' ? '+' : '-'}{formatarMoeda(t.valor, moeda)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => abrirEditar(t)} className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => aoEliminar(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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
          <Paginacao pagina={pagina} totalPaginas={totalPaginas} aoMudarPagina={setPagina} />
        </>
      )}

      {/* Modal de criação/edição */}
      <Modal
        aberto={modalAberto}
        aoFechar={() => setModalAberto(false)}
        titulo={aEditar ? 'Editar transacção' : 'Nova transacção'}
      >
        <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <div className="flex gap-3">
              {['receita', 'despesa'].map((tipo) => (
                <label key={tipo} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={tipo} {...register('tipo')} className="accent-violet-700" />
                  <span className="text-sm text-gray-700 capitalize">{tipo === 'receita' ? 'Receita' : 'Despesa'}</span>
                </label>
              ))}
            </div>
          </div>
          <Input label="Valor" type="number" step="0.01" placeholder="0.00" erro={errors.valor?.message} {...register('valor')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Conta</label>
            <select {...register('contaId')} className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.contaId ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione uma conta</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.contaId && <p className="text-xs text-red-500">{errors.contaId.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Categoria</label>
            <select {...register('categoriaId')} className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.categoriaId ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">Seleccione uma categoria</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.categoriaId && <p className="text-xs text-red-500">{errors.categoriaId.message}</p>}
          </div>
          <Input label="Data" type="date" erro={errors.data?.message} {...register('data')} />
          <Input label="Descrição" type="text" placeholder="Descrição da transacção" erro={errors.descricao?.message} {...register('descricao')} />
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={isSubmitting} className="flex-1">
              {aEditar ? 'Guardar alterações' : 'Criar transacção'}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
