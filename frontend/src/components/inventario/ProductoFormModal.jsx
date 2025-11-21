import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, DollarSign, TrendingUp, Tag, Barcode } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import FieldWrapper from '@/components/forms/FieldWrapper';
import { useCrearProducto, useActualizarProducto } from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useProveedores } from '@/hooks/useProveedores';
import { useToast } from '@/hooks/useToast';

/**
 * Schema de validación Zod para CREAR producto - COMPLETO
 */
const productoCreateSchema = z
  .object({
    // Información Básica
    nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
    descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    sku: z.string().max(50, 'Máximo 50 caracteres').optional(),
    codigo_barras: z
      .string()
      .regex(/^([0-9]{8,13})?$/, 'Debe ser un código EAN8 o EAN13 (8-13 dígitos), o dejar vacío')
      .optional(),
    categoria_id: z.string().optional(),
    proveedor_id: z.string().optional(),

    // Precios
    precio_compra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional(),
    precio_venta: z.coerce.number().min(0.01, 'El precio de venta debe ser mayor a 0'),
    precio_mayoreo: z.preprocess(
      (val) => (val === 0 || val === '0' || val === '') ? undefined : val,
      z.coerce.number().min(0, 'El precio de mayoreo no puede ser negativo').optional()
    ),
    cantidad_mayoreo: z.preprocess(
      (val) => (val === 0 || val === '0' || val === '') ? undefined : val,
      z.coerce.number().min(1, 'La cantidad mínima debe ser al menos 1').optional()
    ),

    // Inventario
    stock_actual: z.coerce.number().min(0, 'El stock actual no puede ser negativo').default(10),
    stock_minimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(5),
    stock_maximo: z.coerce.number().min(1, 'El stock máximo debe ser al menos 1').default(100),
    unidad_medida: z.string().max(20, 'Máximo 20 caracteres').default('unidad'),

    // Configuración
    alerta_stock_minimo: z.boolean().default(true),
    es_perecedero: z.boolean().default(false),
    dias_vida_util: z.preprocess(
      (val) => (val === 0 || val === '0' || val === '') ? undefined : val,
      z.coerce.number().min(1, 'Mínimo 1 día').optional()
    ),
    permite_venta: z.boolean().default(true),
    permite_uso_servicio: z.boolean().default(true),
    activo: z.boolean().default(true),
    notas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  })
  .refine(
    (data) => {
      // Si precio_mayoreo existe, cantidad_mayoreo debe existir
      if (data.precio_mayoreo && data.precio_mayoreo > 0 && !data.cantidad_mayoreo) {
        return false;
      }
      return true;
    },
    {
      message: 'Si defines precio de mayoreo, debes especificar la cantidad mínima',
      path: ['cantidad_mayoreo'],
    }
  )
  .refine(
    (data) => {
      // stock_maximo debe ser mayor que stock_minimo
      return data.stock_maximo > data.stock_minimo;
    },
    {
      message: 'El stock máximo debe ser mayor al stock mínimo',
      path: ['stock_maximo'],
    }
  )
  .refine(
    (data) => {
      // Si es_perecedero, dias_vida_util debe existir
      if (data.es_perecedero && !data.dias_vida_util) {
        return false;
      }
      return true;
    },
    {
      message: 'Si el producto es perecedero, debes especificar los días de vida útil',
      path: ['dias_vida_util'],
    }
  )
  .refine(
    (data) => {
      // precio_mayoreo debe ser menor que precio_venta
      if (data.precio_mayoreo && data.precio_mayoreo >= data.precio_venta) {
        return false;
      }
      return true;
    },
    {
      message: 'El precio de mayoreo debe ser menor al precio de venta',
      path: ['precio_mayoreo'],
    }
  );

/**
 * Schema de validación Zod para EDITAR producto
 */
const productoEditSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres').optional(),
    descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    sku: z.string().max(50, 'Máximo 50 caracteres').optional(),
    codigo_barras: z.string().optional(),
    categoria_id: z.string().optional(),
    proveedor_id: z.string().optional(),
    precio_compra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional(),
    precio_venta: z.coerce.number().min(0.01, 'El precio de venta debe ser mayor a 0').optional(),
    precio_mayoreo: z.coerce.number().min(0, 'El precio de mayoreo no puede ser negativo').optional(),
    cantidad_mayoreo: z.coerce.number().min(0).optional(),
    stock_minimo: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').optional(),
    stock_maximo: z.coerce.number().min(1, 'El stock máximo debe ser al menos 1').optional(),
    unidad_medida: z.string().max(20, 'Máximo 20 caracteres').optional(),
    alerta_stock_minimo: z.boolean().optional(),
    es_perecedero: z.boolean().optional(),
    dias_vida_util: z.coerce.number().min(1, 'Mínimo 1 día').optional(),
    permite_venta: z.boolean().optional(),
    permite_uso_servicio: z.boolean().optional(),
    notas: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
    activo: z.boolean().optional(),
  })
  .refine(
    (data) => {
      return Object.keys(data).some((key) => data[key] !== undefined && data[key] !== '');
    },
    {
      message: 'Debes modificar al menos un campo',
    }
  );

/**
 * Modal de formulario para crear y editar productos
 */
function ProductoFormModal({ isOpen, onClose, mode = 'create', producto = null }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && producto;

  // Queries
  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Mutations
  const crearMutation = useCrearProducto();
  const actualizarMutation = useActualizarProducto();

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(productoCreateSchema),
    mode: 'onSubmit', // Solo valida al hacer submit, no durante la escritura
    reValidateMode: 'onSubmit', // NO re-valida automáticamente después de errores
    shouldUnregister: false, // Mantiene los valores aunque se desmonte/re-monte
    defaultValues:
      mode === 'edit' && producto
        ? {
            nombre: producto.nombre || '',
            descripcion: producto.descripcion || '',
            sku: producto.sku || '',
            codigo_barras: producto.codigo_barras || '',
            categoria_id: producto.categoria_id?.toString() || '',
            proveedor_id: producto.proveedor_id?.toString() || '',
            precio_compra: producto.precio_compra || 0,
            precio_venta: producto.precio_venta || 0,
            precio_mayoreo: producto.precio_mayoreo || 0,
            cantidad_mayoreo: producto.cantidad_mayoreo || 0,
            stock_minimo: producto.stock_minimo || 5,
            stock_maximo: producto.stock_maximo || 100,
            unidad_medida: producto.unidad_medida || 'unidad',
            alerta_stock_minimo: producto.alerta_stock_minimo ?? true,
            es_perecedero: producto.es_perecedero || false,
            dias_vida_util: producto.dias_vida_util || '',
            permite_venta: producto.permite_venta ?? true,
            permite_uso_servicio: producto.permite_uso_servicio ?? true,
            notas: producto.notas || '',
            activo: producto.activo ?? true,
          }
        : {
            nombre: '',
            descripcion: '',
            sku: '',
            codigo_barras: '',
            categoria_id: '',
            proveedor_id: '',
            precio_compra: 0,
            precio_venta: 0,
            precio_mayoreo: 0,
            cantidad_mayoreo: 0,
            stock_actual: 10,
            stock_minimo: 5,
            stock_maximo: 100,
            unidad_medida: 'unidad',
            alerta_stock_minimo: true,
            es_perecedero: false,
            dias_vida_util: '',
            permite_venta: true,
            permite_uso_servicio: true,
            notas: '',
            activo: true,
          },
  });

  // Watch campos dinámicos
  const esPerecedero = watch('es_perecedero');
  const precioMayoreo = watch('precio_mayoreo');

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && producto) {
      reset({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        sku: producto.sku || '',
        codigo_barras: producto.codigo_barras || '',
        categoria_id: producto.categoria_id?.toString() || '',
        proveedor_id: producto.proveedor_id?.toString() || '',
        precio_compra: producto.precio_compra || 0,
        precio_venta: producto.precio_venta || 0,
        precio_mayoreo: producto.precio_mayoreo || 0,
        cantidad_mayoreo: producto.cantidad_mayoreo || 0,
        stock_minimo: producto.stock_minimo || 5,
        stock_maximo: producto.stock_maximo || 100,
        unidad_medida: producto.unidad_medida || 'unidad',
        alerta_stock_minimo: producto.alerta_stock_minimo ?? true,
        es_perecedero: producto.es_perecedero || false,
        dias_vida_util: producto.dias_vida_util || '',
        permite_venta: producto.permite_venta ?? true,
        permite_uso_servicio: producto.permite_uso_servicio ?? true,
        notas: producto.notas || '',
        activo: producto.activo ?? true,
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        sku: '',
        codigo_barras: '',
        categoria_id: '',
        proveedor_id: '',
        precio_compra: 0,
        precio_venta: 0,
        precio_mayoreo: 0,
        cantidad_mayoreo: 0,
        stock_actual: 10,
        stock_minimo: 5,
        stock_maximo: 100,
        unidad_medida: 'unidad',
        alerta_stock_minimo: true,
        es_perecedero: false,
        dias_vida_util: '',
        permite_venta: true,
        permite_uso_servicio: true,
        notas: '',
        activo: true,
      });
    }
  }, [esEdicion, producto, reset]);

  // Debug: Log when form is ready
  useEffect(() => {
    if (isOpen) {
      console.log('📝 Modal abierto, modo:', mode);
      console.log('📝 Producto:', producto);
      console.log('📝 Mutations ready:', { crear: !!crearMutation, actualizar: !!actualizarMutation });
    }
  }, [isOpen, mode, producto, crearMutation, actualizarMutation]);

  // Manejar éxito de las mutaciones
  useEffect(() => {
    if (crearMutation.isSuccess) {
      showSuccess('Producto creado correctamente');
      reset();
      onClose();
      crearMutation.reset(); // Limpiar estado de la mutación
    }
  }, [crearMutation.isSuccess, crearMutation, showSuccess, reset, onClose]);

  useEffect(() => {
    if (actualizarMutation.isSuccess) {
      showSuccess('Producto actualizado correctamente');
      onClose();
      actualizarMutation.reset(); // Limpiar estado de la mutación
    }
  }, [actualizarMutation.isSuccess, actualizarMutation, showSuccess, onClose]);

  // Manejar errores de las mutaciones
  useEffect(() => {
    if (crearMutation.isError) {
      const error = crearMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al crear producto');
      crearMutation.reset(); // Limpiar estado de error
    }
  }, [crearMutation.isError, crearMutation, showError]);

  useEffect(() => {
    if (actualizarMutation.isError) {
      const error = actualizarMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al actualizar producto');
      actualizarMutation.reset(); // Limpiar estado de error
    }
  }, [actualizarMutation.isError, actualizarMutation, showError]);

  // Submit handler
  const onSubmit = async (data) => {
    console.log('🚀 onSubmit ejecutado con data:', data);
    console.log('🚀 Errores de validación:', errors);

    // Sanitizar datos
    const datosSanitizados = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Convertir IDs a números
    if (datosSanitizados.categoria_id) {
      datosSanitizados.categoria_id = parseInt(datosSanitizados.categoria_id);
    }
    if (datosSanitizados.proveedor_id) {
      datosSanitizados.proveedor_id = parseInt(datosSanitizados.proveedor_id);
    }

    if (mode === 'create') {
      crearMutation.mutate(datosSanitizados);
    } else {
      actualizarMutation.mutate({ id: producto.id, data: datosSanitizados });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-indigo-600" />
            Información Básica
          </h3>

          <FieldWrapper label="Nombre del Producto" error={errors.nombre?.message} required>
            <input
              type="text"
              {...register('nombre')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Champú Premium 500ml"
            />
          </FieldWrapper>

          <FieldWrapper label="Descripción" error={errors.descripcion?.message}>
            <textarea
              {...register('descripcion')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Descripción detallada del producto"
            />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="SKU" error={errors.sku?.message}>
              <input
                type="text"
                {...register('sku')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ej: CHAMP-500"
              />
            </FieldWrapper>

            <FieldWrapper label="Código de Barras" error={errors.codigo_barras?.message}>
              <input
                type="text"
                {...register('codigo_barras')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="EAN8 o EAN13 (8-13 dígitos)"
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="Categoría" error={errors.categoria_id?.message}>
              <select
                {...register('categoria_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sin categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </FieldWrapper>

            <FieldWrapper label="Proveedor" error={errors.proveedor_id?.message}>
              <select
                {...register('proveedor_id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Precios
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="Precio de Compra" error={errors.precio_compra?.message}>
              <input
                type="number"
                step="0.01"
                {...register('precio_compra')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </FieldWrapper>

            <FieldWrapper label="Precio de Venta" error={errors.precio_venta?.message} required>
              <input
                type="number"
                step="0.01"
                {...register('precio_venta')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrapper label="Precio de Mayoreo" error={errors.precio_mayoreo?.message}>
              <input
                type="number"
                step="0.01"
                {...register('precio_mayoreo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </FieldWrapper>

            <FieldWrapper
              label="Cantidad Mínima Mayoreo"
              error={errors.cantidad_mayoreo?.message}
              helperText={precioMayoreo > 0 ? 'Requerido si hay precio de mayoreo' : ''}
            >
              <input
                type="number"
                {...register('cantidad_mayoreo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0"
                disabled={!precioMayoreo || precioMayoreo === 0}
              />
            </FieldWrapper>
          </div>
        </div>

        {/* Inventario (Solo en crear) */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Inventario
            </h3>

            <div className="grid grid-cols-4 gap-4">
              <FieldWrapper label="Stock Actual" error={errors.stock_actual?.message}>
                <input
                  type="number"
                  {...register('stock_actual')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                />
              </FieldWrapper>

              <FieldWrapper label="Stock Mínimo" error={errors.stock_minimo?.message}>
                <input
                  type="number"
                  {...register('stock_minimo')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="5"
                />
              </FieldWrapper>

              <FieldWrapper label="Stock Máximo" error={errors.stock_maximo?.message}>
                <input
                  type="number"
                  {...register('stock_maximo')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="100"
                />
              </FieldWrapper>

              <FieldWrapper label="Unidad de Medida" error={errors.unidad_medida?.message}>
                <select
                  {...register('unidad_medida')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                  <option value="pieza">Pieza</option>
                  <option value="litro">Litro</option>
                  <option value="kilogramo">Kilogramo</option>
                  <option value="metro">Metro</option>
                </select>
              </FieldWrapper>
            </div>
          </div>
        )}

        {/* Configuración */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-purple-600" />
            Configuración
          </h3>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('alerta_stock_minimo')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Alertar cuando llegue al stock mínimo</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('es_perecedero')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Es perecedero</span>
            </label>

            {esPerecedero && (
              <FieldWrapper label="Días de Vida Útil" error={errors.dias_vida_util?.message}>
                <input
                  type="number"
                  {...register('dias_vida_util')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: 30"
                />
              </FieldWrapper>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('permite_venta')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Permitir venta directa en POS</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('permite_uso_servicio')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Permitir uso en servicios</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('activo')}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Producto activo</span>
            </label>
          </div>

          <FieldWrapper label="Notas" error={errors.notas?.message}>
            <textarea
              {...register('notas')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Notas adicionales sobre el producto"
            />
          </FieldWrapper>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={crearMutation.isPending || actualizarMutation.isPending}
          >
            {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductoFormModal;
