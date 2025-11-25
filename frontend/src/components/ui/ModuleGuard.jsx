import { useNavigate } from 'react-router-dom';
import { useModulos } from '@/hooks/useModulos';
import { Lock, Package, ShoppingCart, DollarSign, Globe, Bot, Calendar, ArrowLeft } from 'lucide-react';
import Button from './Button';

/**
 * Mapeo de iconos por módulo
 */
const ICONOS_MODULOS = {
  core: Lock,
  agendamiento: Calendar,
  inventario: Package,
  pos: ShoppingCart,
  comisiones: DollarSign,
  marketplace: Globe,
  chatbots: Bot,
};

/**
 * Nombres display de módulos
 */
const NOMBRES_MODULOS = {
  core: 'Core del Sistema',
  agendamiento: 'Sistema de Agendamiento',
  inventario: 'Gestión de Inventario',
  pos: 'Punto de Venta',
  comisiones: 'Sistema de Comisiones',
  marketplace: 'Marketplace Público',
  chatbots: 'Chatbots IA',
};

/**
 * Componente ModuleGuard
 * Protege secciones del UI según módulos activos
 *
 * @param {Object} props
 * @param {string|string[]} props.requiere - Módulo(s) requerido(s)
 * @param {boolean} props.requiereTodos - Si true, requiere TODOS los módulos. Default: false (ANY)
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene acceso
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene acceso
 * @param {boolean} props.showUpgradeUI - Mostrar UI de upgrade si no tiene acceso (default: true)
 * @param {string} props.redirectTo - Ruta de redirección si no tiene acceso
 *
 * @example
 * // Requerir un módulo
 * <ModuleGuard requiere="inventario">
 *   <InventarioPage />
 * </ModuleGuard>
 *
 * @example
 * // Requerir cualquiera de varios módulos
 * <ModuleGuard requiere={['inventario', 'pos']}>
 *   <VentasWidget />
 * </ModuleGuard>
 *
 * @example
 * // Requerir todos los módulos
 * <ModuleGuard requiere={['inventario', 'pos']} requiereTodos>
 *   <ReporteCombinado />
 * </ModuleGuard>
 *
 * @example
 * // Con fallback personalizado
 * <ModuleGuard requiere="comisiones" fallback={<div>Módulo no disponible</div>}>
 *   <ComisionesPage />
 * </ModuleGuard>
 */
function ModuleGuard({
  requiere,
  requiereTodos = false,
  children,
  fallback,
  showUpgradeUI = true,
  redirectTo,
}) {
  const navigate = useNavigate();
  const { tieneModulo, tieneAlgunModulo, tieneTodosModulos, isLoading } = useModulos();

  // Normalizar requiere a array
  const modulosRequeridos = Array.isArray(requiere) ? requiere : [requiere];

  // Verificar acceso
  const tieneAcceso = requiereTodos
    ? tieneTodosModulos(...modulosRequeridos)
    : tieneAlgunModulo(...modulosRequeridos);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si tiene acceso, mostrar children
  if (tieneAcceso) {
    return children;
  }

  // Si hay redirección configurada
  if (redirectTo) {
    navigate(redirectTo);
    return null;
  }

  // Fallback personalizado
  if (fallback) {
    return fallback;
  }

  // UI de upgrade por defecto
  if (!showUpgradeUI) {
    return null;
  }

  // Determinar módulo principal para mostrar
  const moduloPrincipal = modulosRequeridos[0];
  const IconoModulo = ICONOS_MODULOS[moduloPrincipal] || Lock;
  const nombreModulo = NOMBRES_MODULOS[moduloPrincipal] || moduloPrincipal;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <IconoModulo className="w-8 h-8 text-gray-400" />
        </div>

        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Módulo no disponible
        </h2>

        {/* Descripción */}
        <p className="text-gray-600 mb-6">
          El módulo <span className="font-medium">{nombreModulo}</span> no está
          activo en tu plan actual.
          {modulosRequeridos.length > 1 && requiereTodos && (
            <span className="block mt-2 text-sm">
              Se requieren todos estos módulos:{' '}
              {modulosRequeridos.map((m) => NOMBRES_MODULOS[m] || m).join(', ')}
            </span>
          )}
        </p>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/configuracion/modulos')}
            className="w-full"
          >
            Activar módulo
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Info adicional */}
        <p className="mt-6 text-xs text-gray-500">
          Contacta a soporte si necesitas ayuda para activar este módulo.
        </p>
      </div>
    </div>
  );
}

/**
 * Componente para mostrar/ocultar elementos basado en módulos
 * Versión ligera sin UI de upgrade
 *
 * @example
 * <ModuleVisible modulo="inventario">
 *   <AlertasInventarioWidget />
 * </ModuleVisible>
 */
export function ModuleVisible({ modulo, children }) {
  const { tieneModulo, isLoading } = useModulos();

  if (isLoading) return null;
  if (!tieneModulo(modulo)) return null;

  return children;
}

/**
 * Componente para mostrar contenido solo si NO tiene el módulo
 * Útil para mostrar CTAs de upgrade
 *
 * @example
 * <ModuleHidden modulo="inventario">
 *   <UpgradeInventarioCard />
 * </ModuleHidden>
 */
export function ModuleHidden({ modulo, children }) {
  const { tieneModulo, isLoading } = useModulos();

  if (isLoading) return null;
  if (tieneModulo(modulo)) return null;

  return children;
}

export default ModuleGuard;
