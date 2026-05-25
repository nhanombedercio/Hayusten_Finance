import { useEffect } from 'react';
import { X } from 'lucide-react';

// Modal acessível com fecho por ESC e clique no overlay.
export default function Modal({ titulo, aberto, onFechar, children, largura = 'max-w-md' }) {
  useEffect(() => {
    if (!aberto) return;
    const fecharComEsc = (e) => { if (e.key === 'Escape') onFechar(); };
    document.addEventListener('keydown', fecharComEsc);
    return () => document.removeEventListener('keydown', fecharComEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${largura} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
          <button
            onClick={onFechar}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
