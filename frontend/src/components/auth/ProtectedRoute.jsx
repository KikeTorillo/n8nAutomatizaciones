import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

/**
 * Componente para proteger rutas que requieren autenticación
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a renderizar si está autenticado
 * @param {string|string[]} props.requiredRole - Rol(es) requerido(s) para acceder (opcional)
 * @returns {React.ReactNode}
 */
function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user } = useAuthStore();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    console.log('🔒 Usuario no autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // Si se requiere un rol específico
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!roles.includes(user?.rol)) {
      console.log(`🚫 Usuario no tiene el rol requerido. Rol actual: ${user?.rol}, Requerido: ${requiredRole}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Usuario autenticado y con rol correcto
  return children;
}

export default ProtectedRoute;
