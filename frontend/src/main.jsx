import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import './index.css';

// ⚠️ StrictMode deshabilitado temporalmente para evitar doble-mount que causa 429 errors
// React Query + StrictMode + invalidaciones masivas = 14 peticiones simultáneas
createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
