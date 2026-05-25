import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import router from './router.jsx';

// Ponto de entrada da aplicação — apenas wrappers globais aqui.
// A lógica de rotas e autenticação vive no router.jsx e nos guards.
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: { background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
            iconTheme: { primary: '#10B981', secondary: '#fff' },
          },
          error: {
            style: { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' },
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </>
  );
}
