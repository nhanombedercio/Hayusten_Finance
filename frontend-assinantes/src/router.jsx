import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './componentes/layout/Layout.jsx';
import { LayoutProtegido } from './componentes/layout/LayoutProtegido.jsx';

// Páginas de autenticação
import Login from './paginas/auth/Login.jsx';
import Registo from './paginas/auth/Registo.jsx';
import ConfirmarEmail from './paginas/auth/ConfirmarEmail.jsx';
import RecuperarPassword from './paginas/auth/RecuperarPassword.jsx';
import DefinirPassword from './paginas/auth/DefinirPassword.jsx';
import ConfiguracaoInicial from './paginas/auth/ConfiguracaoInicial.jsx';

// Páginas da aplicação
import Dashboard from './paginas/app/Dashboard.jsx';
import Transacoes from './paginas/app/Transacoes.jsx';
import ContasFinanceiras from './paginas/app/ContasFinanceiras.jsx';
import Categorias from './paginas/app/Categorias.jsx';
import Transferencias from './paginas/app/Transferencias.jsx';
import Metas from './paginas/app/Metas.jsx';
import Insights from './paginas/app/Insights.jsx';
import IA from './paginas/app/IA.jsx';
import Relatorios from './paginas/app/Relatorios.jsx';
import Perfil from './paginas/app/Perfil.jsx';
import Assinatura from './paginas/app/Assinatura.jsx';

// Páginas de bloqueio
import TrialExpirado from './paginas/TrialExpirado.jsx';
import ContaSuspensa from './paginas/ContaSuspensa.jsx';

const router = createBrowserRouter([
  // Rotas públicas — acessíveis sem autenticação
  { path: '/login', element: <Login /> },
  { path: '/registo', element: <Registo /> },
  { path: '/confirmar-email', element: <ConfirmarEmail /> },
  { path: '/recuperar-password', element: <RecuperarPassword /> },
  { path: '/definir-password', element: <DefinirPassword /> },

  // Páginas de bloqueio — requerem auth mas bloqueiam o acesso normal
  { path: '/trial-expirado', element: <TrialExpirado /> },
  { path: '/conta-suspensa', element: <ContaSuspensa /> },

  // Configuração inicial — antes do acesso ao dashboard
  {
    element: <LayoutProtegido />,
    children: [
      { path: '/configuracao-inicial', element: <ConfiguracaoInicial /> },
    ],
  },

  // Rotas protegidas com layout da aplicação
  {
    element: <LayoutProtegido />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/transacoes', element: <Transacoes /> },
          { path: '/contas', element: <ContasFinanceiras /> },
          { path: '/categorias', element: <Categorias /> },
          { path: '/transferencias', element: <Transferencias /> },
          { path: '/metas', element: <Metas /> },
          { path: '/insights', element: <Insights /> },
          { path: '/ia', element: <IA /> },
          { path: '/relatorios', element: <Relatorios /> },
          { path: '/perfil', element: <Perfil /> },
          { path: '/assinatura', element: <Assinatura /> },
        ],
      },
    ],
  },
]);

export default router;
