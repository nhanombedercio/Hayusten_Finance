import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formata valor monetário no padrão moçambicano.
export function formatarMoeda(valor, moeda = 'MZN') {
  if (valor == null) return '—';
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: moeda,
    minimumFractionDigits: 2,
  }).format(Number(valor));
}

// Formata data para exibição curta.
export function formatarData(data) {
  if (!data) return '—';
  return format(new Date(data), "d 'de' MMM 'de' yyyy", { locale: ptBR });
}

// Extrai iniciais do nome (máximo 2 caracteres).
export function nomeIniciais(nome) {
  if (!nome) return '?';
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// Mapa de estados para badges visuais.
export const ESTADO_BADGE = {
  trial: { texto: 'Trial', classe: 'bg-blue-100 text-blue-700' },
  activo: { texto: 'Activo', classe: 'bg-green-100 text-green-700' },
  suspenso: { texto: 'Suspenso', classe: 'bg-red-100 text-red-700' },
  expirado: { texto: 'Expirado', classe: 'bg-gray-100 text-gray-600' },
  cancelado: { texto: 'Cancelado', classe: 'bg-orange-100 text-orange-700' },
};

// Mapa de estados de pagamento.
export const ESTADO_PAGAMENTO_BADGE = {
  pendente: { texto: 'Pendente', classe: 'bg-yellow-100 text-yellow-700' },
  confirmado: { texto: 'Confirmado', classe: 'bg-green-100 text-green-700' },
  falhado: { texto: 'Falhado', classe: 'bg-red-100 text-red-700' },
  reembolsado: { texto: 'Reembolsado', classe: 'bg-purple-100 text-purple-700' },
};
