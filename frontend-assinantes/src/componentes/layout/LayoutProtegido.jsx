import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import useTenantStore from '../../store/tenantStore.js';

// Guarda de rota que verifica autenticação e estado do tenant antes de renderizar.
// Redirecciona para as páginas de bloqueio adequadas conforme o estado.
export function LayoutProtegido() {
  const { estaAutenticado } = useAuthStore();
  const store = useTenantStore();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (store.estaSuspenso) {
    return <Navigate to="/conta-suspensa" replace />;
  }

  // Trial expirado sem assinatura activa.
  if (store.tenant?.estado === 'trial_expirado') {
    return <Navigate to="/trial-expirado" replace />;
  }

  return <Outlet />;
}
