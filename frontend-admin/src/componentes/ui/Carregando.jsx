// Spinner de carregamento centrado na área pai.
export default function Carregando({ texto = 'A carregar...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{texto}</p>
    </div>
  );
}
