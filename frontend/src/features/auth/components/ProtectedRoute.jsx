import { Navigate } from 'react-router-dom';
import useAuthStore, { selectIsAuthenticated, selectUser } from '../store/authStore';

/**
 * Mapeo de códigos de rol a nivel jerárquico mínimo requerido
 * FASE 7: El nivel real viene del backend (user.nivel_jerarquia)
 * Este mapeo es solo para determinar el nivel mínimo requerido por un rol
 */
const NIVEL_MINIMO_POR_ROL = {
  super_admin: 100,  // Solo super_admin
  admin: 90,         // Admin o superior
  gerente: 50,       // Gerente o superior
  empleado: 10,      // Empleado o superior
  bot: 5,            // Cualquiera
};

/**
 * Verifica si el usuario tiene acceso basándose en nivel_jerarquia del backend
 * FASE 7 COMPLETADA: Usa nivel_jerarquia en vez de mapeo hardcodeado
 * @param {Object} user - Usuario con nivel_jerarquia y rol_codigo
 * @param {string|string[]} requiredRoles - Rol(es) requerido(s)
 * @returns {boolean}
 */
function hasRoleAccess(user, requiredRoles) {
  if (!user?.rol_codigo) return false;

  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userLevel = user.nivel_jerarquia || 10;

  // Usuario tiene acceso si:
  // 1. Su rol_codigo está explícitamente en la lista, O
  // 2. Su nivel jerárquico es >= al nivel mínimo requerido
  if (roles.includes(user.rol_codigo)) return true;

  const maxRequiredLevel = Math.max(...roles.map(r => NIVEL_MINIMO_POR_ROL[r] ?? 0));
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
 * <ProtectedRoute excludeRoles="super_admin" redirectTo="/superadmin">
 */
function ProtectedRoute({ children, requiredRole = null, excludeRoles = null, redirectTo = '/dashboard' }) {
  // Ene 2026: Usar selectores para evitar re-renders
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);

  // Verificación 1: Autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificación 2: Onboarding pendiente (Dic 2025 - OAuth flow)
  // Usuarios OAuth sin organización deben completar onboarding primero
  // Roles de sistema (super_admin, bot) están exentos
  if (
    user?.nivel_jerarquia < 100 && // No es super_admin
    !user?.organizacion_id &&
    user?.onboarding_completado === false
  ) {
    console.info('[ProtectedRoute] Usuario requiere onboarding, redirigiendo...');
    return <Navigate to="/onboarding" replace />;
  }

  // Verificación 3: Exclusión de roles (ej: super_admin no va a /home)
  // FASE 7: Usa rol_codigo
  if (excludeRoles) {
    const rolesToExclude = Array.isArray(excludeRoles) ? excludeRoles : [excludeRoles];
    if (rolesToExclude.includes(user?.rol_codigo)) {
      console.warn(
        `[ProtectedRoute] Rol excluido. Rol: ${user?.rol_codigo}, Excluidos: ${JSON.stringify(excludeRoles)}`
      );
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Verificación 4: Autorización por rol (si se requiere)
  // FASE 7: hasRoleAccess ahora recibe el objeto user completo
  if (requiredRole && !hasRoleAccess(user, requiredRole)) {
    console.warn(
      `[ProtectedRoute] Acceso denegado. Rol: ${user?.rol_codigo}, Requerido: ${JSON.stringify(requiredRole)}`
    );
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

// Exportar utilidades para uso externo
// FASE 7: NIVEL_MINIMO_POR_ROL reemplaza ROLE_HIERARCHY (niveles vienen del backend)
export { NIVEL_MINIMO_POR_ROL, hasRoleAccess };
export default ProtectedRoute;
