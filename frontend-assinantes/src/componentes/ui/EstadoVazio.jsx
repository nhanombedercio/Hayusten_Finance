import { Botao } from './Botao.jsx';

export function EstadoVazio({ icone: Icone, titulo, descricao, acaoLabel, aoClicarAccao }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      {Icone && (
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          <Icone size={28} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-gray-800">{titulo}</h3>
        {descricao && <p className="text-sm text-gray-500 max-w-xs">{descricao}</p>}
      </div>
      {acaoLabel && aoClicarAccao && (
        <Botao variante="primario" tamanho="md" onClick={aoClicarAccao}>
          {acaoLabel}
        </Botao>
      )}
    </div>
  );
}
