import { useEffect } from 'react';
import { X } from 'lucide-react';

// Fecha com ESC para acessibilidade — mais ergonómico do que forçar o utilizador a clicar.
export function Modal({ aberto, aoFechar, titulo, children, largura = 'max-w-lg' }) {
  useEffect(() => {
    if (!aberto) return;
    const handleEsc = (e) => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={aoFechar}
        aria-hidden="true"
      />
      {/* Caixa do modal */}
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full ${largura} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="modal-titulo" className="text-lg font-semibold text-gray-900">
            {titulo}
          </h2>
          <button
            onClick={aoFechar}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
