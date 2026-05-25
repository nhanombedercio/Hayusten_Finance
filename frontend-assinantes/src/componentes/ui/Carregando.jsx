import { Loader2 } from 'lucide-react';

export function Carregando({ texto = 'A carregar...', tamanho = 'md' }) {
  const tamanhos = { sm: 16, md: 24, lg: 36 };
  const px = tamanhos[tamanho] ?? 24;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
      <Loader2 size={px} className="animate-spin" />
      {texto && <span className="text-sm">{texto}</span>}
    </div>
  );
}
