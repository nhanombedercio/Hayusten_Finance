import { forwardRef } from 'react';

// Componente compatível com react-hook-form via forwardRef.
const Input = forwardRef(function Input(
  { label, erro, icone: Icone, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icone && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icone size={16} />
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className={[
            'w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-400 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
            'transition-colors duration-150',
            erro ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
            Icone ? 'pl-9' : '',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
        />
      </div>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
});

export default Input;
