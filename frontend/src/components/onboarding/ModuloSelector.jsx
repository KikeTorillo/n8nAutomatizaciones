/**
 * ModuloSelector - Selector de módulos para onboarding
 * Dic 2025 - Estilo Odoo
 *
 * Permite al usuario seleccionar qué módulos quiere activar
 * durante el proceso de onboarding inicial.
 */

import { useMemo } from 'react';
import {
  Calendar,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
  Bot,
  PartyPopper,
  Calculator,
  AlertTriangle,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

/**
 * Definición de módulos disponibles para selección
 * Excluye 'core' que siempre está activo
 */
const MODULOS_ONBOARDING = [
  {
    nombre: 'agendamiento',
    display_name: 'Agendamiento',
    descripcion: 'Citas, profesionales y servicios',
    icono: Calendar,
    dependencias: [],
  },
  {
    nombre: 'inventario',
    display_name: 'Inventario',
    descripcion: 'Productos, proveedores y stock',
    icono: Package,
    dependencias: [],
  },
  {
    nombre: 'workflows',
    display_name: 'Aprobaciones',
    descripcion: 'Flujos de aprobación para compras',
    icono: ClipboardCheck,
    dependencias: ['inventario'],
  },
  {
    nombre: 'pos',
    display_name: 'Punto de Venta',
    descripcion: 'Terminal de venta y caja',
    icono: ShoppingCart,
    dependencias: ['inventario'],
  },
  {
    nombre: 'comisiones',
    display_name: 'Comisiones',
    descripcion: 'Pago a empleados automático',
    icono: DollarSign,
    dependencias: [], // Opcional: agendamiento, pos
  },
  {
    nombre: 'contabilidad',
    display_name: 'Contabilidad',
    descripcion: 'Cuentas, asientos y reportes SAT',
    icono: Calculator,
    dependencias: [],
  },
  {
    nombre: 'marketplace',
    display_name: 'Marketplace',
    descripcion: 'Perfil público y SEO',
    icono: Globe,
    dependencias: ['agendamiento'],
  },
  {
    nombre: 'chatbots',
    display_name: 'Chatbots IA',
    descripcion: 'WhatsApp y Telegram',
    icono: Bot,
    dependencias: ['agendamiento'],
  },
  {
    nombre: 'eventos-digitales',
    display_name: 'Eventos',
    descripcion: 'Invitaciones digitales',
    icono: PartyPopper,
    dependencias: [],
  },
  {
    nombre: 'website',
    display_name: 'Mi Sitio Web',
    descripcion: 'Página web pública',
    icono: Globe,
    dependencias: [],
  },
];

/**
 * Colores por módulo - Variaciones de Nexo Purple
 */
const COLORES = {
  agendamiento: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  inventario: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300',
  workflows: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  pos: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  comisiones: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  contabilidad: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
  marketplace: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400',
  chatbots: 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  'eventos-digitales': 'bg-primary-50 dark:bg-primary-900/30 text-primary-400 dark:text-primary-300',
  website: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
};

/**
 * Componente de selector de módulos
 * @param {Object} props
 * @param {Object} props.value - Objeto con estado de módulos { agendamiento: true, ... }
 * @param {Function} props.onChange - Callback cuando cambia la selección
 */
function ModuloSelector({ value = {}, onChange }) {
  // Calcular dependencias faltantes para cada módulo
  const getDependenciasFaltantes = (modulo) => {
    if (!modulo.dependencias?.length) return [];
    return modulo.dependencias.filter((dep) => !value[dep]);
  };

  // Obtener nombre legible de un módulo
  const getDisplayName = (nombre) => {
    const m = MODULOS_ONBOARDING.find((mod) => mod.nombre === nombre);
    return m?.display_name || nombre;
  };

  // Handler para toggle de módulo
  const handleToggle = (nombreModulo) => {
    const moduloData = MODULOS_ONBOARDING.find((m) => m.nombre === nombreModulo);
    const nuevoEstado = !value[nombreModulo];

    let nuevosModulos = { ...value, [nombreModulo]: nuevoEstado };

    if (nuevoEstado && moduloData?.dependencias?.length) {
      // Si activamos un módulo, auto-activar sus dependencias
      moduloData.dependencias.forEach((dep) => {
        nuevosModulos[dep] = true;
      });
    } else if (!nuevoEstado) {
      // Si desactivamos un módulo, desactivar los que dependen de él
      MODULOS_ONBOARDING.forEach((m) => {
        if (m.dependencias?.includes(nombreModulo) && nuevosModulos[m.nombre]) {
          nuevosModulos[m.nombre] = false;
        }
      });
    }

    onChange(nuevosModulos);
  };

  // Contar módulos seleccionados
  const modulosSeleccionados = useMemo(() => {
    return Object.values(value).filter(Boolean).length;
  }, [value]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ¿Qué necesitas para tu negocio?
          </span>
        </div>
        {modulosSeleccionados > 0 && (
          <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">
            {modulosSeleccionados} seleccionado{modulosSeleccionados !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-2 gap-3">
        {MODULOS_ONBOARDING.map((modulo) => {
          const Icono = modulo.icono;
          const activo = value[modulo.nombre] === true;
          const colorClasses = COLORES[modulo.nombre];
          const dependenciasFaltantes = getDependenciasFaltantes(modulo);
          const tieneDependenciasFaltantes = dependenciasFaltantes.length > 0;

          return (
            <button
              key={modulo.nombre}
              type="button"
              onClick={() => handleToggle(modulo.nombre)}
              className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                activo
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {/* Checkbox indicator */}
              <div
                className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  activo
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {activo && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Contenido */}
              <div className="flex items-start gap-3 pr-6">
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icono className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {modulo.display_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {modulo.descripcion}
                  </p>
                </div>
              </div>

              {/* Advertencia de dependencias (solo si NO está activo y tiene deps faltantes) */}
              {!activo && tieneDependenciasFaltantes && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>
                    + {dependenciasFaltantes.map(getDisplayName).join(', ')}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nota */}
      <p className="text-xs text-center text-gray-500 dark:text-gray-400">
        Podrás activar más módulos después desde Configuración
      </p>
    </div>
  );
}

export default ModuloSelector;
