import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore.js';

// Redireciona para /login se não houver token admin activo.
export default function RotaProtegida({ children }) {
  const estaAutenticado = useAdminStore((s) => s.estaAutenticado);
  const adminToken = useAdminStore((s) => s.adminToken);
  const adminKey = useAdminStore((s) => s.adminKey);

  // Requer tanto o JWT como a chave admin — sem ambos, redireciona para login.
  if (!estaAutenticado || !adminToken || !adminKey) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
