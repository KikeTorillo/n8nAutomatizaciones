/**
 * Gestión de Planes de Subscripción - Super Admin
 * Actualizado: Muestra límites de servicios
 */

import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import useSuperAdmin from '../../hooks/useSuperAdmin';
import EditarPlanModal from '../../components/superadmin/EditarPlanModal';
import Button from '../../components/ui/Button';

export default function SuperAdminPlanes() {
    const { usePlanes } = useSuperAdmin();
    const { data: planes, isLoading } = usePlanes();
    const [modalOpen, setModalOpen] = useState(false);
    const [planSeleccionado, setPlanSeleccionado] = useState(null);

    const handleEditarPlan = (plan) => {
        setPlanSeleccionado(plan);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setPlanSeleccionado(null);
    };

    if (isLoading) {
        return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Cargando planes...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Planes</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planes?.map((plan) => (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{plan.nombre_plan}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{plan.descripcion}</p>

                        <div className="space-y-2 mb-4">
                            {/* Usuarios - Principal (el que cobra) */}
                            <div className="flex justify-between items-center p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                                <span className="text-primary-700 dark:text-primary-300 font-medium">Usuarios:</span>
                                <span className="font-bold text-primary-800 dark:text-primary-200 text-lg">{plan.limite_usuarios || '∞'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Precio/usuario/mes:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">${plan.precio_por_usuario || plan.precio_mensual || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Sucursales:</span>
                                <span className="font-semibold text-gray-900 dark:text-gray-100">{plan.limite_sucursales || '∞'}</span>
                            </div>
                            {/* Límites secundarios (referencia) */}
                            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Otros límites:</p>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span>Prof: {plan.limite_profesionales || '∞'}</span>
                                    <span>•</span>
                                    <span>Serv: {plan.limite_servicios || '∞'}</span>
                                    <span>•</span>
                                    <span>Citas: {plan.limite_citas_mes || '∞'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Organizaciones activas:</span>
                                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium">
                                    {plan.organizaciones_activas || 0}
                                </span>
                            </div>

                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditarPlan(plan)}
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Editar Plan
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Edición */}
            <EditarPlanModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                plan={planSeleccionado}
            />
        </div>
    );
}
