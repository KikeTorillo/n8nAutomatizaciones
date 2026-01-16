/**
 * CuentasBancariasSection - Gestión de cuentas bancarias del empleado
 * Refactorizado con ExpandableCrudSection - Enero 2026
 *
 * Reducido de 264 LOC a ~120 LOC (-55%)
 */
import { Building2, CreditCard, Star, Edit2, Trash2 } from 'lucide-react';
import { ExpandableCrudSection } from '@/components/ui';
import CuentaBancariaDrawer from './drawers/CuentaBancariaDrawer';
import { useToast } from '@/hooks/useToast';
import {
  useCuentasBancarias,
  useEliminarCuentaBancaria,
  useEstablecerCuentaPrincipal,
  TIPOS_CUENTA_BANCARIA,
  USOS_CUENTA_BANCARIA,
} from '@/hooks/useCuentasBancarias';

// Ocultar número de cuenta parcialmente
const maskAccountNumber = (num) => {
  if (!num || num.length < 6) return num;
  return `****${num.slice(-4)}`;
};

/**
 * Card individual de cuenta bancaria
 */
function CuentaCard({ item: cuenta, onEdit, onDelete, onSetPrincipal, isSettingPrincipal }) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        cuenta.es_principal
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CreditCard className={`h-5 w-5 mt-0.5 ${cuenta.es_principal ? 'text-primary-600' : 'text-gray-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{cuenta.banco}</span>
              {cuenta.es_principal && (
                <span className="flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3" />
                  Principal
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {maskAccountNumber(cuenta.numero_cuenta)}
              {cuenta.clabe && ` | CLABE: ${maskAccountNumber(cuenta.clabe)}`}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                {TIPOS_CUENTA_BANCARIA[cuenta.tipo_cuenta]?.label || cuenta.tipo_cuenta}
              </span>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                {USOS_CUENTA_BANCARIA[cuenta.uso]?.label || cuenta.uso}
              </span>
              <span className="text-xs text-gray-500">{cuenta.moneda}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          {!cuenta.es_principal && (
            <button
              type="button"
              onClick={() => onSetPrincipal(cuenta)}
              disabled={isSettingPrincipal}
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
              title="Establecer como principal"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sección de Cuentas Bancarias
 */
function CuentasBancariasSection({ profesionalId }) {
  const toast = useToast();

  // Query y mutations
  const { data: cuentasData, isLoading, error } = useCuentasBancarias(profesionalId);
  const eliminarMutation = useEliminarCuentaBancaria();
  const establecerPrincipalMutation = useEstablecerCuentaPrincipal();

  const cuentas = cuentasData?.cuentas || [];
  const conteo = cuentasData?.conteo || { total: 0 };

  // Handler para establecer cuenta principal
  const handleSetPrincipal = async (cuenta) => {
    try {
      await establecerPrincipalMutation.mutateAsync({
        profesionalId,
        cuentaId: cuenta.id,
      });
      toast.success('Cuenta establecida como principal');
    } catch (err) {
      toast.error(err.message || 'Error al establecer cuenta principal');
    }
  };

  return (
    <ExpandableCrudSection
      icon={Building2}
      title="Cuentas Bancarias"
      count={conteo.total}
      items={cuentas}
      isLoading={isLoading}
      error={error}
      emptyMessage="No hay cuentas bancarias registradas"
      loadingMessage="Cargando cuentas..."
      errorMessage="Error al cargar cuentas bancarias"
      addButtonText="Agregar Cuenta Bancaria"
      renderItem={(item, actions) => (
        <CuentaCard
          item={item}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onSetPrincipal={handleSetPrincipal}
          isSettingPrincipal={establecerPrincipalMutation.isPending}
        />
      )}
      deleteConfig={{
        title: 'Eliminar Cuenta Bancaria',
        getMessage: (item) =>
          `¿Estás seguro de eliminar la cuenta de ${item.banco}? Esta acción no se puede deshacer.`,
        mutation: eliminarMutation,
        getDeleteParams: (item) => ({
          profesionalId,
          cuentaId: item.id,
        }),
        successMessage: 'Cuenta bancaria eliminada',
      }}
      DrawerComponent={CuentaBancariaDrawer}
      drawerProps={{ profesionalId }}
    />
  );
}

export default CuentasBancariasSection;
