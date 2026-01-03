/**
 * CuentasBancariasSection - Componente para gestionar cuentas bancarias
 * Fase 1 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  Building2, Plus, Star, Trash2, Edit2, ChevronDown, CreditCard, Loader2, AlertCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CuentaBancariaModal from './CuentaBancariaModal';
import { useToast } from '@/hooks/useToast';
import {
  useCuentasBancarias,
  useEliminarCuentaBancaria,
  useEstablecerCuentaPrincipal,
  TIPOS_CUENTA_BANCARIA,
  USOS_CUENTA_BANCARIA
} from '@/hooks/useCuentasBancarias';

/**
 * Sección de Cuentas Bancarias del empleado
 * @param {number} profesionalId - ID del profesional
 * @param {boolean} isEditing - Si está en modo edición
 */
function CuentasBancariasSection({ profesionalId, isEditing = false }) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cuentaEditar, setCuentaEditar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Queries y mutations
  const { data: cuentasData, isLoading, error } = useCuentasBancarias(profesionalId);
  const eliminarMutation = useEliminarCuentaBancaria();
  const establecerPrincipalMutation = useEstablecerCuentaPrincipal();

  const cuentas = cuentasData?.cuentas || [];
  const conteo = cuentasData?.conteo || { total: 0, principales: 0 };

  // Editar cuenta
  const handleEdit = (cuenta) => {
    setCuentaEditar(cuenta);
    setShowModal(true);
  };

  // Abrir modal para crear
  const handleAgregar = () => {
    setCuentaEditar(null);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setCuentaEditar(null);
  };

  // Eliminar cuenta
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await eliminarMutation.mutateAsync({
        profesionalId,
        cuentaId: confirmDelete.id
      });
      toast.success('Cuenta bancaria eliminada');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar cuenta bancaria');
    }
  };

  // Establecer como principal
  const handleSetPrincipal = async (cuenta) => {
    try {
      await establecerPrincipalMutation.mutateAsync({
        profesionalId,
        cuentaId: cuenta.id
      });
      toast.success('Cuenta establecida como principal');
    } catch (err) {
      toast.error(err.message || 'Error al establecer cuenta principal');
    }
  };

  // Ocultar número de cuenta parcialmente
  const maskAccountNumber = (num) => {
    if (!num || num.length < 6) return num;
    return `****${num.slice(-4)}`;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Cuentas Bancarias
          </h4>
          {conteo.total > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              {conteo.total}
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="pl-7 space-y-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando cuentas...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar cuentas bancarias</span>
            </div>
          )}

          {/* Lista de cuentas */}
          {!isLoading && !error && (
            <>
              {cuentas.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No hay cuentas bancarias registradas
                </div>
              ) : (
                <div className="space-y-2">
                  {cuentas.map((cuenta) => (
                    <div
                      key={cuenta.id}
                      className={`p-3 rounded-lg border ${
                        cuenta.es_principal
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <CreditCard className={`h-5 w-5 mt-0.5 ${
                            cuenta.es_principal ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {cuenta.banco}
                              </span>
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
                              <span className="text-xs text-gray-500">
                                {cuenta.moneda}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1">
                          {!cuenta.es_principal && (
                            <button
                              type="button"
                              onClick={() => handleSetPrincipal(cuenta)}
                              disabled={establecerPrincipalMutation.isPending}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
                              title="Establecer como principal"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(cuenta)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(cuenta)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón agregar */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAgregar}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cuenta Bancaria
              </Button>
            </>
          )}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Cuenta Bancaria"
        message={`¿Estás seguro de eliminar la cuenta de ${confirmDelete?.banco}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      {/* Modal de crear/editar cuenta bancaria */}
      <CuentaBancariaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        profesionalId={profesionalId}
        cuenta={cuentaEditar}
        onSuccess={handleCloseModal}
      />
    </div>
  );
}

export default CuentasBancariasSection;
