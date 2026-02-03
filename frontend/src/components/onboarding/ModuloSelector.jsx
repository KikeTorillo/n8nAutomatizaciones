/**
 * ModuloSelector - Selector de módulos para onboarding
 * Dic 2025 - Estilo Odoo
 * Feb 2026 - Refactorizado para usar constantes centralizadas
 *
 * Permite al usuario seleccionar qué módulos quiere activar
 * durante el proceso de onboarding inicial.
 */

import { useMemo } from 'react';
import {
  Globe,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { MODULOS_LISTA, MODULOS_COLORES } from '@/hooks/sistema/constants';
import { MODULOS_ICONOS } from '@/hooks/sistema/modulosIconos';

/**
 * Componente de selector de módulos
 * @param {Object} props
 * @param {Object} props.value - Objeto con estado de módulos { agendamiento: true, ... }
 * @param {Function} props.onChange - Callback cuando cambia la selección
 * @param {string[]|null} props.modulosDisponibles - Módulos habilitados en el plan del usuario
 *        Si es null, se muestra skeleton (cargando)
 *        Si es array vacío, se muestran todos los módulos
 */
function ModuloSelector({ value = {}, onChange, modulosDisponibles = null }) {
  // Filtrar módulos según los disponibles en el plan
  const modulosFiltrados = useMemo(() => {
    // Si es null, aún estamos cargando (se mostrará skeleton)
    if (modulosDisponibles === null) {
      return [];
    }
    // Si el plan no tiene módulos habilitados, retornar vacío
    if (modulosDisponibles.length === 0) {
      return [];
    }
    // Filtrar solo los módulos habilitados en el plan (usando constantes centralizadas)
    return MODULOS_LISTA.filter(m => modulosDisponibles.includes(m.nombre));
  }, [modulosDisponibles]);

  // Helpers memoizados para evitar re-creación en cada render
  const helpers = useMemo(() => {
    // Calcular dependencias faltantes para cada módulo
    // Solo considerar dependencias que están disponibles en el plan
    const getDependenciasFaltantes = (modulo) => {
      if (!modulo.dependencias?.length) return [];
      if (!modulosDisponibles) return [];
      // Solo mostrar dependencias que estén disponibles en el plan
      const depsDisponibles = modulo.dependencias.filter(dep =>
        modulosDisponibles.includes(dep)
      );
      return depsDisponibles.filter((dep) => !value[dep]);
    };

    // Obtener nombre legible de un módulo
    const getDisplayName = (nombre) => {
      const m = MODULOS_LISTA.find((mod) => mod.nombre === nombre);
      return m?.display_name || nombre;
    };

    return { getDependenciasFaltantes, getDisplayName };
  }, [modulosDisponibles, value]);

  const { getDependenciasFaltantes, getDisplayName } = helpers;

  // Handler para toggle de módulo
  const handleToggle = (nombreModulo) => {
    const moduloData = modulosFiltrados.find((m) => m.nombre === nombreModulo);
    const nuevoEstado = !value[nombreModulo];

    let nuevosModulos = { ...value, [nombreModulo]: nuevoEstado };

    if (nuevoEstado && moduloData?.dependencias?.length) {
      // Si activamos un módulo, auto-activar sus dependencias (solo las disponibles)
      moduloData.dependencias.forEach((dep) => {
        if (modulosFiltrados.some(m => m.nombre === dep)) {
          nuevosModulos[dep] = true;
        }
      });
    } else if (!nuevoEstado) {
      // Si desactivamos un módulo, desactivar los que dependen de él
      modulosFiltrados.forEach((m) => {
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

  // Si modulosDisponibles es null, mostrar skeleton (cargando planes)
  if (modulosDisponibles === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ¿Qué necesitas para tu negocio?
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si no hay módulos disponibles en el plan, mostrar mensaje informativo
  if (modulosFiltrados.length === 0) {
    return (
      <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Módulos incluidos
          </span>
        </div>
        <p className="text-sm text-primary-700 dark:text-primary-300 mt-2">
          Tu plan incluye los módulos base. Podrás activar módulos adicionales
          después desde Configuración &gt; Módulos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ¿Qué necesitas para tu negocio?
          </span>
        </div>
        {modulosSeleccionados > 0 && (
          <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full w-fit">
            {modulosSeleccionados} seleccionado{modulosSeleccionados !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid de módulos - Responsive 1-2 columnas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modulosFiltrados.map((modulo) => {
          const Icono = MODULOS_ICONOS[modulo.nombre] || Globe;
          const activo = value[modulo.nombre] === true;
          const colorClasses = MODULOS_COLORES[modulo.nombre];
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
