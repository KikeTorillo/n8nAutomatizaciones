import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

/**
 * Jerarquía de roles del sistema
 * Mayor número = mayor nivel de acceso
 * Un rol superior puede acceder a todo lo que accede un rol inferior
 */
const ROLE_HIERARCHY = {
  super_admin: 100,  // Acceso total a la plataforma
  admin: 50,         // Administrador de organización
  propietario: 50,   // Dueño del negocio (mismo nivel que admin)
  empleado: 10,      // Staff con acceso limitado
  bot: 5,            // Acceso programático (MCP)
};

/**
 * Verifica si un rol tiene acceso basándose en la jerarquía
 * @param {string} userRole - Rol del usuario actual
 * @param {string|string[]} requiredRoles - Rol(es) requerido(s)
 * @returns {boolean}
 */
function hasRoleAccess(userRole, requiredRoles) {
  if (!userRole) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

  // Usuario tiene acceso si:
  // 1. Su rol está explícitamente en la lista, O
  // 2. Su nivel jerárquico es >= al nivel más alto requerido
  if (roles.includes(userRole)) return true;

  const maxRequiredLevel = Math.max(...roles.map(r => ROLE_HIERARCHY[r] ?? 0));
  return userLevel >= maxRequiredLevel;
}

/**
 * Componente para proteger rutas que requieren autenticación y/o roles específicos
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a renderizar si está autorizado
 * @param {string|string[]} props.requiredRole - Rol(es) requerido(s) para acceder (opcional)
 * @param {string|string[]} props.excludeRoles - Rol(es) que NO pueden acceder (opcional)
 * @param {string} props.redirectTo - Ruta de redirección si no tiene acceso (default: /dashboard)
 * @returns {React.ReactNode}
 *
 * @example
 * // Solo autenticación
 * <ProtectedRoute><HomePage /></ProtectedRoute>
 *
 * @example
 * // Rol específico
 * <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
 *
 * @example
 * // Múltiples roles (cualquiera de ellos)
 * <ProtectedRoute requiredRole={['admin', 'propietario']}><ConfigPage /></ProtectedRoute>
 *
 * @example
 * // Excluir roles específicos (ej: super_admin no puede acceder a /home)
 * <ProtectedRoute excludeRoles="super_admin" redirectTo="/superadmin/dashboard">
 */
function ProtectedRoute({ children, requiredRole = null, excludeRoles = null, redirectTo = '/dashboard' }) {
  const { isAuthenticated, user } = useAuthStore();

  // Verificación 1: Autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificación 2: Exclusión de roles (ej: super_admin no va a /home)
  if (excludeRoles) {
    const rolesToExclude = Array.isArray(excludeRoles) ? excludeRoles : [excludeRoles];
    if (rolesToExclude.includes(user?.rol)) {
      console.warn(
        `[ProtectedRoute] Rol excluido. Rol: ${user?.rol}, Excluidos: ${JSON.stringify(excludeRoles)}`
      );
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Verificación 3: Autorización por rol (si se requiere)
  if (requiredRole && !hasRoleAccess(user?.rol, requiredRole)) {
    console.warn(
      `[ProtectedRoute] Acceso denegado. Rol: ${user?.rol}, Requerido: ${JSON.stringify(requiredRole)}`
    );
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

// Exportar utilidades para uso externo
export { ROLE_HIERARCHY, hasRoleAccess };
export default ProtectedRoute;
