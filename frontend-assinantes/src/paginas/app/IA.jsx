import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Bot, Sparkles, TrendingUp, Target, MessageSquare, Send } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import * as iaServico from '../../servicos/ia.js';
import * as metasServico from '../../servicos/metas.js';
import useTenantStore from '../../store/tenantStore.js';
import { formatarMoeda, formatarPercentagem } from '../../utils/formatadores.js';
import { Botao } from '../../componentes/ui/Botao.jsx';
import { Carregando } from '../../componentes/ui/Carregando.jsx';

const ABAS = [
  { id: 'score', rotulo: 'Score', icone: Sparkles },
  { id: 'previsoes', rotulo: 'Previsões', icone: TrendingUp },
  { id: 'projecao', rotulo: 'Projecção', icone: TrendingUp },
  { id: 'metas', rotulo: 'Metas IA', icone: Target },
  { id: 'chat', rotulo: 'Assistente', icone: MessageSquare },
];

const classesScore = (s) => {
  if (s >= 80) return { cor: 'text-emerald-600', fundo: 'bg-emerald-50', rotulo: 'Excelente' };
  if (s >= 60) return { cor: 'text-amber-600', fundo: 'bg-amber-50', rotulo: 'Bom' };
  if (s >= 40) return { cor: 'text-orange-600', fundo: 'bg-orange-50', rotulo: 'Regular' };
  return { cor: 'text-red-600', fundo: 'bg-red-50', rotulo: 'Atenção' };
};

export default function IA() {
  const { tenant } = useTenantStore();
  const moeda = tenant?.moedaPrincipal ?? 'MZN';

  const [abaActiva, setAbaActiva] = useState('score');
  const [dadosScore, setDadosScore] = useState(null);
  const [dadosPrevisoes, setDadosPrevisoes] = useState(null);
  const [dadosProjecao, setDadosProjecao] = useState(null);
  const [dadosMetas, setDadosMetas] = useState(null);
  const [mesesProjecao, setMesesProjecao] = useState(6);
  const [carregando, setCarregando] = useState(false);
  const [metas, setMetas] = useState([]);

  // Chat
  const [mensagens, setMensagens] = useState([]);
  const [inputChat, setInputChat] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    metasServico.listar()
      .then((r) => setMetas(r.data.dados?.filter((m) => m.estado === 'activa') ?? []))
      .catch(() => {});
  }, []);

  const analisarScore = async () => {
    setCarregando(true);
    try {
      const r = await iaServico.score();
      setDadosScore(r.data.dados);
    } catch {
      toast.error('Erro ao calcular score.');
    } finally {
      setCarregando(false);
    }
  };

  const analisarPrevisoes = async () => {
    setCarregando(true);
    try {
      const r = await iaServico.previsoes();
      setDadosPrevisoes(r.data.dados);
    } catch {
      toast.error('Erro ao gerar previsões.');
    } finally {
      setCarregando(false);
    }
  };

  const analisarProjecao = async () => {
    setCarregando(true);
    try {
      const r = await iaServico.projecao(mesesProjecao);
      setDadosProjecao(r.data.dados);
    } catch {
      toast.error('Erro ao gerar projecção.');
    } finally {
      setCarregando(false);
    }
  };

  const analisarMetas = async () => {
    setCarregando(true);
    try {
      const resultados = await Promise.all(metas.map((m) => iaServico.calcularMeta(m.id)));
      setDadosMetas(resultados.map((r, i) => ({ ...metas[i], ...r.data.dados })));
    } catch {
      toast.error('Erro ao analisar metas.');
    } finally {
      setCarregando(false);
    }
  };

  const enviarChat = async () => {
    if (!inputChat.trim()) return;
    const novaMsg = { papel: 'utilizador', conteudo: inputChat };
    const historico = [...mensagens, novaMsg];
    setMensagens(historico);
    setInputChat('');
    setEnviando(true);
    try {
      const r = await iaServico.chat(inputChat, mensagens);
      setMensagens([...historico, { papel: 'assistente', conteudo: r.data.dados.resposta }]);
    } catch {
      toast.error('Erro ao contactar o assistente.');
    } finally {
      setEnviando(false);
    }
  };

  const classeScore = dadosScore ? classesScore(dadosScore.score) : null;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Análise IA</h1>
        <p className="text-sm text-gray-500">Inteligência artificial ao serviço das suas finanças</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-xl w-fit">
        {ABAS.map(({ id, rotulo, icone: Icone }) => (
          <button
            key={id}
            onClick={() => setAbaActiva(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              abaActiva === id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icone size={14} />
            {rotulo}
          </button>
        ))}
      </div>

      {/* Score */}
      {abaActiva === 'score' && (
        <div className="flex flex-col gap-4">
          {!dadosScore && !carregando && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <Bot size={40} className="text-violet-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm mb-4">Calcule o seu score de saúde financeira</p>
              <Botao variante="primario" onClick={analisarScore}>Calcular score</Botao>
            </div>
          )}
          {carregando && <Carregando texto="A calcular score…" />}
          {dadosScore && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
              <div className={`flex items-center gap-4 p-4 rounded-xl ${classeScore.fundo}`}>
                <div className={`text-5xl font-bold ${classeScore.cor}`}>{dadosScore.score}</div>
                <div>
                  <p className={`text-lg font-semibold ${classeScore.cor}`}>{classeScore.rotulo}</p>
                  <p className="text-sm text-gray-500">Score de saúde financeira</p>
                </div>
              </div>
              {dadosScore.explicacao && (
                <p className="text-sm text-gray-600">{dadosScore.explicacao}</p>
              )}
              {dadosScore.pontosDeMelhoria?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Pontos a melhorar:</p>
                  <ul className="flex flex-col gap-2">
                    {dadosScore.pontosDeMelhoria.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-violet-500 mt-0.5">•</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Botao variante="secundario" tamanho="sm" onClick={analisarScore} carregando={carregando}>
                Recalcular
              </Botao>
            </div>
          )}
        </div>
      )}

      {/* Previsões */}
      {abaActiva === 'previsoes' && (
        <div className="flex flex-col gap-4">
          {!dadosPrevisoes && !carregando && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-500 text-sm mb-4">Previsão de despesas por categoria para o próximo mês</p>
              <Botao variante="primario" onClick={analisarPrevisoes}>Gerar previsões</Botao>
            </div>
          )}
          {carregando && <Carregando texto="A gerar previsões…" />}
          {dadosPrevisoes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Previsão por categoria — próximo mês</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dadosPrevisoes.categorias}>
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatarMoeda(v, moeda)} />
                  <Tooltip formatter={(v) => formatarMoeda(v, moeda)} />
                  <Bar dataKey="valorPrevisto" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-400 mt-2">Total previsto: {formatarMoeda(dadosPrevisoes.totalPrevisto, moeda)}</p>
            </div>
          )}
        </div>
      )}

      {/* Projecção */}
      {abaActiva === 'projecao' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Horizonte:</label>
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setMesesProjecao(m)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  mesesProjecao === m ? 'bg-violet-700 text-white border-violet-700' : 'border-gray-200 text-gray-600 hover:border-violet-300'
                }`}
              >
                {m} meses
              </button>
            ))}
            <Botao variante="primario" tamanho="sm" onClick={analisarProjecao} carregando={carregando}>
              Projectar
            </Botao>
          </div>
          {dadosProjecao && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Projecção de saldo — {mesesProjecao} meses</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dadosProjecao.projecao}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatarMoeda(v, moeda)} />
                  <Tooltip formatter={(v) => formatarMoeda(v, moeda)} />
                  <Line type="monotone" dataKey="saldo" stroke="#7C3AED" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Metas IA */}
      {abaActiva === 'metas' && (
        <div className="flex flex-col gap-4">
          {metas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-500 text-sm">Sem metas activas. Crie uma meta para ver o plano de poupança.</p>
            </div>
          ) : (
            <>
              {!dadosMetas && !carregando && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center">
                  <p className="text-gray-500 text-sm mb-4">Calcule quanto precisa poupar por mês para cada meta activa</p>
                  <Botao variante="primario" onClick={analisarMetas}>Analisar metas</Botao>
                </div>
              )}
              {carregando && <Carregando texto="A analisar metas…" />}
              {dadosMetas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dadosMetas.map((m) => (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">{m.nome}</h4>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Poupar por mês</span>
                          <span className="font-semibold text-violet-700">{formatarMoeda(m.poupancaMensal, moeda)}</span>
                        </div>
                        {m.mesesRestantes != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Meses restantes</span>
                            <span className="font-medium text-gray-700">{m.mesesRestantes}</span>
                          </div>
                        )}
                        {m.probabilidade != null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Probabilidade</span>
                            <span className="font-medium text-gray-700">{formatarPercentagem(m.probabilidade)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Chat */}
      {abaActiva === 'chat' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {mensagens.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <Bot size={32} className="text-violet-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Olá! Sou o assistente financeiro Hayusten.<br />Como posso ajudar?</p>
                </div>
              </div>
            )}
            {mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.papel === 'utilizador' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  m.papel === 'utilizador'
                    ? 'bg-violet-700 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.conteudo}
                </div>
              </div>
            ))}
            {enviando && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              type="text"
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarChat()}
              placeholder="Escreva uma pergunta…"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={enviando}
            />
            <Botao variante="primario" tamanho="md" onClick={enviarChat} carregando={enviando} disabled={!inputChat.trim()}>
              <Send size={16} />
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
