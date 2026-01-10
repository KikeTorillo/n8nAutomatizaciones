/**
 * ====================================================================
 * PAGINA - OPORTUNIDADES (PIPELINE CRM)
 * ====================================================================
 *
 * Fase 2A - Dashboard global de oportunidades (Ene 2026)
 * Vista Lista y Kanban con drag & drop
 *
 * ====================================================================
 */

import { useState, useMemo } from 'react';
import { TrendingUp, List, Columns3, DollarSign, Target, Clock, CheckCircle } from 'lucide-react';
import ClientesPageLayout from '@/components/clientes/ClientesPageLayout';
import { ViewTabs } from '@/components/ui/ViewTabs';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonTable from '@/components/ui/SkeletonTable';
import PipelineKanban from '@/components/clientes/PipelineKanban';
import {
  useOportunidades,
  useEstadisticasPipeline,
  formatMoney,
  getEstado,
  getPrioridad,
} from '@/hooks/useOportunidades';

// Configuracion de tabs de vista
const VIEW_TABS = [
  { id: 'lista', label: 'Lista', icon: List },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
];

export default function OportunidadesPage() {
  const [vista, setVista] = useState('kanban');

  // Datos
  const { data: oportunidadesData, isLoading: isLoadingOportunidades } = useOportunidades();
  const { data: estadisticas, isLoading: isLoadingStats } = useEstadisticasPipeline();

  // Stats cards
  const statsConfig = useMemo(() => {
    if (!estadisticas) return [];

    return [
      {
        key: 'total',
        icon: Target,
        label: 'Oportunidades',
        value: estadisticas.total_oportunidades || 0,
        color: 'blue',
      },
      {
        key: 'valor',
        icon: DollarSign,
        label: 'Valor Total',
        value: formatMoney(estadisticas.valor_total || 0),
        color: 'green',
      },
      {
        key: 'ponderado',
        icon: TrendingUp,
        label: 'Valor Ponderado',
        value: formatMoney(estadisticas.valor_ponderado || 0),
        color: 'purple',
        subtext: 'Ajustado por probabilidad',
      },
      {
        key: 'ganadas',
        icon: CheckCircle,
        label: 'Tasa de Cierre',
        value: `${estadisticas.tasa_conversion || 0}%`,
        color: 'primary',
      },
    ];
  }, [estadisticas]);

  return (
    <ClientesPageLayout
      icon={TrendingUp}
      title="Oportunidades"
      subtitle={`Pipeline de ventas B2B`}
    >
      {/* Stats */}
      {!isLoadingStats && estadisticas && (
        <StatCardGrid stats={statsConfig} columns={4} />
      )}

      {/* View Tabs */}
      <ViewTabs
        tabs={VIEW_TABS}
        activeTab={vista}
        onChange={setVista}
        ariaLabel="Cambiar vista de oportunidades"
      />

      {/* Contenido segun vista */}
      {vista === 'kanban' && <PipelineKanban />}

      {vista === 'lista' && (
        <OportunidadesLista
          data={oportunidadesData}
          isLoading={isLoadingOportunidades}
        />
      )}
    </ClientesPageLayout>
  );
}

/**
 * Vista de Lista de Oportunidades
 */
function OportunidadesLista({ data, isLoading }) {
  const oportunidades = data?.oportunidades || [];

  if (isLoading) {
    return <SkeletonTable rows={5} cols={6} />;
  }

  if (oportunidades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sin oportunidades"
        description="No hay oportunidades registradas. Las oportunidades se crean desde el perfil del cliente."
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Oportunidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Etapa
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Probabilidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {oportunidades.map((oportunidad) => {
              const estado = getEstado(oportunidad.estado);
              const prioridad = getPrioridad(oportunidad.prioridad);

              return (
                <tr
                  key={oportunidad.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {oportunidad.titulo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {oportunidad.fuente || 'Sin fuente'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {oportunidad.cliente_nombre || 'Sin cliente'}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: oportunidad.etapa_color || '#6B7280',
                        color: '#FFFFFF',
                      }}
                    >
                      {oportunidad.etapa_nombre || 'Sin etapa'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                    {formatMoney(oportunidad.ingreso_esperado)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${oportunidad.probabilidad || 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {oportunidad.probabilidad || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estado.bgColor} ${estado.color}`}
                    >
                      {estado.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
