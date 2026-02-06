import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModulos } from '@/hooks/sistema';
import { Lock, Package, ShoppingCart, DollarSign, Globe, Globe2, Bot, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface ModuleGuardProps {
  requiere: string | string[];
  requiereTodos?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeUI?: boolean;
  redirectTo?: string;
}

interface ModuleVisibleProps {
  modulo: string;
  children: React.ReactNode;
}

interface ModuleHiddenProps {
  modulo: string;
  children: React.ReactNode;
}

const ICONOS_MODULOS: Record<string, LucideIcon> = {
  core: Lock,
  agendamiento: Calendar,
  inventario: Package,
  pos: ShoppingCart,
  comisiones: DollarSign,
  marketplace: Globe,
  chatbots: Bot,
  website: Globe2,
};

const NOMBRES_MODULOS: Record<string, string> = {
  core: 'Core del Sistema',
  agendamiento: 'Sistema de Agendamiento',
  inventario: 'Gestión de Inventario',
  pos: 'Punto de Venta',
  comisiones: 'Sistema de Comisiones',
  marketplace: 'Marketplace Público',
  chatbots: 'Chatbots IA',
  website: 'Mi Sitio Web',
};

const ModuleGuard = memo(function ModuleGuard({
  requiere,
  requiereTodos = false,
  children,
  fallback,
  showUpgradeUI = true,
  redirectTo,
}: ModuleGuardProps) {
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
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${SEMANTIC_COLORS.primary.borderSolid}`}></div>
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
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8 text-center">
        {/* Icono */}
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
          <IconoModulo className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Módulo no disponible
        </h2>

        {/* Descripción */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
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
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Contacta a soporte si necesitas ayuda para activar este módulo.
        </p>
      </div>
    </div>
  );
});

ModuleGuard.displayName = 'ModuleGuard';

const ModuleVisible = memo(function ModuleVisible({ modulo, children }: ModuleVisibleProps) {
  const { tieneModulo, isLoading } = useModulos();

  if (isLoading) return null;
  if (!tieneModulo(modulo)) return null;

  return children;
});

ModuleVisible.displayName = 'ModuleVisible';

const ModuleHidden = memo(function ModuleHidden({ modulo, children }: ModuleHiddenProps) {
  const { tieneModulo, isLoading } = useModulos();

  if (isLoading) return null;
  if (tieneModulo(modulo)) return null;

  return children;
});

ModuleHidden.displayName = 'ModuleHidden';

export { ModuleGuard, ModuleVisible, ModuleHidden };
export default ModuleGuard;
export type { ModuleGuardProps, ModuleVisibleProps, ModuleHiddenProps };
