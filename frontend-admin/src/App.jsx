import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router.jsx';

// Ponto de entrada da aplicação admin — wrap com router e notificações toast.
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </>
  );
}

export default App;
