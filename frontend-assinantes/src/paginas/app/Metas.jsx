import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Target, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';
import * as metasServico from '../../servicos/metas.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarData } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Modal } from '../../componentes/ui/Modal.jsx';
import Input from '../../componentes/ui/Input.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const esquemaMeta = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  valorObjectivo: z.coerce.number().positive('Valor deve ser positivo.'),
  dataLimite: z.string().optional(),
});

const esquemaContribuicao = z.object({
  valor: z.coerce.number().positive('Valor deve ser positivo.'),
  descricao: z.string().optional(),
  data: z.string().min(1, 'Data obrigatória.'),
});

const estadosCores = {
  activa: 'bg-violet-50 text-violet-700',
  concluida: 'bg-emerald-50 text-emerald-700',
  cancelada: 'bg-gray-100 text-gray-500',
};

const estadosRotulos = { activa: 'Activa', concluida: 'Concluída', cancelada: 'Cancelada' };

function CartaoMeta({ meta, moeda, aoEditar, aoEliminar, aoAdicionarContribuicao }) {
  const [expandido, setExpandido] = useState(false);
  const pct = Math.min(100, (meta.valorActual / meta.valorObjectivo) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{meta.nome}</h3>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${estadosCores[meta.estado] ?? estadosCores.activa}`}>
                {estadosRotulos[meta.estado] ?? meta.estado}
              </span>
            </div>
            {meta.dataLimite && (
              <p className="text-xs text-gray-400">Limite: {formatarData(meta.dataLimite)}</p>
            )}
          </div>
          <div className="flex gap-1 ml-2 shrink-0">
            {meta.estado === 'activa' && (
              <button onClick={() => aoAdicionarContribuicao(meta)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Adicionar contribuição">
                <PlusCircle size={14} />
              </button>
            )}
            <button onClick={() => aoEditar(meta)} className="p-1.5 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => aoEliminar(meta.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-2">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-violet-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-500">{formatarMoeda(meta.valorActual, moeda)}</span>
            <span className="text-xs font-medium text-gray-700">{pct.toFixed(0)}% · {formatarMoeda(meta.valorObjectivo, moeda)}</span>
          </div>
        </div>

        {/* Histórico de contribuições (expansível) */}
        {meta.contribuicoes?.length > 0 && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
          >
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {meta.contribuicoes.length} contribuição{meta.contribuicoes.length !== 1 ? 'ões' : ''}
          </button>
        )}

        {expandido && meta.contribuicoes?.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {meta.contribuicoes.map((c) => (
              <div key={c.id} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600">{c.descricao || 'Contribuição'} · {formatarData(c.data)}</span>
                <span className="font-medium text-emerald-600">+{formatarMoeda(c.valor, moeda)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Metas() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [modalContribAberto, setModalContribAberto] = useState(false);
  const [aEditar, setAEditar] = useState(null);
  const [metaParaContrib, setMetaParaContrib] = useState(null);
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);

  const formMeta = useForm({ resolver: zodResolver(esquemaMeta) });
  const formContrib = useForm({
    resolver: zodResolver(esquemaContribuicao),
    defaultValues: { data: new Date().toISOString().slice(0, 10) },
  });

  const carregar = useCallback(() => {
    setCarregando(true);
    metasServico.listar()
      .then((r) => setMetas(r.data.dados))
      .catch(() => toast.error('Erro ao carregar metas.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovaMeta = () => {
    setAEditar(null);
    formMeta.reset({});
    setModalMetaAberto(true);
  };

  const abrirEditarMeta = (m) => {
    setAEditar(m);
    formMeta.reset({ nome: m.nome, valorObjectivo: m.valorObjectivo, dataLimite: m.dataLimite?.slice(0, 10) });
    setModalMetaAberto(true);
  };

  const aoSubmeterMeta = async (dados) => {
    try {
      if (aEditar) {
        await metasServico.actualizar(aEditar.id, dados);
        toast.success('Meta actualizada.');
      } else {
        await metasServico.criar(dados);
        toast.success('Meta criada.');
      }
      setModalMetaAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao guardar meta.');
    }
  };

  const aoEliminarMeta = async (id) => {
    if (!confirm('Tem a certeza que pretende eliminar esta meta?')) return;
    try {
      await metasServico.eliminar(id);
      toast.success('Meta eliminada.');
      carregar();
    } catch {
      toast.error('Erro ao eliminar meta.');
    }
  };

  const abrirContribuicao = (meta) => {
    setMetaParaContrib(meta);
    formContrib.reset({ data: new Date().toISOString().slice(0, 10) });
    setModalContribAberto(true);
  };

  const aoSubmeterContribuicao = async (dados) => {
    try {
      await metasServico.adicionarContribuicao(metaParaContrib.id, dados);
      toast.success('Contribuição adicionada.');
      setModalContribAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao adicionar contribuição.');
    }
  };

  const metasActivas = metas.filter((m) => m.estado === 'activa');
  const metasInactivas = metas.filter((m) => m.estado !== 'activa');

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Metas</h1>
          <p className="text-sm text-gray-500">Acompanhe os seus objectivos financeiros</p>
        </div>
        <Botao variante="primario" onClick={abrirNovaMeta}>
          <Plus size={16} /> Nova meta
        </Botao>
      </div>

      {carregando ? (
        <Carregando />
      ) : metas.length === 0 ? (
        <EstadoVazio
          icone={Target}
          titulo="Sem metas"
          descricao="Defina objectivos financeiros e acompanhe o seu progresso."
          acaoLabel="Nova meta"
          aoClicarAccao={abrirNovaMeta}
        />
      ) : (
        <>
          {/* Metas activas */}
          {metasActivas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metasActivas.map((m) => (
                <CartaoMeta key={m.id} meta={m} moeda={moeda}
                  aoEditar={abrirEditarMeta}
                  aoEliminar={aoEliminarMeta}
                  aoAdicionarContribuicao={abrirContribuicao}
                />
              ))}
            </div>
          )}

          {/* Metas concluídas/canceladas */}
          {metasInactivas.length > 0 && (
            <div>
              <button
                onClick={() => setMostrarConcluidas(!mostrarConcluidas)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {mostrarConcluidas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {metasInactivas.length} meta{metasInactivas.length !== 1 ? 's' : ''} concluída{metasInactivas.length !== 1 ? 's' : ''}/cancelada{metasInactivas.length !== 1 ? 's' : ''}
              </button>
              {mostrarConcluidas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 opacity-60">
                  {metasInactivas.map((m) => (
                    <CartaoMeta key={m.id} meta={m} moeda={moeda}
                      aoEditar={abrirEditarMeta}
                      aoEliminar={aoEliminarMeta}
                      aoAdicionarContribuicao={abrirContribuicao}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de meta */}
      <Modal aberto={modalMetaAberto} aoFechar={() => setModalMetaAberto(false)} titulo={aEditar ? 'Editar meta' : 'Nova meta'}>
        <form onSubmit={formMeta.handleSubmit(aoSubmeterMeta)} className="flex flex-col gap-4">
          <Input label="Nome da meta" type="text" placeholder="ex: Fundo de emergência" erro={formMeta.formState.errors.nome?.message} {...formMeta.register('nome')} />
          <Input label="Valor objectivo" type="number" step="0.01" placeholder="0.00" erro={formMeta.formState.errors.valorObjectivo?.message} {...formMeta.register('valorObjectivo')} />
          <Input label="Data limite (opcional)" type="date" {...formMeta.register('dataLimite')} />
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalMetaAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={formMeta.formState.isSubmitting} className="flex-1">
              {aEditar ? 'Guardar' : 'Criar meta'}
            </Botao>
          </div>
        </form>
      </Modal>

      {/* Modal de contribuição */}
      <Modal aberto={modalContribAberto} aoFechar={() => setModalContribAberto(false)} titulo={`Contribuição: ${metaParaContrib?.nome ?? ''}`}>
        <form onSubmit={formContrib.handleSubmit(aoSubmeterContribuicao)} className="flex flex-col gap-4">
          <Input label="Valor" type="number" step="0.01" placeholder="0.00" erro={formContrib.formState.errors.valor?.message} {...formContrib.register('valor')} />
          <Input label="Descrição (opcional)" type="text" placeholder="ex: Poupança de Janeiro" {...formContrib.register('descricao')} />
          <Input label="Data" type="date" erro={formContrib.formState.errors.data?.message} {...formContrib.register('data')} />
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalContribAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={formContrib.formState.isSubmitting} className="flex-1">Adicionar</Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
