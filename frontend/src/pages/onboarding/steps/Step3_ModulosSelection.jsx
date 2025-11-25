import { useState, useEffect } from 'react';
import { useModulosDisponibles } from '@/hooks/useModulos';
import useOnboardingStore from '@/store/onboardingStore';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  Package,
  Check,
  Calendar,
  ShoppingCart,
  DollarSign,
  Globe,
  Bot,
  Settings,
  Info,
  Zap,
} from 'lucide-react';

/**
 * Mapeo de iconos por módulo
 */
const ICONOS = {
  core: Settings,
  agendamiento: Calendar,
  inventario: Package,
  pos: ShoppingCart,
  comisiones: DollarSign,
  marketplace: Globe,
  chatbots: Bot,
};

/**
 * Colores por módulo
 */
const COLORES = {
  core: 'bg-gray-100 text-gray-600',
  agendamiento: 'bg-blue-100 text-blue-600',
  inventario: 'bg-green-100 text-green-600',
  pos: 'bg-purple-100 text-purple-600',
  comisiones: 'bg-yellow-100 text-yellow-600',
  marketplace: 'bg-pink-100 text-pink-600',
  chatbots: 'bg-cyan-100 text-cyan-600',
};

/**
 * Paso 3: Selección de Módulos
 */
function Step3_ModulosSelection() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore();
  const toast = useToast();

  // Inicializar módulos seleccionados desde el store
  const [selectedModulos, setSelectedModulos] = useState(
    formData.modulos?.selected || []
  );

  // Fetch módulos disponibles
  const { data, isLoading, error } = useModulosDisponibles();

  const modulosDisponibles = data?.modulos || [];

  // Separar módulos base de los opcionales
  const modulosBase = modulosDisponibles.filter((m) => m.incluido_en_todos);
  const modulosOpcionales = modulosDisponibles.filter((m) => !m.incluido_en_todos);

  // Verificar dependencias
  const puedeSeleccionar = (modulo) => {
    if (!modulo.dependencias?.length) return true;
    return modulo.dependencias.every(
      (dep) => selectedModulos.includes(dep) || modulosBase.some((m) => m.nombre === dep)
    );
  };

  // Obtener dependencias faltantes
  const getDependenciasFaltantes = (modulo) => {
    if (!modulo.dependencias?.length) return [];
    return modulo.dependencias.filter(
      (dep) => !selectedModulos.includes(dep) && !modulosBase.some((m) => m.nombre === dep)
    );
  };

  // Toggle módulo
  const handleToggleModulo = (nombreModulo) => {
    const modulo = modulosOpcionales.find((m) => m.nombre === nombreModulo);

    if (!modulo) return;

    if (selectedModulos.includes(nombreModulo)) {
      // Desactivar - verificar que ningún otro módulo seleccionado dependa de este
      const dependientes = modulosOpcionales.filter(
        (m) => selectedModulos.includes(m.nombre) && m.dependencias?.includes(nombreModulo)
      );

      if (dependientes.length > 0) {
        toast.warning(
          `No puedes desactivar ${modulo.display_name} porque ${dependientes.map(d => d.display_name).join(', ')} depende de él`
        );
        return;
      }

      setSelectedModulos((prev) => prev.filter((m) => m !== nombreModulo));
    } else {
      // Activar - verificar dependencias
      if (!puedeSeleccionar(modulo)) {
        const faltantes = getDependenciasFaltantes(modulo);
        toast.warning(`Primero activa: ${faltantes.join(', ')}`);
        return;
      }

      setSelectedModulos((prev) => [...prev, nombreModulo]);
    }
  };

  // Calcular costo mensual adicional
  const costoAdicional = modulosOpcionales
    .filter((m) => selectedModulos.includes(m.nombre))
    .reduce((sum, m) => sum + (m.precio_mensual || 0), 0);

  const handleContinue = () => {
    // Guardar módulos seleccionados en el store
    updateFormData('modulos', {
      selected: selectedModulos,
      costoAdicional,
    });

    nextStep();
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Cargando módulos disponibles..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error al cargar los módulos</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Personaliza tu Plataforma
        </h2>
        <p className="text-gray-600">
          Selecciona los módulos que necesitas. Podrás cambiarlos después.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            Los módulos base están <strong>incluidos sin costo adicional</strong>.
            Los módulos opcionales tienen un costo mensual que se suma a tu plan.
          </p>
        </div>
      </div>

      {/* Módulos Base */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Módulos Incluidos (sin costo adicional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modulosBase.map((modulo) => {
            const Icono = ICONOS[modulo.nombre] || Package;
            const colorClasses = COLORES[modulo.nombre] || COLORES.core;

            return (
              <div
                key={modulo.nombre}
                className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icono className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{modulo.display_name}</h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Incluido
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{modulo.descripcion}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Módulos Opcionales */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-500" />
          Módulos Opcionales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modulosOpcionales.map((modulo) => {
            const Icono = ICONOS[modulo.nombre] || Package;
            const colorClasses = COLORES[modulo.nombre] || COLORES.core;
            const isSelected = selectedModulos.includes(modulo.nombre);
            const canSelect = puedeSeleccionar(modulo);
            const dependenciasFaltantes = getDependenciasFaltantes(modulo);

            return (
              <div
                key={modulo.nombre}
                onClick={() => handleToggleModulo(modulo.nombre)}
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : canSelect
                      ? 'border-gray-200 hover:border-purple-300'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colorClasses}`}>
                    <Icono className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{modulo.display_name}</h4>
                      {/* Checkbox visual */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                          ${isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{modulo.descripcion}</p>

                    {/* Precio */}
                    <p className="text-sm font-semibold text-purple-600 mt-2">
                      +${modulo.precio_mensual} MXN/mes
                    </p>

                    {/* Dependencias faltantes */}
                    {!canSelect && dependenciasFaltantes.length > 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        Requiere: {dependenciasFaltantes.join(', ')}
                      </p>
                    )}

                    {/* Dependencias satisfechas */}
                    {modulo.dependencias?.length > 0 && canSelect && (
                      <p className="text-xs text-gray-500 mt-1">
                        Requiere: {modulo.dependencias.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen de costo */}
      {costoAdicional > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">
                Costo adicional mensual por módulos
              </p>
              <p className="text-xs text-purple-700">
                {selectedModulos.length} módulo(s) opcional(es) seleccionado(s)
              </p>
            </div>
            <p className="text-xl font-bold text-purple-600">
              +${costoAdicional} MXN/mes
            </p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button onClick={handleContinue}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default Step3_ModulosSelection;
