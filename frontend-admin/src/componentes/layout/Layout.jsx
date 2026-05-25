import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore.js';

const navItems = [
  { to: '/metricas', icone: LayoutDashboard, label: 'Métricas' },
  { to: '/tenants', icone: Users, label: 'Tenants' },
  { to: '/pagamentos', icone: CreditCard, label: 'Pagamentos' },
];

export default function Layout() {
  const limparAuth = useAdminStore((s) => s.limparAuth);
  const navegar = useNavigate();

  function sair() {
    limparAuth();
    navegar('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-none">Hayusten</p>
              <p className="text-xs text-gray-400 leading-none mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {navItems.map(({ to, icone: Icone, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icone className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sair */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={sair}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
