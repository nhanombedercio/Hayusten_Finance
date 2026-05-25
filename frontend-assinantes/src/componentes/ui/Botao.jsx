import { Loader2 } from 'lucide-react';

const variantes = {
  primario: 'bg-violet-700 hover:bg-violet-800 text-white border-transparent focus-visible:ring-violet-500',
  secundario: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus-visible:ring-gray-400',
  perigo: 'bg-red-500 hover:bg-red-600 text-white border-transparent focus-visible:ring-red-400',
  fantasma: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus-visible:ring-gray-400',
};

const tamanhos = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  carregando = false,
  desactivado = false,
  className = '',
  children,
  ...props
}) {
  const estaDesactivado = carregando || desactivado;

  return (
    <button
      {...props}
      disabled={estaDesactivado}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg border',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantes[variante],
        tamanhos[tamanho],
        className,
      ].join(' ')}
    >
      {carregando && <Loader2 size={16} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}
