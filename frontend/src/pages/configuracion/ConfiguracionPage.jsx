import { Navigate } from 'react-router-dom';

/**
 * ConfiguracionPage - Redirige a Mi Negocio
 * La navegación entre secciones se hace mediante los tabs del layout
 */
function ConfiguracionPage() {
  return <Navigate to="/configuracion/negocio" replace />;
}

export default ConfiguracionPage;
