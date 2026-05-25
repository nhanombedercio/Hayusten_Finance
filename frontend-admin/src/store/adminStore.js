import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Estado global de autenticação do admin.
// O token é persistido em localStorage para sobreviver a recarregamentos de página.
export const useAdminStore = create(
  persist(
    (set) => ({
      adminToken: null,
      estaAutenticado: false,

      definirToken: (token) => set({ adminToken: token, estaAutenticado: !!token }),
      limparAuth: () => set({ adminToken: null, estaAutenticado: false }),
    }),
    {
      name: 'hayusten-admin-auth',
      partialize: (state) => ({ adminToken: state.adminToken }),
    }
  )
);
