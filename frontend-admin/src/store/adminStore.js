import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Estado global de autenticação do admin.
// Guardamos o token JWT e a chave admin separadamente — ambos são necessários
// em cada pedido para a dupla protecção do painel admin.
export const useAdminStore = create(
  persist(
    (set) => ({
      adminToken: null,
      adminKey: null,
      estaAutenticado: false,

      definirAuth: (token, key) => set({ adminToken: token, adminKey: key, estaAutenticado: !!token }),
      limparAuth: () => set({ adminToken: null, adminKey: null, estaAutenticado: false }),
    }),
    {
      name: 'hayusten-admin-auth',
      // Persiste apenas o token e a chave — nunca dados sensíveis adicionais.
      partialize: (state) => ({ adminToken: state.adminToken, adminKey: state.adminKey }),
    }
  )
);
