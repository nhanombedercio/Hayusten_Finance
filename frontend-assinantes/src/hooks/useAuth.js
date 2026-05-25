import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useTenantStore from '../store/tenantStore.js';

// Hook central de autenticação. Combina estado de auth e tenant
// e expõe a lógica de redireccionamento conforme o estado do tenant.
export function useAuth() {
  const navigate = useNavigate();
  const { utilizador, accessToken, estaAutenticado, limparAuth, definirUtilizador } = useAuthStore();
  const { tenant, limparTenant, definirTenant } = useTenantStore();

  // Determina para onde redirecionar após login com base no estado do tenant.
  const redireccionar = (tenantInfo) => {
    const estado = tenantInfo?.estado ?? tenant?.estado;
    if (!estado) {
      navigate('/login');
      return;
    }
    if (estado === 'suspenso') {
      navigate('/conta-suspensa');
      return;
    }
    // Trial expirado sem assinatura activa → página de bloqueio.
    if (estado === 'trial_expirado') {
      navigate('/trial-expirado');
      return;
    }
    // Tenant ainda não configurou a conta inicial.
    if (!tenantInfo?.configurado && !tenant?.configurado) {
      navigate('/configuracao-inicial');
      return;
    }
    navigate('/dashboard');
  };

  const sair = async () => {
    try {
      // Tentamos fazer logout no servidor; se falhar, continuamos a limpar localmente.
      const { logout } = await import('../servicos/auth.js');
      await logout();
    } catch {
      // Silencioso — mesmo com erro de rede, a sessão local deve ser limpa.
    } finally {
      limparAuth();
      limparTenant();
      navigate('/login');
    }
  };

  return {
    utilizador,
    accessToken,
    estaAutenticado,
    tenant,
    definirUtilizador,
    definirTenant,
    redireccionar,
    sair,
  };
}
