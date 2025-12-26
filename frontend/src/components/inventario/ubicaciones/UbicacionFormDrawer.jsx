import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import {
  useCrearUbicacion,
  useActualizarUbicacion,
} from '@/hooks/useInventario';

// Schema de validación
const ubicacionSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(30),
  nombre: z.string().max(100).optional().or(z.literal('')),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  tipo: z.enum(['zona', 'pasillo', 'estante', 'bin'], {
    required_error: 'El tipo es requerido',
  }),
  capacidad_maxima: z.coerce.number().min(0).optional().nullable(),
  peso_maximo_kg: z.coerce.number().min(0).optional().nullable(),
  volumen_m3: z.coerce.number().min(0).optional().nullable(),
  es_picking: z.boolean().default(false),
  es_recepcion: z.boolean().default(false),
  es_despacho: z.boolean().default(false),
  es_cuarentena: z.boolean().default(false),
  es_devolucion: z.boolean().default(false),
  temperatura_min: z.coerce.number().optional().nullable(),
  temperatura_max: z.coerce.number().optional().nullable(),
  humedad_controlada: z.boolean().default(false),
  orden: z.coerce.number().min(0).default(0),
  color: z.string().max(20).optional().or(z.literal('')),
  icono: z.string().max(50).optional().or(z.literal('')),
  activo: z.boolean().default(true),
});

const tiposUbicacion = [
  { value: 'zona', label: 'Zona', description: 'Área principal del almacén' },
  { value: 'pasillo', label: 'Pasillo', description: 'Corredor entre zonas' },
  { value: 'estante', label: 'Estante', description: 'Estantería o rack' },
  { value: 'bin', label: 'Bin', description: 'Ubicación específica de almacenaje' },
];

const tipoHijo = {
  zona: 'pasillo',
  pasillo: 'estante',
  estante: 'bin',
  bin: null,
};

/**
 * Drawer para crear/editar ubicaciones de almacén
 */
function UbicacionFormDrawer({ isOpen, onClose, ubicacion, parent, sucursalId }) {
  const { success: showSuccess, error: showError } = useToast();
  const isEditing = !!ubicacion;

  const crearMutation = useCrearUbicacion();
  const actualizarMutation = useActualizarUbicacion();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'zona',
      capacidad_maxima: null,
      peso_maximo_kg: null,
      volumen_m3: null,
      es_picking: false,
      es_recepcion: false,
      es_despacho: false,
      es_cuarentena: false,
      es_devolucion: false,
      temperatura_min: null,
      temperatura_max: null,
      humedad_controlada: false,
      orden: 0,
      color: '',
      icono: '',
      activo: true,
    },
  });

  const tipoSeleccionado = watch('tipo');

  // Cargar datos al editar o crear hijo
  useEffect(() => {
    if (isEditing && ubicacion) {
      reset({
        codigo: ubicacion.codigo || '',
        nombre: ubicacion.nombre || '',
        descripcion: ubicacion.descripcion || '',
        tipo: ubicacion.tipo || 'zona',
        capacidad_maxima: ubicacion.capacidad_maxima || null,
        peso_maximo_kg: ubicacion.peso_maximo_kg || null,
        volumen_m3: ubicacion.volumen_m3 || null,
        es_picking: ubicacion.es_picking || false,
        es_recepcion: ubicacion.es_recepcion || false,
        es_despacho: ubicacion.es_despacho || false,
        es_cuarentena: ubicacion.es_cuarentena || false,
        es_devolucion: ubicacion.es_devolucion || false,
        temperatura_min: ubicacion.temperatura_min || null,
        temperatura_max: ubicacion.temperatura_max || null,
        humedad_controlada: ubicacion.humedad_controlada || false,
        orden: ubicacion.orden || 0,
        color: ubicacion.color || '',
        icono: ubicacion.icono || '',
        activo: ubicacion.activo !== false,
      });
    } else if (parent) {
      // Crear sub-ubicación: precargar tipo hijo
      const nuevoTipo = tipoHijo[parent.tipo] || 'bin';
      const prefijoCodigo = parent.codigo ? `${parent.codigo}-` : '';
      reset({
        codigo: prefijoCodigo,
        nombre: '',
        descripcion: '',
        tipo: nuevoTipo,
        capacidad_maxima: null,
        peso_maximo_kg: null,
        volumen_m3: null,
        es_picking: false,
        es_recepcion: false,
        es_despacho: false,
        es_cuarentena: false,
        es_devolucion: false,
        temperatura_min: null,
        temperatura_max: null,
        humedad_controlada: false,
        orden: 0,
        color: '',
        icono: '',
        activo: true,
      });
    } else {
      reset({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'zona',
        capacidad_maxima: null,
        peso_maximo_kg: null,
        volumen_m3: null,
        es_picking: false,
        es_recepcion: false,
        es_despacho: false,
        es_cuarentena: false,
        es_devolucion: false,
        temperatura_min: null,
        temperatura_max: null,
        humedad_controlada: false,
        orden: 0,
        color: '',
        icono: '',
        activo: true,
      });
    }
  }, [isEditing, ubicacion, parent, reset]);

  const onSubmit = async (data) => {
    // Sanitizar campos opcionales vacíos
    const sanitized = {
      ...data,
      nombre: data.nombre || undefined,
      descripcion: data.descripcion || undefined,
      capacidad_maxima: data.capacidad_maxima || undefined,
      peso_maximo_kg: data.peso_maximo_kg || undefined,
      volumen_m3: data.volumen_m3 || undefined,
      temperatura_min: data.temperatura_min || undefined,
      temperatura_max: data.temperatura_max || undefined,
      color: data.color || undefined,
      icono: data.icono || undefined,
      sucursal_id: sucursalId,
      parent_id: parent?.id || ubicacion?.parent_id || undefined,
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({ id: ubicacion.id, ...sanitized });
        showSuccess('Ubicación actualizada correctamente');
      } else {
        await crearMutation.mutateAsync(sanitized);
        showSuccess('Ubicación creada correctamente');
      }
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Error al guardar ubicación');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ubicación' : parent ? `Nueva Sub-ubicación de ${parent.codigo}` : 'Nueva Ubicación'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
              Información Básica
            </h3>

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código *
              </label>
              <input
                type="text"
                {...register('codigo')}
                placeholder="Ej: A-01-03-02"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
              {errors.codigo && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.codigo.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                {...register('nombre')}
                placeholder="Nombre descriptivo (opcional)"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                {...register('tipo')}
                disabled={parent}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {tiposUbicacion.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label} - {tipo.description}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.tipo.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                rows={2}
                placeholder="Descripción opcional"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Capacidad */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
              Capacidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacidad Máx (unidades)
                </label>
                <input
                  type="number"
                  {...register('capacidad_maxima')}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peso Máx (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('peso_maximo_kg')}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Volumen (m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('volumen_m3')}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
              Características
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('es_picking')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Es Picking</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('es_recepcion')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Es Recepción</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('es_despacho')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Es Despacho</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('es_cuarentena')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Es Cuarentena</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('es_devolucion')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Es Devolución</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" {...register('humedad_controlada')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Humedad Controlada</span>
              </label>
            </div>
          </div>

          {/* Temperatura (si aplica) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
              Control de Temperatura
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperatura Mín (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('temperatura_min')}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperatura Máx (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('temperatura_max')}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
              Apariencia
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  {...register('color')}
                  className="w-full h-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  {...register('orden')}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" {...register('activo')} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ubicación activa</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting || crearMutation.isPending || actualizarMutation.isPending}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Ubicación'}
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  );
}

export default UbicacionFormDrawer;
