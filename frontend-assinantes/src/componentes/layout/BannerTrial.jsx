import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTenantStore from '../../store/tenantStore.js';

// Mostrado apenas nos últimos 3 dias do trial para criar sentido de urgência sem ser intrusivo.
export function BannerTrial() {
  const store = useTenantStore();
  const dias = store.diasTrialRestantes;
  const emTrial = store.estaEmTrial;

  if (!emTrial || dias > 3) return null;

  const mensagem =
    dias === 0
      ? 'O seu período de teste termina hoje!'
      : dias === 1
      ? 'Falta 1 dia para o seu período de teste terminar.'
      : `Faltam ${dias} dias para o seu período de teste terminar.`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-amber-800 text-sm">
        <AlertTriangle size={16} className="shrink-0" />
        <span>{mensagem}</span>
      </div>
      <Link
        to="/assinatura"
        className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 transition-colors"
      >
        Subscrever agora
      </Link>
    </div>
  );
}
