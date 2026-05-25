import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Guardamos apenas o accessToken em localStorage — os dados do utilizador
// são sempre buscados de novo ao renovar sessão para evitar dados desactualizados.
const useAuthStore = create(
  persist(
    (set) => ({
      utilizador: null,
      accessToken: null,
      estaAutenticado: false,

      // Define utilizador e token após login ou renovação bem sucedida.
      definirUtilizador: (utilizador, accessToken) =>
        set({ utilizador, accessToken, estaAutenticado: true }),

      // Limpa todo o estado de autenticação ao fazer logout ou ao expirar sessão.
      limparAuth: () =>
        set({ utilizador: null, accessToken: null, estaAutenticado: false }),

      // Actualiza apenas o token após renovação silenciosa (refresh).
      actualizarToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'hayusten-auth',
      // Persistimos apenas o token — dados do utilizador voltam do servidor no próximo login.
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
