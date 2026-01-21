import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import { useCrearConfiguracionComision } from '@/hooks/otros';
import { useProfesionales } from '@/hooks/personas';
import { useServicios } from '@/hooks/agendamiento';
import { useProductos } from '@/hooks/inventario';
import { useCategorias } from '@/hooks/inventario';
import { useToast } from '@/hooks/utils';

/**
 * Schema de validación Zod para configuración de comisión
 * Soporta tanto servicios (citas) como productos (ventas POS)
 */
const configComisionSchema = z.object({
  profesional_id: z.string().min(1, 'Debes seleccionar un profesional'),

  // Para servicios
  servicio_id: z.string().optional(),

  // Para productos
  producto_id: z.string().optional(),
  categoria_producto_id: z.string().optional(),

  tipo_comision: z.enum(['porcentaje', 'monto_fijo'], {
    required_error: 'Tipo de comisión es requerido',
  }),

  valor_comision: z.union([z.number(), z.string()])
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(
      z.number()
        .min(0, 'El valor no puede ser negativo')
        .max(100000, 'Valor máximo excedido')
    ),

  activo: z.boolean().default(true),

  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
}).refine((data) => {
  // Validar que porcentaje esté entre 0-100
  if (data.tipo_comision === 'porcentaje') {
    return data.valor_comision >= 0 && data.valor_comision <= 100;
  }
  return true;
}, {
  message: 'El porcentaje debe estar entre 0 y 100',
  path: ['valor_comision'],
});

/**
 * Modal para crear/editar configuración de comisión
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {object|null} configuracion - Configuración a editar (null para crear nueva)
 * @param {number|null} profesionalIdPredefinido - ID del profesional predefinido (opcional)
 * @param {string} aplicaA - 'servicio' o 'producto' - define el tipo de configuración
 */
function ConfigComisionModal({
  isOpen,
  onClose,
  configuracion = null,
  profesionalIdPredefinido = null,
  aplicaA = 'servicio'
}) {
  const toast = useToast();
  const crearMutation = useCrearConfiguracionComision();

  // Fetch profesionales, servicios, productos y categorías
  const { data: profesionalesData, isLoading: loadingProfesionales } = useProfesionales();
  const { data: serviciosData, isLoading: loadingServicios } = useServicios();
  const { data: productosData, isLoading: loadingProductos } = useProductos({ activo: true });
  const { data: categoriasData, isLoading: loadingCategorias } = useCategorias();

  // Extraer arrays de las respuestas (hooks con transformList retornan {items, paginacion})
  const profesionales = profesionalesData?.items || profesionalesData?.profesionales || [];
  const servicios = serviciosData?.servicios || [];
  const productos = productosData?.productos || [];
  const categorias = categoriasData?.categorias || [];

  const isEditMode = !!configuracion;
  const isProducto = aplicaA === 'producto';

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(configComisionSchema),
    defaultValues: {
      profesional_id: profesionalIdPredefinido || '',
      servicio_id: '',
      producto_id: '',
      categoria_producto_id: '',
      tipo_comision: 'porcentaje',
      valor_comision: 15, // Valor por defecto 15%
      activo: true,
      notas: '',
    },
  });

  const tipoComision = watch('tipo_comision');
  const productoId = watch('producto_id');

  // Pre-cargar datos en modo edición
  useEffect(() => {
    if (isEditMode && configuracion && isOpen) {
      reset({
        profesional_id: String(configuracion.profesional_id),
        servicio_id: configuracion.servicio_id ? String(configuracion.servicio_id) : '',
        producto_id: configuracion.producto_id ? String(configuracion.producto_id) : '',
        categoria_producto_id: configuracion.categoria_producto_id ? String(configuracion.categoria_producto_id) : '',
        tipo_comision: configuracion.tipo_comision,
        valor_comision: String(parseFloat(configuracion.valor_comision)),
        activo: configuracion.activo,
        notas: configuracion.notas || '',
      });
    }
  }, [isEditMode, configuracion, isOpen, reset]);

  // Reset form al cerrar
  useEffect(() => {
    if (!isOpen) {
      reset({
        profesional_id: profesionalIdPredefinido || '',
        servicio_id: '',
        producto_id: '',
        categoria_producto_id: '',
        tipo_comision: 'porcentaje',
        valor_comision: 15, // Valor por defecto 15%
        activo: true,
        notas: '',
      });
    }
  }, [isOpen, reset, profesionalIdPredefinido]);

  // Handler de submit
  const onSubmit = async (data) => {
    try {
      // Construir payload base
      const payload = {
        profesional_id: parseInt(data.profesional_id, 10),
        aplica_a: aplicaA, // 'servicio' o 'producto'
        tipo_comision: data.tipo_comision,
        valor_comision: parseFloat(data.valor_comision),
        activo: data.activo,
        notas: data.notas?.trim() || undefined,
      };

      // Agregar campos específicos según el tipo
      if (aplicaA === 'servicio') {
        payload.servicio_id = data.servicio_id && data.servicio_id !== ''
          ? parseInt(data.servicio_id, 10)
          : undefined;
      } else {
        // Para productos
        payload.producto_id = data.producto_id && data.producto_id !== ''
          ? parseInt(data.producto_id, 10)
          : undefined;
        // Solo incluir categoría si no hay producto específico
        if (!payload.producto_id) {
          payload.categoria_producto_id = data.categoria_producto_id && data.categoria_producto_id !== ''
            ? parseInt(data.categoria_producto_id, 10)
            : undefined;
        }
      }

      await crearMutation.mutateAsync(payload);

      toast.success(
        isEditMode
          ? 'Configuración actualizada exitosamente'
          : 'Configuración creada exitosamente'
      );

      onClose();
    } catch (error) {
      const mensaje = error.response?.data?.message ||
                     error.response?.data?.error ||
                     'Error al guardar la configuración';
      toast.error(mensaje);
    }
  };

  const modalTitle = isEditMode
    ? `Editar Comisión por ${isProducto ? 'Producto' : 'Servicio'}`
    : `Nueva Comisión por ${isProducto ? 'Producto' : 'Servicio'}`;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={isEditMode ? 'Modifica la configuración de comisión' : 'Define el esquema de comisión para el profesional'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profesional */}
        <Controller
          name="profesional_id"
          control={control}
          render={({ field }) => (
            <FormGroup label="Profesional" error={errors.profesional_id?.message} required>
              <Select
                {...field}
                disabled={loadingProfesionales || !!profesionalIdPredefinido}
                placeholder="Seleccionar profesional"
                options={profesionales?.map((prof) => ({
                  value: String(prof.id),
                  label: prof.nombre_completo || `${prof.nombre} ${prof.apellidos || ''}`.trim(),
                })) || []}
                hasError={!!errors.profesional_id}
              />
            </FormGroup>
          )}
        />

        {/* Selector de Servicio o Producto según aplicaA */}
        {!isProducto ? (
          /* Servicio (opcional - null = configuración global) */
          <Controller
            name="servicio_id"
            control={control}
            render={({ field }) => (
              <FormGroup
                label="Servicio Específico"
                error={errors.servicio_id?.message}
                helper="Dejar en blanco para configuración global (aplica a todos los servicios)"
              >
                <Select
                  {...field}
                  disabled={loadingServicios}
                  placeholder="Todos los servicios (global)"
                  options={servicios?.map((servicio) => ({
                    value: String(servicio.id),
                    label: servicio.nombre,
                  })) || []}
                  hasError={!!errors.servicio_id}
                />
              </FormGroup>
            )}
          />
        ) : (
          /* Producto y Categoría para ventas POS */
          <>
            {/* Producto específico */}
            <Controller
              name="producto_id"
              control={control}
              render={({ field }) => (
                <FormGroup
                  label="Producto Específico"
                  error={errors.producto_id?.message}
                  helper="Configuración con máxima prioridad"
                >
                  <Select
                    {...field}
                    disabled={loadingProductos}
                    placeholder="Sin producto específico"
                    options={productos?.map((producto) => ({
                      value: String(producto.id),
                      label: `${producto.nombre} - $${parseFloat(producto.precio_venta || 0).toFixed(2)}`,
                    })) || []}
                    hasError={!!errors.producto_id}
                  />
                </FormGroup>
              )}
            />

            {/* Categoría de producto (solo si no hay producto específico) */}
            {!productoId && (
              <Controller
                name="categoria_producto_id"
                control={control}
                render={({ field }) => (
                  <FormGroup
                    label="Categoría de Productos"
                    error={errors.categoria_producto_id?.message}
                    helper="Aplica a todos los productos de esta categoría"
                  >
                    <Select
                      {...field}
                      disabled={loadingCategorias}
                      placeholder="Todas las categorías (global)"
                      options={categorias?.map((cat) => ({
                        value: String(cat.id),
                        label: cat.nombre,
                      })) || []}
                      hasError={!!errors.categoria_producto_id}
                    />
                  </FormGroup>
                )}
              />
            )}
          </>
        )}

        {/* Tipo de Comisión */}
        <Controller
          name="tipo_comision"
          control={control}
          render={({ field }) => (
            <FormGroup label="Tipo de Comisión" error={errors.tipo_comision?.message} required>
              <Select
                {...field}
                options={[
                  { value: 'porcentaje', label: 'Porcentaje (%)' },
                  { value: 'monto_fijo', label: 'Monto Fijo ($)' },
                ]}
                hasError={!!errors.tipo_comision}
              />
            </FormGroup>
          )}
        />

        {/* Valor de Comisión */}
        <Controller
          name="valor_comision"
          control={control}
          render={({ field }) => (
            <FormGroup
              label={tipoComision === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
              error={errors.valor_comision?.message}
              helper={tipoComision === 'porcentaje' ? 'Valor entre 0 y 100' : 'Monto en pesos'}
              required
            >
              <Input
                {...field}
                type="number"
                step="0.01"
                min="0"
                max={tipoComision === 'porcentaje' ? '100' : '100000'}
                placeholder={tipoComision === 'porcentaje' ? '15' : '500'}
                hasError={!!errors.valor_comision}
              />
            </FormGroup>
          )}
        />

        {/* Estado Activo */}
        <Controller
          name="activo"
          control={control}
          render={({ field: { value, onChange, ref, ...field } }) => (
            <Checkbox
              {...field}
              ref={ref}
              label="Configuración activa"
              description="Desactiva para pausar el cálculo de esta comisión"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              error={errors.activo?.message}
            />
          )}
        />

        {/* Notas */}
        <Controller
          name="notas"
          control={control}
          render={({ field }) => (
            <FormGroup
              label="Notas"
              error={errors.notas?.message}
              helper="Opcional - Maximo 500 caracteres"
            >
              <Textarea
                {...field}
                rows={3}
                maxLength={500}
                placeholder="Notas adicionales sobre esta configuracion..."
                hasError={!!errors.notas}
              />
            </FormGroup>
          )}
        />

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || loadingProfesionales || (isProducto ? (loadingProductos || loadingCategorias) : loadingServicios)}
          >
            {isEditMode ? 'Actualizar' : 'Crear Configuración'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ConfigComisionModal;
