import { useState } from 'react';
import { useSuperAdmin } from '../../hooks/useSuperAdmin';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import { RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * Página de Gestión de Planes - Super Admin
 * Permite sincronizar planes con Mercado Pago de forma manual
 */
function GestionPlanes() {
  const toast = useToast();
  const { usePlanes, sincronizarPlanes } = useSuperAdmin();
  const { data: planes, isLoading } = usePlanes();
  const [sincronizando, setSincronizando] = useState(false);
  const [planSincronizando, setPlanSincronizando] = useState(null);

  /**
   * Sincronizar todos los planes
   */
  const handleSincronizarTodos = async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarPlanes.mutateAsync();

      toast.success(
        `Sincronización completada: ${resultado.creados} creados, ${resultado.sincronizados} verificados`
      );
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  /**
   * Sincronizar un plan específico
   */
  const handleSincronizarUno = async (planId) => {
    setPlanSincronizando(planId);
    try {
      const resultado = await sincronizarPlanes.mutateAsync({ plan_ids: [planId] });

      const detalle = resultado.detalles[0];
      if (detalle.accion === 'error') {
        toast.error(detalle.mensaje);
      } else {
        toast.success(detalle.mensaje);
      }
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setPlanSincronizando(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Planes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra la sincronización de planes con Mercado Pago
          </p>
        </div>

        <Button
          onClick={handleSincronizarTodos}
          disabled={sincronizando || !planes?.length}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          {sincronizando ? 'Sincronizando...' : 'Sincronizar Todos'}
        </Button>
      </div>

      {/* Tabla de Planes */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Precio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                MP Plan ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Org. Activas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planes?.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {parseFloat(plan.precio_mensual) <= 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400" title="Mercado Pago no permite planes gratis">N/A</span>
                    </div>
                  ) : plan.mp_plan_id ? (
                    <CheckCircle className="w-5 h-5 text-green-600" title="Sincronizado" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" title="No sincronizado" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{plan.nombre_plan}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{plan.codigo_plan}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${plan.precio_mensual} {plan.moneda || 'MXN'}/mes
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-500 font-mono">
                    {plan.mp_plan_id ? (
                      plan.mp_plan_id.substring(0, 20) + '...'
                    ) : (
                      <span className="text-gray-400">Sin sincronizar</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {plan.organizaciones_activas || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSincronizarUno(plan.id)}
                    disabled={planSincronizando === plan.id || parseFloat(plan.precio_mensual) <= 0}
                    className="text-primary-600 hover:text-primary-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={parseFloat(plan.precio_mensual) <= 0 ? "No se pueden sincronizar planes con precio $0" : "Sincronizar plan"}
                  >
                    {planSincronizando === plan.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!planes?.length && (
          <div className="text-center py-12 text-gray-500">
            No hay planes registrados
          </div>
        )}
      </div>

      {/* Información */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Información sobre la sincronización
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Sincronizado (✓)</strong>: El plan tiene un ID válido en Mercado Pago</li>
          <li><strong>No sincronizado (⚠)</strong>: El plan necesita crearse en Mercado Pago</li>
          <li><strong>N/A</strong>: Planes con precio $0 no se pueden sincronizar (MP no permite planes gratis)</li>
          <li><strong>Sincronizar Todos</strong>: Verifica y sincroniza todos los planes de pago automáticamente</li>
          <li><strong>Botón individual</strong>: Sincroniza solo ese plan específico (deshabilitado para planes $0)</li>
        </ul>
      </div>
    </div>
  );
}

export default GestionPlanes;
