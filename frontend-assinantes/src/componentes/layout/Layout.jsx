import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar.jsx';
import { BannerTrial } from './BannerTrial.jsx';

// Layout principal da aplicação com sidebar fixa no desktop e gaveta em mobile.
export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar fixa no desktop */}
      <div className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col">
        <Sidebar />
      </div>

      {/* Gaveta mobile — overlay + sidebar deslizante */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 flex flex-col z-50">
            <Sidebar aoFechar={() => setMenuAberto(false)} />
          </div>
        </div>
      )}

      {/* Área de conteúdo principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Banner de trial nos últimos dias */}
        <BannerTrial />

        {/* Barra topo mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setMenuAberto(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-gray-900 text-sm">Hayusten Finance</span>
        </header>

        {/* Conteúdo da rota actual */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
