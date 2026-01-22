import { History, ArrowRight } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useHistorialSuscripcion, ESTADO_LABELS } from '@/hooks/suscripciones-negocio';

/**
 * Tab de historial de cambios de la suscripción
 * @param {number} suscripcionId - ID de la suscripción
 */
function SuscripcionHistorialTab({ suscripcionId }) {
  const { data: historial = [], isLoading } = useHistorialSuscripcion(suscripcionId);

  // Determinar tipo de cambio y formatear
  const formatCambio = (item) => {
    if (item.tipo === 'estado') {
      return {
        titulo: 'Cambio de Estado',
        detalle: (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default" size="sm">{ESTADO_LABELS[item.valor_anterior] || item.valor_anterior}</Badge>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <Badge variant="primary" size="sm">{ESTADO_LABELS[item.valor_nuevo] || item.valor_nuevo}</Badge>
          </div>
        ),
      };
    }

    if (item.tipo === 'plan') {
      return {
        titulo: 'Cambio de Plan',
        detalle: (
          <div className="flex items-center gap-2 text-sm">
            <span>{item.plan_anterior_nombre || item.valor_anterior}</span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{item.plan_nuevo_nombre || item.valor_nuevo}</span>
          </div>
        ),
      };
    }

    return {
      titulo: item.tipo || 'Cambio',
      detalle: <span className="text-sm text-gray-600 dark:text-gray-400">{item.descripcion || item.valor_nuevo}</span>,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin historial"
        description="No hay cambios registrados para esta suscripción"
      />
    );
  }

  return (
    <div className="relative">
      {/* Timeline */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {historial.map((item, index) => {
          const { titulo, detalle } = formatCambio(item);

          return (
            <div key={item.id || index} className="relative pl-10">
              {/* Dot */}
              <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white dark:border-gray-900" />

              {/* Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {titulo}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(item.creado_en, 'PPp')}
                  </span>
                </div>

                {detalle}

                {item.motivo && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Motivo: {item.motivo}
                  </p>
                )}

                {item.usuario_nombre && (
                  <p className="mt-2 text-xs text-gray-400">
                    Por: {item.usuario_nombre}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SuscripcionHistorialTab;
