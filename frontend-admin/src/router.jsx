import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './paginas/Login.jsx';
import Layout from './componentes/layout/Layout.jsx';
import Metricas from './paginas/Metricas.jsx';
import Tenants from './paginas/Tenants.jsx';
import TenantDetalhe from './paginas/TenantDetalhe.jsx';
import Pagamentos from './paginas/Pagamentos.jsx';
import RotaProtegida from './componentes/layout/RotaProtegida.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RotaProtegida>
        <Layout />
      </RotaProtegida>
    ),
    children: [
      { index: true, element: <Navigate to="/metricas" replace /> },
      { path: 'metricas', element: <Metricas /> },
      { path: 'tenants', element: <Tenants /> },
      { path: 'tenants/:id', element: <TenantDetalhe /> },
      { path: 'pagamentos', element: <Pagamentos /> },
    ],
  },
]);
