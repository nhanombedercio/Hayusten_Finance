import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Tags } from 'lucide-react';
import * as categoriasServico from '../../servicos/categorias.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Modal } from '../../componentes/ui/Modal.jsx';
import Input from '../../componentes/ui/Input.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';
import { EstadoVazio } from '../../componentes/ui/EstadoVazio.jsx';

const esquema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  tipo: z.enum(['receita', 'despesa']),
});

function SecaoCategorias({ titulo, categorias, cor, aoEditar, aoEliminar }) {
  return (
    <div>
      <h3 className={`text-sm font-semibold mb-3 ${cor}`}>{titulo}</h3>
      {categorias.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhuma categoria ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-sm text-gray-800">{c.nome}</span>
              <div className="flex gap-0.5 ml-1">
                <button onClick={() => aoEditar(c)} className="p-1 text-gray-300 hover:text-violet-600 rounded transition-colors"><Edit2 size={12} /></button>
                <button onClick={() => aoEliminar(c.id)} className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState(null);
  const [tipoPreenchido, setTipoPreenchido] = useState('despesa');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { tipo: 'despesa' },
  });

  const carregar = useCallback(() => {
    setCarregando(true);
    categoriasServico.listar()
      .then((r) => setCategorias(r.data.dados))
      .catch(() => toast.error('Erro ao carregar categorias.'))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNova = (tipo = 'despesa') => {
    setAEditar(null);
    setTipoPreenchido(tipo);
    reset({ tipo });
    setModalAberto(true);
  };

  const abrirEditar = (c) => {
    setAEditar(c);
    setTipoPreenchido(c.tipo);
    reset({ nome: c.nome, tipo: c.tipo });
    setModalAberto(true);
  };

  const aoSubmeter = async (dados) => {
    try {
      if (aEditar) {
        await categoriasServico.actualizar(aEditar.id, dados);
        toast.success('Categoria actualizada.');
      } else {
        await categoriasServico.criar(dados);
        toast.success('Categoria criada.');
      }
      setModalAberto(false);
      carregar();
    } catch (erro) {
      toast.error(erro.response?.data?.mensagem ?? 'Erro ao guardar categoria.');
    }
  };

  const aoEliminar = async (id) => {
    if (!confirm('Tem a certeza que pretende eliminar esta categoria?')) return;
    try {
      await categoriasServico.eliminar(id);
      toast.success('Categoria eliminada.');
      carregar();
    } catch {
      toast.error('Erro ao eliminar categoria. Pode estar a ser utilizada em transacções.');
    }
  };

  const receitas = categorias.filter((c) => c.tipo === 'receita');
  const despesas = categorias.filter((c) => c.tipo === 'despesa');

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500">Organize as suas transacções por categoria</p>
        </div>
        <Botao variante="primario" onClick={() => abrirNova()}>
          <Plus size={16} /> Nova categoria
        </Botao>
      </div>

      {carregando ? (
        <Carregando />
      ) : categorias.length === 0 ? (
        <EstadoVazio
          icone={Tags}
          titulo="Sem categorias"
          descricao="Crie categorias para organizar as suas receitas e despesas."
          acaoLabel="Nova categoria"
          aoClicarAccao={() => abrirNova()}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-8">
          <SecaoCategorias
            titulo="Receitas"
            categorias={receitas}
            cor="text-emerald-600"
            aoEditar={abrirEditar}
            aoEliminar={aoEliminar}
          />
          <div className="border-t border-gray-100" />
          <SecaoCategorias
            titulo="Despesas"
            categorias={despesas}
            cor="text-red-500"
            aoEditar={abrirEditar}
            aoEliminar={aoEliminar}
          />
        </div>
      )}

      <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo={aEditar ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={handleSubmit(aoSubmeter)} className="flex flex-col gap-4">
          <Input label="Nome" type="text" placeholder="ex: Alimentação" erro={errors.nome?.message} {...register('nome')} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <div className="flex gap-4">
              {['receita', 'despesa'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={t} {...register('tipo')} className="accent-violet-700" />
                  <span className="text-sm text-gray-700">{t === 'receita' ? 'Receita' : 'Despesa'}</span>
                </label>
              ))}
            </div>
            {errors.tipo && <p className="text-xs text-red-500">{errors.tipo.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Botao variante="secundario" tamanho="md" type="button" onClick={() => setModalAberto(false)} className="flex-1">Cancelar</Botao>
            <Botao variante="primario" tamanho="md" type="submit" carregando={isSubmitting} className="flex-1">
              {aEditar ? 'Guardar' : 'Criar'}
            </Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
