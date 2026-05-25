import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  Repeat2,
  Target,
  Lightbulb,
  Bot,
  FileBarChart2,
  UserCircle,
  CreditCard,
  LogOut,
  X,
} from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useTenantStore from '../../store/tenantStore.js';
import { nomeIniciais } from '../../utils/formatadores.js';

const navPrincipal = [
  { para: '/dashboard', icone: LayoutDashboard, rotulo: 'Dashboard' },
  { para: '/transacoes', icone: ArrowLeftRight, rotulo: 'Transacções' },
  { para: '/contas', icone: Wallet, rotulo: 'Contas' },
  { para: '/categorias', icone: Tags, rotulo: 'Categorias' },
  { para: '/transferencias', icone: Repeat2, rotulo: 'Transferências' },
  { para: '/metas', icone: Target, rotulo: 'Metas' },
  { para: '/insights', icone: Lightbulb, rotulo: 'Insights' },
  { para: '/ia', icone: Bot, rotulo: 'Análise IA' },
  { para: '/relatorios', icone: FileBarChart2, rotulo: 'Relatórios' },
];

function ItemNav({ para, icone: Icone, rotulo, aoClicar }) {
  return (
    <NavLink
      to={para}
      onClick={aoClicar}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-violet-700 text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ].join(' ')
      }
    >
      <Icone size={18} className="shrink-0" />
      {rotulo}
    </NavLink>
  );
}

export function Sidebar({ aoFechar }) {
  const navigate = useNavigate();
  const { utilizador, limparAuth } = useAuthStore();
  const { limparTenant } = useTenantStore();

  const sair = async () => {
    try {
      const { logout } = await import('../../servicos/auth.js');
      await logout();
    } catch {
      // Limpamos localmente mesmo se o servidor falhar.
    } finally {
      limparAuth();
      limparTenant();
      navigate('/login');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-700 flex items-center justify-center">
            <span className="text-white text-xs font-bold">HF</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Hayusten Finance</span>
        </div>
        {/* Botão de fechar apenas em mobile */}
        {aoFechar && (
          <button
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {navPrincipal.map((item) => (
          <ItemNav key={item.para} {...item} aoClicar={aoFechar} />
        ))}
      </nav>

      {/* Navegação inferior */}
      <div className="px-3 py-3 border-t border-gray-100 flex flex-col gap-1">
        <ItemNav para="/perfil" icone={UserCircle} rotulo="Perfil" aoClicar={aoFechar} />
        <ItemNav para="/assinatura" icone={CreditCard} rotulo="Assinatura" aoClicar={aoFechar} />
        <button
          onClick={sair}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut size={18} className="shrink-0" />
          Sair
        </button>
      </div>

      {/* Info do utilizador */}
      {utilizador && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
            <span className="text-violet-700 text-xs font-semibold">
              {nomeIniciais(utilizador.nome)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{utilizador.nome}</p>
            <p className="text-xs text-gray-400 truncate">{utilizador.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
