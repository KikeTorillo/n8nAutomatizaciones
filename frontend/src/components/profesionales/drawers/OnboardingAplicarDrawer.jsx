/**
 * OnboardingAplicarDrawer - Drawer para aplicar plantilla de onboarding
 * Migrado de Modal a Drawer - Enero 2026
 */
import { useState, useEffect } from 'react';
import { Button, Drawer } from '@/components/ui';
import { Loader2, ClipboardList, CheckCircle2, Users, Building2, Calendar } from 'lucide-react';
import {
  usePlantillasSugeridas,
  useAplicarPlantilla,
  usePlantillasOnboarding
} from '@/hooks/useOnboardingEmpleados';

export default function OnboardingAplicarDrawer({
  isOpen,
  onClose,
  profesionalId
}) {
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [verTodas, setVerTodas] = useState(false);

  // Queries
  const {
    data: sugeridasData,
    isLoading: loadingSugeridas
  } = usePlantillasSugeridas(profesionalId);

  const {
    data: todasData,
    isLoading: loadingTodas
  } = usePlantillasOnboarding({
    filtros: { activo: true },
    enabled: isOpen && verTodas
  });

  const aplicarMutation = useAplicarPlantilla();

  const plantillasSugeridas = sugeridasData?.plantillas || [];
  const plantillasTodas = todasData?.plantillas || [];

  const plantillasAMostrar = verTodas ? plantillasTodas : plantillasSugeridas;
  const isLoading = loadingSugeridas || (verTodas && loadingTodas);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPlantillaSeleccionada(null);
      setVerTodas(false);
    }
  }, [isOpen]);

  // Aplicar plantilla
  const handleAplicar = async () => {
    if (!plantillaSeleccionada) return;

    try {
      await aplicarMutation.mutateAsync({
        profesionalId,
        plantillaId: plantillaSeleccionada.id
      });
      onClose();
    } catch (err) {
      // Error manejado por el hook
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar Plan de Integración"
      subtitle="Selecciona una plantilla de onboarding para el empleado"
    >
      <div className="space-y-4">
        {/* Info */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Se generarán las tareas automáticamente basadas en la fecha de ingreso.
        </p>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Sin plantillas */}
        {!isLoading && plantillasAMostrar.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {verTodas
                ? 'No hay plantillas de onboarding creadas'
                : 'No hay plantillas sugeridas para este empleado'}
            </p>
            {!verTodas && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setVerTodas(true)}
              >
                Ver todas las plantillas
              </Button>
            )}
          </div>
        )}

        {/* Lista de plantillas */}
        {!isLoading && plantillasAMostrar.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {plantillasAMostrar.map((plantilla) => {
              const isSelected = plantillaSeleccionada?.id === plantilla.id;

              return (
                <button
                  key={plantilla.id}
                  type="button"
                  onClick={() => setPlantillaSeleccionada(plantilla)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          isSelected
                            ? 'text-primary-700 dark:text-primary-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {plantilla.nombre}
                        </span>
                        {plantilla.prioridad === 1 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Recomendada
                          </span>
                        )}
                      </div>

                      {plantilla.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {plantilla.descripcion}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {plantilla.total_tareas || 0} tareas
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {plantilla.duracion_dias || 30} días
                        </span>
                        {plantilla.departamento_nombre && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {plantilla.departamento_nombre}
                          </span>
                        )}
                        {plantilla.puesto_nombre && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {plantilla.puesto_nombre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Radio visual */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Toggle ver todas */}
        {!isLoading && plantillasSugeridas.length > 0 && !verTodas && (
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setVerTodas(true)}
            >
              Ver todas las plantillas
            </Button>
          </div>
        )}

        {/* Footer con acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={aplicarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAplicar}
            disabled={!plantillaSeleccionada || aplicarMutation.isPending}
          >
            {aplicarMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Aplicando...
              </>
            ) : (
              'Aplicar Plantilla'
            )}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
