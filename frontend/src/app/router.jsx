/**
 * Router Principal de la Aplicación
 *
 * Las rutas están organizadas en módulos separados en /routes/
 * Este archivo solo configura el router con la estructura principal
 *
 * @see /routes/index.js - Agregador de todas las rutas
 * @see /routes/helpers/routeHelpers.jsx - Utilidades para crear rutas
 */

import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { allRoutes } from './routes';

/**
 * Router de la aplicación
 * Todas las rutas están definidas en /routes/ y combinadas en allRoutes
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: allRoutes,
  },
]);
