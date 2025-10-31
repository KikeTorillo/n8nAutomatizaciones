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
        return <div className="text-center py-12">Cargando organizaciones...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Organizaciones</h1>

            {/* Tabla de organizaciones */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organización</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data?.data?.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{org.nombre_comercial}</div>
                                    <div className="text-sm text-gray-500">{org.email_admin}</div>
                                </td>
                                <td className="px-6 py-4 text-sm">{org.nombre_plan || org.plan_actual}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                        org.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {org.activo ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
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
