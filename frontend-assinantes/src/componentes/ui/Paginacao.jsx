import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Paginacao({ pagina, totalPaginas, aoMudarPagina }) {
  if (totalPaginas <= 1) return null;

  // Gera intervalo de páginas visíveis à volta da página actual (máx 5).
  const paginas = [];
  const inicio = Math.max(1, pagina - 2);
  const fim = Math.min(totalPaginas, inicio + 4);
  for (let i = inicio; i <= fim; i++) paginas.push(i);

  const btnBase =
    'inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => aoMudarPagina(pagina - 1)}
        disabled={pagina === 1}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {inicio > 1 && (
        <>
          <button onClick={() => aoMudarPagina(1)} className={`${btnBase} text-gray-600 hover:bg-gray-100`}>1</button>
          {inicio > 2 && <span className="px-1 text-gray-400">…</span>}
        </>
      )}

      {paginas.map((p) => (
        <button
          key={p}
          onClick={() => aoMudarPagina(p)}
          className={`${btnBase} ${
            p === pagina
              ? 'bg-violet-700 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}

      {fim < totalPaginas && (
        <>
          {fim < totalPaginas - 1 && <span className="px-1 text-gray-400">…</span>}
          <button onClick={() => aoMudarPagina(totalPaginas)} className={`${btnBase} text-gray-600 hover:bg-gray-100`}>{totalPaginas}</button>
        </>
      )}

      <button
        onClick={() => aoMudarPagina(pagina + 1)}
        disabled={pagina === totalPaginas}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Próxima página"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
