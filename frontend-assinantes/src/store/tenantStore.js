import { create } from 'zustand';
import { differenceInDays, parseISO } from 'date-fns';

const useTenantStore = create((set, get) => ({
  tenant: null,

  definirTenant: (tenant) => set({ tenant }),

  limparTenant: () => set({ tenant: null }),

  // Getters calculados a partir do estado actual do tenant.
  get diasTrialRestantes() {
    const { tenant } = get();
    if (!tenant?.trialFim) return 0;
    const fim = typeof tenant.trialFim === 'string' ? parseISO(tenant.trialFim) : tenant.trialFim;
    const restantes = differenceInDays(fim, new Date());
    return Math.max(0, restantes);
  },

  get estaEmTrial() {
    return get().tenant?.estado === 'trial';
  },

  get estaActivo() {
    const estado = get().tenant?.estado;
    return estado === 'activo' || estado === 'trial';
  },

  get estaSuspenso() {
    return get().tenant?.estado === 'suspenso';
  },
}));

export default useTenantStore;
