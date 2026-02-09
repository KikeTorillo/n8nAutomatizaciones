import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer, FormGroup, Input, Select, Textarea, CheckboxField } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useCrearUbicacion,
  useActualizarUbicacion,
} from '@/hooks/inventario';

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

const TIPOS_UBICACION = [
  { value: 'zona', label: 'Zona - Área principal del almacén' },
  { value: 'pasillo', label: 'Pasillo - Corredor entre zonas' },
  { value: 'estante', label: 'Estante - Estantería o rack' },
  { value: 'bin', label: 'Bin - Ubicación específica de almacenaje' },
];

const TIPO_HIJO = {
  zona: 'pasillo',
  pasillo: 'estante',
  estante: 'bin',
  bin: null,
};

const DEFAULT_VALUES = {
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: DEFAULT_VALUES,
  });

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
      const nuevoTipo = TIPO_HIJO[parent.tipo] || 'bin';
      const prefijoCodigo = parent.codigo ? `${parent.codigo}-` : '';
      reset({ ...DEFAULT_VALUES, codigo: prefijoCodigo, tipo: nuevoTipo });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isEditing, ubicacion, parent, reset]);

  const onSubmit = async (data) => {
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

  const footerContent = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" onClick={onClose} type="button">
        Cancelar
      </Button>
      <Button
        variant="primary"
        type="submit"
        form="ubicacion-form"
        isLoading={isSubmitting || crearMutation.isPending || actualizarMutation.isPending}
      >
        {isEditing ? 'Guardar Cambios' : 'Crear Ubicación'}
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ubicación' : parent ? `Nueva Sub-ubicación de ${parent.codigo}` : 'Nueva Ubicación'}
      size="lg"
      footer={footerContent}
    >
      <form id="ubicacion-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
            Información Básica
          </h3>

          <FormGroup label="Código" required error={errors.codigo?.message}>
            <Input
              {...register('codigo')}
              placeholder="Ej: A-01-03-02"
              hasError={!!errors.codigo}
            />
          </FormGroup>

          <FormGroup label="Nombre" error={errors.nombre?.message}>
            <Input
              {...register('nombre')}
              placeholder="Nombre descriptivo (opcional)"
              hasError={!!errors.nombre}
            />
          </FormGroup>

          <FormGroup label="Tipo" required error={errors.tipo?.message}>
            <Select
              {...register('tipo')}
              options={TIPOS_UBICACION}
              disabled={!!parent}
              hasError={!!errors.tipo}
            />
          </FormGroup>

          <FormGroup label="Descripción" error={errors.descripcion?.message}>
            <Textarea
              {...register('descripcion')}
              rows={2}
              placeholder="Descripción opcional"
              hasError={!!errors.descripcion}
            />
          </FormGroup>
        </section>

        {/* Capacidad */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
            Capacidad
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormGroup label="Capacidad Máx (unidades)">
              <Input type="number" {...register('capacidad_maxima')} min="0" />
            </FormGroup>
            <FormGroup label="Peso Máx (kg)">
              <Input type="number" step="0.01" {...register('peso_maximo_kg')} min="0" />
            </FormGroup>
            <FormGroup label="Volumen (m³)">
              <Input type="number" step="0.01" {...register('volumen_m3')} min="0" />
            </FormGroup>
          </div>
        </section>

        {/* Características */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
            Características
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <CheckboxField label="Es Picking" {...register('es_picking')} />
            <CheckboxField label="Es Recepción" {...register('es_recepcion')} />
            <CheckboxField label="Es Despacho" {...register('es_despacho')} />
            <CheckboxField label="Es Cuarentena" {...register('es_cuarentena')} />
            <CheckboxField label="Es Devolución" {...register('es_devolucion')} />
            <CheckboxField label="Humedad Controlada" {...register('humedad_controlada')} />
          </div>
        </section>

        {/* Control de Temperatura */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
            Control de Temperatura
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Temperatura Mín (°C)">
              <Input type="number" step="0.1" {...register('temperatura_min')} />
            </FormGroup>
            <FormGroup label="Temperatura Máx (°C)">
              <Input type="number" step="0.1" {...register('temperatura_max')} />
            </FormGroup>
          </div>
        </section>

        {/* Apariencia */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
            Apariencia
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Color">
              <Input type="color" {...register('color')} className="h-10" />
            </FormGroup>
            <FormGroup label="Orden">
              <Input type="number" {...register('orden')} min="0" />
            </FormGroup>
          </div>

          <CheckboxField label="Ubicación activa" {...register('activo')} />
        </section>
      </form>
    </Drawer>
  );
}

export default UbicacionFormDrawer;
