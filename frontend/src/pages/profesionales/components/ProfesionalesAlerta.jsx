/**
 * Alerta de profesionales sin servicios asignados
 * Ene 2026 - Migración a ListadoCRUDPage
 */

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Componente de alerta para profesionales sin servicios
 */
export default function ProfesionalesAlerta({ profesionales = [], onAsignarServicios }) {
  const sinServicios = useMemo(() => {
    return profesionales.filter(
      p => (p.total_servicios_asignados === 0 || p.total_servicios_asignados === '0') && p.activo
    );
  }, [profesionales]);

  if (sinServicios.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-r-lg mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Atención: {sinServicios.length} profesional{sinServicios.length !== 1 ? 'es' : ''} sin servicios asignados
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>Asigna al menos un servicio a cada profesional para que puedan recibir citas.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {sinServicios.slice(0, 3).map(profesional => (
                <li key={profesional.id}>{profesional.nombre_completo}</li>
              ))}
              {sinServicios.length > 3 && (
                <li>y {sinServicios.length - 3} más...</li>
              )}
            </ul>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAsignarServicios(sinServicios[0])}
              className="bg-white dark:bg-gray-800 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
            >
              Asignar servicios
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
