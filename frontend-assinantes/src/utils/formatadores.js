import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

// Formata valor monetário com separadores portugueses.
// Ex: 99000 → "99.000,00 MZN" | 1550.5 → "1.550,50 USD"
export function formatarMoeda(valor, moeda = 'MZN') {
  if (valor == null || isNaN(valor)) return `0,00 ${moeda}`;
  const formatado = Number(valor).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatado} ${moeda}`;
}

// Formata data para exibição curta. Ex: "25 mai. 2026"
export function formatarData(data) {
  if (!data) return '—';
  try {
    const d = typeof data === 'string' ? parseISO(data) : data;
    return format(d, "d MMM. yyyy", { locale: pt });
  } catch {
    return '—';
  }
}

// Formata data por extenso. Ex: "25 de Maio de 2026"
export function formatarDataCompleta(data) {
  if (!data) return '—';
  try {
    const d = typeof data === 'string' ? parseISO(data) : data;
    return format(d, "d 'de' MMMM 'de' yyyy", { locale: pt });
  } catch {
    return '—';
  }
}

// Formata percentagem com vírgula decimal. Ex: 87.5 → "87,5%"
export function formatarPercentagem(valor) {
  if (valor == null || isNaN(valor)) return '0%';
  return `${Number(valor).toLocaleString('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

// Extrai iniciais de um nome completo. Ex: "Ana Beatriz" → "AB"
export function nomeIniciais(nome) {
  if (!nome) return '?';
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
