import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Package, DollarSign, TrendingUp, Tag, Barcode, ImageIcon, X, Upload, Loader2, Globe, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import { useCrearProducto, useActualizarProducto } from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useProveedores } from '@/hooks/useProveedores';
import { useToast } from '@/hooks/useToast';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useCurrency } from '@/hooks/useCurrency';
import { monedasApi, inventarioApi } from '@/services/api/endpoints';

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

    // Precios (Dic 2025: precio_mayoreo eliminado, usar listas_precios)
    precio_compra: z.coerce.number().min(0, 'El precio de compra no puede ser negativo').optional(),
    precio_venta: z.coerce.number().min(0.01, 'El precio de venta debe ser mayor a 0'),

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
    // Dic 2025: precio_mayoreo eliminado, usar listas_precios
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
  const { code: monedaOrg, symbol: simboloOrg } = useCurrency();

  // Estado para imagen
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenUrl, setImagenUrl] = useState(null);

  // Estado para precios multi-moneda
  const [preciosMoneda, setPreciosMoneda] = useState([]);
  const [mostrarPreciosMoneda, setMostrarPreciosMoneda] = useState(false);

  // Query para obtener monedas disponibles
  const { data: monedasResponse } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => monedasApi.listar(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
  // monedasResponse.data contiene { success, data: [...monedas] }
  const todasLasMonedas = monedasResponse?.data?.data || [];
  const monedasDisponibles = todasLasMonedas.filter(m => m.codigo !== monedaOrg);

  // Query para obtener producto completo con precios_moneda al editar
  const { data: productoCompleto, isLoading: cargandoProducto } = useQuery({
    queryKey: ['producto', producto?.id],
    queryFn: () => inventarioApi.obtenerProducto(producto.id),
    enabled: mode === 'edit' && !!producto?.id,
    staleTime: 0, // Siempre refetch al abrir modal
  });

  // Hook para subir archivos
  const uploadMutation = useUploadArchivo();

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
      // Cargar imagen existente
      if (producto.imagen_url) {
        setImagenUrl(producto.imagen_url);
        setImagenPreview(producto.imagen_url);
      } else {
        setImagenUrl(null);
        setImagenPreview(null);
      }
      setImagenFile(null);
      // Los precios multi-moneda se cargan en un useEffect separado (productoCompleto)
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
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
      // Limpiar imagen
      setImagenFile(null);
      setImagenPreview(null);
      setImagenUrl(null);
      // Limpiar precios multi-moneda
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
    }
  }, [esEdicion, producto, reset]);

  // Cargar precios multi-moneda cuando productoCompleto está listo (al editar)
  useEffect(() => {
    // Estructura: productoCompleto.data = respuesta axios, .data = objeto JSON con success/data
    const preciosData = productoCompleto?.data?.data?.precios_moneda;
    if (esEdicion && preciosData && preciosData.length > 0) {
      setPreciosMoneda(preciosData.map(p => ({
        moneda: p.moneda,
        precio_compra: p.precio_compra || '',
        precio_venta: p.precio_venta || ''
      })));
      setMostrarPreciosMoneda(true);
    }
  }, [esEdicion, productoCompleto]);

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

  // Handler para seleccionar imagen
  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('La imagen no debe superar 5MB');
        return;
      }
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  // Handler para eliminar imagen
  const handleEliminarImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    setImagenUrl(null);
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      let urlImagenFinal = imagenUrl;

      // Si hay un nuevo archivo de imagen, subirlo primero
      if (imagenFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: imagenFile,
          folder: 'productos',
          isPublic: true,
        });
        urlImagenFinal = resultado?.url || resultado;
      }

      // Sanitizar datos
      const datosSanitizados = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Agregar URL de imagen
      if (urlImagenFinal) {
        datosSanitizados.imagen_url = urlImagenFinal;
      } else if (imagenUrl === null && producto?.imagen_url) {
        // Si se eliminó la imagen, enviar null
        datosSanitizados.imagen_url = null;
      }

      // Convertir IDs a números
      if (datosSanitizados.categoria_id) {
        datosSanitizados.categoria_id = parseInt(datosSanitizados.categoria_id);
      }
      if (datosSanitizados.proveedor_id) {
        datosSanitizados.proveedor_id = parseInt(datosSanitizados.proveedor_id);
      }

      // Agregar precios multi-moneda si existen
      if (preciosMoneda.length > 0) {
        const preciosValidos = preciosMoneda
          .filter(p => p.moneda && p.precio_venta)
          .map(p => ({
            moneda: p.moneda,
            precio_compra: p.precio_compra ? parseFloat(p.precio_compra) : null,
            precio_venta: parseFloat(p.precio_venta)
          }));

        if (preciosValidos.length > 0) {
          datosSanitizados.precios_moneda = preciosValidos;
        }
      }

      if (mode === 'create') {
        crearMutation.mutate(datosSanitizados);
      } else {
        actualizarMutation.mutate({ id: producto.id, data: datosSanitizados });
      }
    } catch (error) {
      showError('Error al subir la imagen');
      console.error('Error subiendo imagen:', error);
    }
  };

  // Handlers para precios multi-moneda
  const agregarPrecioMoneda = () => {
    // Encontrar primera moneda no usada
    const monedasUsadas = preciosMoneda.map(p => p.moneda);
    const monedaDisponible = monedasDisponibles.find(m => !monedasUsadas.includes(m.codigo));

    if (monedaDisponible) {
      setPreciosMoneda([...preciosMoneda, {
        moneda: monedaDisponible.codigo,
        precio_compra: '',
        precio_venta: ''
      }]);
    }
  };

  const eliminarPrecioMoneda = (index) => {
    setPreciosMoneda(preciosMoneda.filter((_, i) => i !== index));
  };

  const actualizarPrecioMoneda = (index, campo, valor) => {
    const nuevosPrecios = [...preciosMoneda];
    nuevosPrecios[index][campo] = valor;
    setPreciosMoneda(nuevosPrecios);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
      subtitle={mode === 'create' ? 'Completa la información del producto' : 'Modifica los datos del producto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Package className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
            Información Básica
          </h3>

          <Input
            label="Nombre del Producto"
            {...register('nombre')}
            placeholder="Ej: Champú Premium 500ml"
            error={errors.nombre?.message}
            required
          />

          <Textarea
            label="Descripción"
            {...register('descripcion')}
            rows={3}
            placeholder="Descripción detallada del producto"
            error={errors.descripcion?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU"
              {...register('sku')}
              placeholder="Ej: CHAMP-500"
              error={errors.sku?.message}
            />

            <Input
              label="Código de Barras"
              {...register('codigo_barras')}
              placeholder="EAN8 o EAN13 (8-13 dígitos)"
              error={errors.codigo_barras?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Categoría"
              {...register('categoria_id')}
              placeholder="Sin categoría"
              options={categorias.map((categoria) => ({
                value: categoria.id.toString(),
                label: categoria.nombre,
              }))}
              error={errors.categoria_id?.message}
            />

            <Select
              label="Proveedor"
              {...register('proveedor_id')}
              placeholder="Sin proveedor"
              options={proveedores.map((proveedor) => ({
                value: proveedor.id.toString(),
                label: proveedor.nombre,
              }))}
              error={errors.proveedor_id?.message}
            />
          </div>
        </div>

        {/* Imagen del Producto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-pink-600 dark:text-pink-400" />
            Imagen del Producto
          </h3>

          <div className="flex items-start space-x-4">
            {/* Preview de imagen */}
            <div className="flex-shrink-0">
              {imagenPreview ? (
                <div className="relative">
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleEliminarImagen}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>

            {/* Input de archivo */}
            <div className="flex-1">
              <label className="block">
                <span className="sr-only">Seleccionar imagen</span>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 dark:file:bg-primary-900/40 file:text-primary-700 dark:file:text-primary-300
                      hover:file:bg-primary-100 dark:hover:file:bg-primary-900/60
                      cursor-pointer"
                    disabled={uploadMutation.isPending}
                  />
                  {uploadMutation.isPending && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-lg">
                      <Loader2 className="h-5 w-5 text-primary-600 dark:text-primary-400 animate-spin" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Subiendo...</span>
                    </div>
                  )}
                </div>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG o WEBP. Máximo 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Precios */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Precios
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              label="Precio de Compra"
              {...register('precio_compra')}
              step="0.01"
              placeholder="0.00"
              prefix="$"
              error={errors.precio_compra?.message}
            />

            <Input
              type="number"
              label="Precio de Venta"
              {...register('precio_venta')}
              step="0.01"
              placeholder="0.00"
              prefix="$"
              error={errors.precio_venta?.message}
              required
            />
          </div>

          {/* Precios en otras monedas - Colapsable */}
          {monedasDisponibles.length > 0 && (
            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarPreciosMoneda(!mostrarPreciosMoneda)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                  Precios en otras monedas
                  {preciosMoneda.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                      {preciosMoneda.length}
                    </span>
                  )}
                </span>
                {mostrarPreciosMoneda ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {mostrarPreciosMoneda && (
                <div className="p-4 space-y-4">
                  {preciosMoneda.map((precio, index) => {
                    const monedaInfo = monedasDisponibles.find(m => m.codigo === precio.moneda);
                    const monedasUsadas = preciosMoneda.map(p => p.moneda);
                    const opcionesMoneda = monedasDisponibles.filter(
                      m => m.codigo === precio.moneda || !monedasUsadas.includes(m.codigo)
                    );

                    return (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Select
                            value={precio.moneda}
                            onChange={(e) => actualizarPrecioMoneda(index, 'moneda', e.target.value)}
                            options={opcionesMoneda.map(m => ({
                              value: m.codigo,
                              label: `${m.codigo} - ${m.nombre}`
                            }))}
                            className="w-48"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarPrecioMoneda(index)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label="P. Compra"
                            value={precio.precio_compra}
                            onChange={(e) => actualizarPrecioMoneda(index, 'precio_compra', e.target.value)}
                            step="0.01"
                            placeholder="0.00"
                            prefix={monedaInfo?.simbolo || '$'}
                          />
                          <Input
                            type="number"
                            label="P. Venta"
                            value={precio.precio_venta}
                            onChange={(e) => actualizarPrecioMoneda(index, 'precio_venta', e.target.value)}
                            step="0.01"
                            placeholder="0.00"
                            prefix={monedaInfo?.simbolo || '$'}
                            required
                          />
                        </div>
                      </div>
                    );
                  })}

                  {preciosMoneda.length < monedasDisponibles.length && (
                    <button
                      type="button"
                      onClick={agregarPrecioMoneda}
                      className="flex items-center justify-center w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-dashed border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar precio en otra moneda
                    </button>
                  )}

                  {preciosMoneda.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No hay precios en otras monedas configurados.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inventario (Solo en crear) */}
        {mode === 'create' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
              Inventario
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                type="number"
                label="Stock Actual"
                {...register('stock_actual')}
                placeholder="0"
                error={errors.stock_actual?.message}
              />

              <Input
                type="number"
                label="Stock Mínimo"
                {...register('stock_minimo')}
                placeholder="5"
                error={errors.stock_minimo?.message}
              />

              <Input
                type="number"
                label="Stock Máximo"
                {...register('stock_maximo')}
                placeholder="100"
                error={errors.stock_maximo?.message}
              />

              <Select
                label="Unidad de Medida"
                {...register('unidad_medida')}
                options={[
                  { value: 'unidad', label: 'Unidad' },
                  { value: 'caja', label: 'Caja' },
                  { value: 'paquete', label: 'Paquete' },
                  { value: 'pieza', label: 'Pieza' },
                  { value: 'litro', label: 'Litro' },
                  { value: 'kilogramo', label: 'Kilogramo' },
                  { value: 'metro', label: 'Metro' },
                ]}
                error={errors.unidad_medida?.message}
              />
            </div>
          </div>
        )}

        {/* Configuración */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Tag className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            Configuración
          </h3>

          <div className="space-y-3">
            <Checkbox
              label="Alertar cuando llegue al stock mínimo"
              {...register('alerta_stock_minimo')}
            />

            <Checkbox
              label="Es perecedero"
              {...register('es_perecedero')}
            />

            {esPerecedero && (
              <Input
                type="number"
                label="Días de Vida Útil"
                {...register('dias_vida_util')}
                placeholder="Ej: 30"
                error={errors.dias_vida_util?.message}
              />
            )}

            <Checkbox
              label="Permitir venta directa en POS"
              {...register('permite_venta')}
            />

            <Checkbox
              label="Permitir uso en servicios"
              {...register('permite_uso_servicio')}
            />

            <Checkbox
              label="Producto activo"
              {...register('activo')}
            />
          </div>

          <Textarea
            label="Notas"
            {...register('notas')}
            rows={3}
            placeholder="Notas adicionales sobre el producto"
            error={errors.notas?.message}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={crearMutation.isPending || actualizarMutation.isPending || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Subiendo imagen...' : mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ProductoFormModal;
