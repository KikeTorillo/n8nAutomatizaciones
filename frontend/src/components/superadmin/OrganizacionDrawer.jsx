/**
 * OrganizacionDrawer - Drawer de detalle de organización
 * Muestra información completa y permite suspender/reactivar
 */

import { Building2, Mail, Phone, Calendar, Users, UserCircle, Ban, CheckCircle } from 'lucide-react';
import { Drawer, Badge, Button } from '@/components/ui';

/**
 * Formatea fecha ISO a formato legible
 */
const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Item de información con icono
 */
function InfoItem({ icon: Icon, label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                    {value}
                </p>
            </div>
        </div>
    );
}

/**
 * Sección de métricas con grid
 */
function MetricasGrid({ organizacion }) {
    const metricas = [
        { label: 'Usuarios', value: organizacion.total_usuarios || 0 },
        { label: 'Profesionales', value: organizacion.total_profesionales || 0 },
        { label: 'Clientes', value: organizacion.total_clientes || 0 },
        { label: 'Citas mes', value: organizacion.citas_mes || organizacion.uso_citas_mes_actual || 0 },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {metricas.map((m) => (
                <div
                    key={m.label}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center"
                >
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {m.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                </div>
            ))}
        </div>
    );
}

/**
 * OrganizacionDrawer
 */
export default function OrganizacionDrawer({
    isOpen,
    onClose,
    organizacion,
    onSuspender,
    onReactivar,
    isLoadingAction,
}) {
    if (!organizacion) return null;

    const estaSuspendida = organizacion.suspendido;
    const estaActiva = organizacion.activo && !organizacion.suspendido;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            title={organizacion.nombre_comercial}
            subtitle="Detalle de organización"
        >
            <div className="space-y-6">
                {/* Estado */}
                <div className="flex items-center gap-2">
                    {estaSuspendida ? (
                        <Badge variant="danger" size="md">Suspendida</Badge>
                    ) : estaActiva ? (
                        <Badge variant="success" size="md">Activa</Badge>
                    ) : (
                        <Badge variant="default" size="md">Inactiva</Badge>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Plan: {organizacion.nombre_plan || organizacion.plan_actual || 'Sin plan'}
                    </span>
                </div>

                {/* Motivo suspensión */}
                {estaSuspendida && organizacion.motivo_suspension && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Motivo de suspensión:
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                            {organizacion.motivo_suspension}
                        </p>
                    </div>
                )}

                {/* Información general */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Información general
                    </h3>
                    <div className="space-y-1">
                        <InfoItem
                            icon={Mail}
                            label="Email administrador"
                            value={organizacion.email_admin}
                        />
                        <InfoItem
                            icon={Phone}
                            label="Teléfono"
                            value={organizacion.telefono}
                        />
                        <InfoItem
                            icon={Building2}
                            label="RFC"
                            value={organizacion.rfc}
                        />
                        <InfoItem
                            icon={Calendar}
                            label="Fecha de registro"
                            value={formatFecha(organizacion.creado_en || organizacion.created_at)}
                        />
                    </div>
                </div>

                {/* Métricas */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Métricas de uso
                    </h3>
                    <MetricasGrid organizacion={organizacion} />
                </div>

                {/* Acciones */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    {estaSuspendida ? (
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => onReactivar(organizacion)}
                            isLoading={isLoadingAction}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Reactivar organización
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            className="w-full"
                            onClick={() => onSuspender(organizacion)}
                            isLoading={isLoadingAction}
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspender organización
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                    >
                        Cerrar
                    </Button>
                </div>
            </div>
        </Drawer>
    );
}
