/**
 * Gestión de Organizaciones - Super Admin
 */

import { useState } from 'react';
import useSuperAdmin from '../../hooks/useSuperAdmin';

export default function SuperAdminOrganizaciones() {
    const [filtros, setFiltros] = useState({ page: 1, limit: 20 });
    const { useOrganizaciones } = useSuperAdmin();
    const { data, isLoading } = useOrganizaciones(filtros);

    if (isLoading) {
        return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Cargando organizaciones...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Organizaciones</h1>

            {/* Tabla de organizaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organización</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uso</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data?.data?.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{org.nombre_comercial}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{org.email_admin}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{org.nombre_plan || org.plan_actual}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        org.activo ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                                    }`}>
                                        {org.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                    {org.uso_citas_mes_actual || 0} citas
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
