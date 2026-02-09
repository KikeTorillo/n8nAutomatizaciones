/**
 * Drawer para crear/editar acuerdo de consignacion
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer } from '@/components/ui';
import { useCrearAcuerdoConsigna, useActualizarAcuerdoConsigna } from '@/hooks/almacen';
import { useProveedores } from '@/hooks/inventario';
import { useSucursales } from '@/hooks/sistema';
import { useUbicacionesAlmacen } from '@/hooks/inventario';

const schema = z.object({
  proveedor_id: z.coerce.number().min(1, 'Selecciona un proveedor'),
  porcentaje_comision: z.coerce.number().min(0).max(100, 'Maximo 100%'),
  dias_liquidacion: z.coerce.number().min(1, 'Minimo 1 dia').optional(),
  dias_devolucion: z.coerce.number().min(1).optional(),
  sucursal_id: z.coerce.number().min(1, 'Selecciona una sucursal'),
  ubicacion_consigna_id: z.coerce.number().optional(),
  notas: z.string().max(500).optional(),
});

export default function AcuerdoFormDrawer({ isOpen, onClose, acuerdo = null }) {
  const isEditing = !!acuerdo;

  const { data: proveedoresData } = useProveedores();
  const proveedores = proveedoresData?.proveedores || [];
  const { data: sucursales } = useSucursales();
  const { data: ubicacionesData } = useUbicacionesAlmacen();
  const ubicaciones = ubicacionesData?.ubicaciones || [];

  const crearMutation = useCrearAcuerdoConsigna();
  const actualizarMutation = useActualizarAcuerdoConsigna();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      proveedor_id: '',
      porcentaje_comision: 10,
      dias_liquidacion: 30,
      dias_devolucion: 60,
      sucursal_id: '',
      ubicacion_consigna_id: '',
      notas: '',
    },
  });

  useEffect(() => {
    if (acuerdo) {
      reset({
        proveedor_id: acuerdo.proveedor_id || '',
        porcentaje_comision: acuerdo.porcentaje_comision || 10,
        dias_liquidacion: acuerdo.dias_liquidacion || 30,
        dias_devolucion: acuerdo.dias_devolucion || 60,
        sucursal_id: acuerdo.sucursal_id || '',
        ubicacion_consigna_id: acuerdo.ubicacion_consigna_id || '',
        notas: acuerdo.notas || '',
      });
    } else {
      reset({
        proveedor_id: '',
        porcentaje_comision: 10,
        dias_liquidacion: 30,
        dias_devolucion: 60,
        sucursal_id: '',
        ubicacion_consigna_id: '',
        notas: '',
      });
    }
  }, [acuerdo, reset]);

  const onSubmit = (data) => {
    // Limpiar campos vacios
    const cleanData = {
      ...data,
      sucursal_id: data.sucursal_id || undefined,
      ubicacion_consigna_id: data.ubicacion_consigna_id || undefined,
      notas: data.notas?.trim() || undefined,
    };

    if (isEditing) {
      actualizarMutation.mutate(
        { id: acuerdo.id, data: cleanData },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      crearMutation.mutate(cleanData, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  const isPending = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Acuerdo' : 'Nuevo Acuerdo de Consignacion'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 space-y-4 p-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <select
              {...register('proveedor_id')}
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">Seleccionar proveedor...</option>
              {proveedores?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre || p.razon_social}
                </option>
              ))}
            </select>
            {errors.proveedor_id && (
              <p className="mt-1 text-sm text-red-500">{errors.proveedor_id.message}</p>
            )}
          </div>

          {/* Porcentaje Comision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Porcentaje de Comision (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('porcentaje_comision')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="10"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tu comision por cada venta (se descuenta del pago al proveedor)
            </p>
            {errors.porcentaje_comision && (
              <p className="mt-1 text-sm text-red-500">{errors.porcentaje_comision.message}</p>
            )}
          </div>

          {/* Dias Liquidacion */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dias para Liquidar
              </label>
              <input
                type="number"
                min="1"
                {...register('dias_liquidacion')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dias para Devolver
              </label>
              <input
                type="number"
                min="1"
                {...register('dias_devolucion')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="60"
              />
            </div>
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sucursal <span className="text-red-500">*</span>
            </label>
            <select
              {...register('sucursal_id')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Seleccionar sucursal...</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
            {errors.sucursal_id && (
              <p className="mt-1 text-sm text-red-500">{errors.sucursal_id.message}</p>
            )}
          </div>

          {/* Ubicacion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicacion de Consigna (opcional)
            </label>
            <select
              {...register('ubicacion_consigna_id')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Sin ubicacion especifica</option>
              {ubicaciones?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo} - {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notas
            </label>
            <textarea
              {...register('notas')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Notas adicionales sobre el acuerdo..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} isLoading={isPending} className="flex-1">
            {isEditing ? 'Guardar Cambios' : 'Crear Acuerdo'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
