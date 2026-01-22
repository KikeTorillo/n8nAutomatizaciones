import { Calendar, CreditCard, User, Package, Clock } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CICLO_LABELS, ESTADO_LABELS } from '@/hooks/suscripciones-negocio';
import SuscripcionStatusBadge from '../SuscripcionStatusBadge';
import CuponBadge from '../CuponBadge';

/**
 * Tab de información general de la suscripción
 * @param {Object} suscripcion - Datos de la suscripción
 */
function SuscripcionGeneralTab({ suscripcion }) {
  if (!suscripcion) return null;

  const InfoRow = ({ icon: Icon, label, value, children }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {children || (
          <p className="font-medium text-gray-900 dark:text-gray-100">{value || '-'}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Información del Cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Información del Cliente
        </h3>
        <InfoRow icon={User} label="Cliente">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {suscripcion.cliente_nombre || `Cliente #${suscripcion.cliente_id}`}
          </p>
          {suscripcion.cliente_email && (
            <p className="text-sm text-gray-500">{suscripcion.cliente_email}</p>
          )}
        </InfoRow>
      </div>

      {/* Información del Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Plan de Suscripción
        </h3>
        <InfoRow icon={Package} label="Plan">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {suscripcion.plan_nombre}
          </p>
          <p className="text-sm text-gray-500">
            {formatCurrency(suscripcion.precio)} / {CICLO_LABELS[suscripcion.ciclo_facturacion]?.toLowerCase()}
          </p>
        </InfoRow>

        {suscripcion.cupon && (
          <InfoRow icon={CreditCard} label="Cupón Aplicado">
            <CuponBadge cupon={suscripcion.cupon} />
          </InfoRow>
        )}

        <InfoRow
          icon={CreditCard}
          label="Precio con Descuento"
          value={formatCurrency(suscripcion.precio_con_descuento || suscripcion.precio)}
        />
      </div>

      {/* Estado y Fechas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Estado y Fechas
        </h3>

        <InfoRow icon={Clock} label="Estado Actual">
          <SuscripcionStatusBadge estado={suscripcion.estado} />
        </InfoRow>

        <InfoRow
          icon={Calendar}
          label="Fecha de Inicio"
          value={formatDate(suscripcion.fecha_inicio)}
        />

        {suscripcion.fecha_fin_prueba && (
          <InfoRow
            icon={Calendar}
            label="Fin del Período de Prueba"
            value={formatDate(suscripcion.fecha_fin_prueba)}
          />
        )}

        <InfoRow
          icon={Calendar}
          label="Próximo Cobro"
          value={suscripcion.proxima_fecha_cobro ? formatDate(suscripcion.proxima_fecha_cobro) : 'N/A'}
        />

        {suscripcion.fecha_cancelacion && (
          <InfoRow
            icon={Calendar}
            label="Fecha de Cancelación"
            value={formatDate(suscripcion.fecha_cancelacion)}
          />
        )}

        {suscripcion.motivo_cancelacion && (
          <InfoRow icon={Clock} label="Motivo de Cancelación" value={suscripcion.motivo_cancelacion} />
        )}
      </div>

      {/* Notas */}
      {suscripcion.notas && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Notas
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {suscripcion.notas}
          </p>
        </div>
      )}
    </div>
  );
}

export default SuscripcionGeneralTab;
