import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useCrearConfiguracionComision } from '@/hooks/useComisiones';
import { useProfesionales } from '@/hooks/useProfesionales';
import { useServicios } from '@/hooks/useServicios';
import { useProductos } from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useToast } from '@/hooks/useToast';

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
  const { data: profesionales, isLoading: loadingProfesionales } = useProfesionales();
  const { data: serviciosData, isLoading: loadingServicios } = useServicios();
  const { data: productosData, isLoading: loadingProductos } = useProductos({ activo: true });
  const { data: categoriasData, isLoading: loadingCategorias } = useCategorias();

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      icon={DollarSign}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profesional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profesional <span className="text-red-500">*</span>
          </label>
          <Controller
            name="profesional_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                disabled={loadingProfesionales || !!profesionalIdPredefinido}
                className={errors.profesional_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar profesional</option>
                {profesionales && Array.isArray(profesionales) && profesionales.map((prof) => {
                  console.log('Renderizando profesional:', prof);
                  return (
                    <option key={prof.id} value={prof.id}>
                      {prof.nombre_completo || `${prof.nombre} ${prof.apellidos || ''}`.trim()}
                    </option>
                  );
                })}
              </Select>
            )}
          />
          {errors.profesional_id && (
            <p className="mt-1 text-sm text-red-600">{errors.profesional_id.message}</p>
          )}
        </div>

        {/* Selector de Servicio o Producto según aplicaA */}
        {!isProducto ? (
          /* Servicio (opcional - null = configuración global) */
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicio Específico
            </label>
            <Controller
              name="servicio_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  disabled={loadingServicios}
                  className={errors.servicio_id ? 'border-red-500' : ''}
                >
                  <option value="">Todos los servicios (global)</option>
                  {servicios?.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre}
                    </option>
                  ))}
                </Select>
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              Dejar en blanco para configuración global (aplica a todos los servicios)
            </p>
            {errors.servicio_id && (
              <p className="mt-1 text-sm text-red-600">{errors.servicio_id.message}</p>
            )}
          </div>
        ) : (
          /* Producto y Categoría para ventas POS */
          <>
            {/* Producto específico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto Específico
              </label>
              <Controller
                name="producto_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    disabled={loadingProductos}
                    className={errors.producto_id ? 'border-red-500' : ''}
                  >
                    <option value="">Sin producto específico</option>
                    {productos?.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} - ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                      </option>
                    ))}
                  </Select>
                )}
              />
              <p className="mt-1 text-sm text-gray-500">
                Configuración con máxima prioridad
              </p>
              {errors.producto_id && (
                <p className="mt-1 text-sm text-red-600">{errors.producto_id.message}</p>
              )}
            </div>

            {/* Categoría de producto (solo si no hay producto específico) */}
            {!productoId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría de Productos
                </label>
                <Controller
                  name="categoria_producto_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      disabled={loadingCategorias}
                      className={errors.categoria_producto_id ? 'border-red-500' : ''}
                    >
                      <option value="">Todas las categorías (global)</option>
                      {categorias?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Aplica a todos los productos de esta categoría
                </p>
                {errors.categoria_producto_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoria_producto_id.message}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Tipo de Comisión */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Comisión <span className="text-red-500">*</span>
          </label>
          <Controller
            name="tipo_comision"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                className={errors.tipo_comision ? 'border-red-500' : ''}
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto_fijo">Monto Fijo ($)</option>
              </Select>
            )}
          />
          {errors.tipo_comision && (
            <p className="mt-1 text-sm text-red-600">{errors.tipo_comision.message}</p>
          )}
        </div>

        {/* Valor de Comisión */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tipoComision === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'} <span className="text-red-500">*</span>
          </label>
          <Controller
            name="valor_comision"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                step={tipoComision === 'porcentaje' ? '0.01' : '0.01'}
                min="0"
                max={tipoComision === 'porcentaje' ? '100' : '100000'}
                placeholder={tipoComision === 'porcentaje' ? '15' : '500'}
                className={errors.valor_comision ? 'border-red-500' : ''}
              />
            )}
          />
          <p className="mt-1 text-sm text-gray-500">
            {tipoComision === 'porcentaje' ? 'Valor entre 0 y 100' : 'Monto en pesos'}
          </p>
          {errors.valor_comision && (
            <p className="mt-1 text-sm text-red-600">{errors.valor_comision.message}</p>
          )}
        </div>

        {/* Estado Activo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <Controller
            name="activo"
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...field}
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Configuración activa</span>
              </label>
            )}
          />
          {errors.activo && (
            <p className="mt-1 text-sm text-red-600">{errors.activo.message}</p>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas
          </label>
          <Controller
            name="notas"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                maxLength={500}
                placeholder="Notas adicionales sobre esta configuración..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.notas ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
          />
          <p className="mt-1 text-sm text-gray-500">Opcional - Máximo 500 caracteres</p>
          {errors.notas && (
            <p className="mt-1 text-sm text-red-600">{errors.notas.message}</p>
          )}
        </div>

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
    </Modal>
  );
}

export default ConfigComisionModal;
