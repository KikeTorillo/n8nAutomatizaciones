import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, Trash2, Scale, Ruler, Save, X } from 'lucide-react';
import { Button, Drawer, Input } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import {
  useCrearPaquete,
  useActualizarPaquete,
  usePaquete,
  useItemsDisponibles,
  useAgregarItemPaquete,
  useRemoverItemPaquete,
  useCerrarPaquete,
} from '@/hooks/usePaquetes';

// Schema de validacion para dimensiones
const dimensionesSchema = z.object({
  peso_kg: z.coerce.number().positive().optional().or(z.literal('')),
  largo_cm: z.coerce.number().positive().optional().or(z.literal('')),
  ancho_cm: z.coerce.number().positive().optional().or(z.literal('')),
  alto_cm: z.coerce.number().positive().optional().or(z.literal('')),
  notas: z.string().optional(),
  carrier: z.string().optional(),
  tracking_carrier: z.string().optional(),
});

/**
 * Drawer para crear/editar paquete y agregar items
 * @param {boolean} isOpen - Si el drawer esta abierto
 * @param {Function} onClose - Callback para cerrar
 * @param {number} operacionId - ID de la operacion de empaque
 * @param {number} paqueteId - ID del paquete (null para crear nuevo)
 */
function CrearPaqueteDrawer({ isOpen, onClose, operacionId, paqueteId = null }) {
  const { success: showSuccess, error: showError } = useToast();
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState(1);

  // Queries y mutations
  const { data: paquete, isLoading: cargandoPaquete } = usePaquete(paqueteId);
  const { data: itemsDisponibles = [], isLoading: cargandoItems } = useItemsDisponibles(operacionId);

  const crearMutation = useCrearPaquete();
  const actualizarMutation = useActualizarPaquete();
  const agregarItemMutation = useAgregarItemPaquete();
  const removerItemMutation = useRemoverItemPaquete();
  const cerrarMutation = useCerrarPaquete();

  const esNuevo = !paqueteId;
  const paqueteAbierto = paquete?.estado === 'abierto';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(dimensionesSchema),
    defaultValues: {
      peso_kg: '',
      largo_cm: '',
      ancho_cm: '',
      alto_cm: '',
      notas: '',
      carrier: '',
      tracking_carrier: '',
    },
  });

  // Cargar datos del paquete existente
  useEffect(() => {
    if (paquete) {
      reset({
        peso_kg: paquete.peso_kg || '',
        largo_cm: paquete.largo_cm || '',
        ancho_cm: paquete.ancho_cm || '',
        alto_cm: paquete.alto_cm || '',
        notas: paquete.notas || '',
        carrier: paquete.carrier || '',
        tracking_carrier: paquete.tracking_carrier || '',
      });
    }
  }, [paquete, reset]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset();
      setItemSeleccionado(null);
      setCantidadAgregar(1);
    }
  }, [isOpen, reset]);

  // Crear paquete nuevo
  const handleCrear = async () => {
    try {
      await crearMutation.mutateAsync({ operacionId, data: {} });
      showSuccess('Paquete creado');
    } catch (error) {
      showError(error.message);
    }
  };

  // Guardar dimensiones
  const onSubmitDimensiones = async (data) => {
    if (!paqueteId) return;

    // Limpiar valores vacios
    const dataLimpia = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        dataLimpia[key] = data[key];
      }
    });

    if (Object.keys(dataLimpia).length === 0) {
      return;
    }

    try {
      await actualizarMutation.mutateAsync({ id: paqueteId, data: dataLimpia });
    } catch (error) {
      showError(error.message);
    }
  };

  // Agregar item al paquete
  const handleAgregarItem = async () => {
    if (!itemSeleccionado || !paqueteId || cantidadAgregar < 1) return;

    try {
      await agregarItemMutation.mutateAsync({
        paqueteId,
        data: {
          operacion_item_id: itemSeleccionado.operacion_item_id,
          cantidad: cantidadAgregar,
          numero_serie_id: itemSeleccionado.numero_serie_id || undefined,
        },
        operacionId,
      });
      setItemSeleccionado(null);
      setCantidadAgregar(1);
    } catch (error) {
      showError(error.message);
    }
  };

  // Remover item del paquete
  const handleRemoverItem = async (itemId) => {
    if (!paqueteId) return;

    try {
      await removerItemMutation.mutateAsync({
        paqueteId,
        itemId,
        operacionId,
      });
    } catch (error) {
      showError(error.message);
    }
  };

  // Cerrar paquete
  const handleCerrar = async () => {
    if (!paqueteId) return;

    try {
      await cerrarMutation.mutateAsync(paqueteId);
      onClose();
    } catch (error) {
      showError(error.message);
    }
  };

  const cargando = cargandoPaquete || cargandoItems;
  const guardando = crearMutation.isPending || actualizarMutation.isPending;
  const itemsEnPaquete = paquete?.items || [];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esNuevo ? 'Crear Paquete' : `Paquete ${paquete?.folio || ''}`}
      size="lg"
    >
      <div className="flex flex-col h-full">
        {esNuevo ? (
          // Vista para crear nuevo paquete
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Crear nuevo paquete
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Se creara un paquete vacio para esta operacion de empaque
              </p>
              <Button
                onClick={handleCrear}
                isLoading={crearMutation.isPending}
                className="mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Paquete
              </Button>
            </div>
          </div>
        ) : cargando ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          // Vista de edicion de paquete
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Items del paquete */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Contenido del paquete ({itemsEnPaquete.length})
              </h4>

              {itemsEnPaquete.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  El paquete esta vacio
                </p>
              ) : (
                <div className="space-y-2">
                  {itemsEnPaquete.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.producto_nombre}
                        </span>
                        {item.variante_nombre && (
                          <span className="text-gray-500 ml-1">
                            ({item.variante_nombre})
                          </span>
                        )}
                        {item.numero_serie && (
                          <div className="text-xs text-gray-500 font-mono">
                            NS: {item.numero_serie}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">x{item.cantidad}</span>
                        {paqueteAbierto && (
                          <button
                            onClick={() => handleRemoverItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            disabled={removerItemMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agregar items (solo si el paquete esta abierto) */}
            {paqueteAbierto && itemsDisponibles.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Agregar items
                </h4>

                <div className="space-y-3">
                  {/* Selector de item */}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {itemsDisponibles.map((item) => (
                      <button
                        key={`${item.operacion_item_id}-${item.numero_serie_id || 0}`}
                        onClick={() => {
                          setItemSeleccionado(item);
                          setCantidadAgregar(Math.min(1, item.cantidad_disponible));
                        }}
                        className={`w-full p-2 text-left rounded border ${
                          itemSeleccionado?.operacion_item_id === item.operacion_item_id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.producto_nombre}
                            </span>
                            {item.variante_nombre && (
                              <span className="text-gray-500 ml-1 text-sm">
                                ({item.variante_nombre})
                              </span>
                            )}
                            {item.numero_serie && (
                              <div className="text-xs text-gray-500 font-mono">
                                NS: {item.numero_serie}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Disp: {item.cantidad_disponible}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Cantidad y boton agregar */}
                  {itemSeleccionado && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max={itemSeleccionado.cantidad_disponible}
                        value={cantidadAgregar}
                        onChange={(e) => setCantidadAgregar(Math.min(
                          parseInt(e.target.value) || 1,
                          itemSeleccionado.cantidad_disponible
                        ))}
                        className="w-24"
                      />
                      <Button
                        onClick={handleAgregarItem}
                        isLoading={agregarItemMutation.isPending}
                        disabled={cantidadAgregar < 1}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setItemSeleccionado(null);
                          setCantidadAgregar(1);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dimensiones y peso */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Dimensiones y Peso
              </h4>

              <form onSubmit={handleSubmit(onSubmitDimensiones)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Peso (kg)"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    {...register('peso_kg')}
                    error={errors.peso_kg?.message}
                    disabled={!paqueteAbierto}
                  />
                  <div></div>
                  <Input
                    label="Largo (cm)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('largo_cm')}
                    error={errors.largo_cm?.message}
                    disabled={!paqueteAbierto}
                  />
                  <Input
                    label="Ancho (cm)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('ancho_cm')}
                    error={errors.ancho_cm?.message}
                    disabled={!paqueteAbierto}
                  />
                  <Input
                    label="Alto (cm)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('alto_cm')}
                    error={errors.alto_cm?.message}
                    disabled={!paqueteAbierto}
                  />
                </div>

                <Input
                  label="Carrier"
                  placeholder="DHL, FedEx, Estafeta..."
                  {...register('carrier')}
                  disabled={!paqueteAbierto}
                />

                <Input
                  label="Numero de tracking"
                  placeholder="Numero de guia"
                  {...register('tracking_carrier')}
                  disabled={!paqueteAbierto}
                />

                <Input
                  label="Notas"
                  as="textarea"
                  rows={2}
                  placeholder="Notas adicionales..."
                  {...register('notas')}
                  disabled={!paqueteAbierto}
                />

                {paqueteAbierto && isDirty && (
                  <Button
                    type="submit"
                    variant="outline"
                    isLoading={actualizarMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar cambios
                  </Button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Footer con acciones */}
        {!esNuevo && paquete && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {paqueteAbierto && itemsEnPaquete.length > 0 && (
              <Button
                onClick={handleCerrar}
                isLoading={cerrarMutation.isPending}
                className="flex-1"
              >
                Cerrar Paquete
              </Button>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default CrearPaqueteDrawer;
