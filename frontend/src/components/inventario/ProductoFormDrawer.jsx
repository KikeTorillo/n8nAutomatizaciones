import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Package, DollarSign, TrendingUp, Settings } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useCrearProducto, useActualizarProducto } from '@/hooks/useProductos';
import { useCategorias } from '@/hooks/useCategorias';
import { useProveedores } from '@/hooks/useProveedores';
import { useToast } from '@/hooks/useToast';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useCurrency } from '@/hooks/useCurrency';
import { monedasApi, inventarioApi } from '@/services/api/endpoints';
import { GenerarVariantesModal } from './variantes';

// Importar schemas y tabs desde el directorio producto-form
import {
  productoCreateSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
  ProductoFormGeneralTab,
  ProductoFormPreciosTab,
  ProductoFormInventarioTab,
  ProductoFormConfigTab,
} from './producto-form';

/**
 * Modal de formulario para crear y editar productos
 * Refactorizado: Tabs extraídos a componentes separados
 */
function ProductoFormDrawer({ isOpen, onClose, mode = 'create', producto = null }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && producto;
  const { code: monedaOrg } = useCurrency();

  // Estado para imagen
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenUrl, setImagenUrl] = useState(null);

  // Estado para precios multi-moneda
  const [preciosMoneda, setPreciosMoneda] = useState([]);
  const [mostrarPreciosMoneda, setMostrarPreciosMoneda] = useState(false);

  // Estado para modal de variantes
  const [mostrarModalVariantes, setMostrarModalVariantes] = useState(false);

  // Estado para tabs del formulario
  const [activeTab, setActiveTab] = useState('general');

  // Query para obtener monedas disponibles
  const { data: monedasResponse } = useQuery({
    queryKey: ['monedas'],
    queryFn: () => monedasApi.listar(),
    staleTime: 1000 * 60 * 10, // 10 min
  });
  const todasLasMonedas = monedasResponse?.data?.data || [];
  const monedasDisponibles = todasLasMonedas.filter(m => m.codigo !== monedaOrg);

  // Query para obtener producto completo con precios_moneda al editar
  const { data: productoCompleto } = useQuery({
    queryKey: ['producto', producto?.id],
    queryFn: () => inventarioApi.obtenerProducto(producto.id),
    enabled: mode === 'edit' && !!producto?.id,
    staleTime: 0,
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
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: esEdicion ? getDefaultValuesEdit(producto) : defaultValuesCreate,
  });

  // Watch campos dinámicos
  const esPerecedero = watch('es_perecedero');
  const autoGenerarOC = watch('auto_generar_oc');
  const tieneVariantes = watch('tiene_variantes');

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && producto) {
      reset(getDefaultValuesEdit(producto));
      // Cargar imagen existente
      if (producto.imagen_url) {
        setImagenUrl(producto.imagen_url);
        setImagenPreview(producto.imagen_url);
      } else {
        setImagenUrl(null);
        setImagenPreview(null);
      }
      setImagenFile(null);
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
    } else {
      reset(defaultValuesCreate);
      setImagenFile(null);
      setImagenPreview(null);
      setImagenUrl(null);
      setPreciosMoneda([]);
      setMostrarPreciosMoneda(false);
    }
  }, [esEdicion, producto, reset]);

  // Cargar precios multi-moneda cuando productoCompleto está listo (al editar)
  useEffect(() => {
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
      crearMutation.reset();
    }
  }, [crearMutation.isSuccess, crearMutation, showSuccess, reset, onClose]);

  useEffect(() => {
    if (actualizarMutation.isSuccess) {
      showSuccess('Producto actualizado correctamente');
      onClose();
      actualizarMutation.reset();
    }
  }, [actualizarMutation.isSuccess, actualizarMutation, showSuccess, onClose]);

  // Manejar errores de las mutaciones
  useEffect(() => {
    if (crearMutation.isError) {
      const error = crearMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al crear producto');
      crearMutation.reset();
    }
  }, [crearMutation.isError, crearMutation, showError]);

  useEffect(() => {
    if (actualizarMutation.isError) {
      const error = actualizarMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al actualizar producto');
      actualizarMutation.reset();
    }
  }, [actualizarMutation.isError, actualizarMutation, showError]);

  // Handler para seleccionar imagen
  const handleImagenChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }
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

  // Configuración de tabs
  const tabs = [
    { id: 'general', label: 'General', icon: Package },
    { id: 'precios', label: 'Precios', icon: DollarSign },
    ...(mode === 'create' ? [{ id: 'inventario', label: 'Inventario', icon: TrendingUp }] : []),
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
      subtitle={mode === 'create' ? 'Completa la información del producto' : 'Modifica los datos del producto'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-4 px-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: General */}
        {activeTab === 'general' && (
          <ProductoFormGeneralTab
            register={register}
            errors={errors}
            categorias={categorias}
            proveedores={proveedores}
            imagenPreview={imagenPreview}
            uploadIsPending={uploadMutation.isPending}
            onImagenChange={handleImagenChange}
            onEliminarImagen={handleEliminarImagen}
          />
        )}

        {/* Tab: Precios */}
        {activeTab === 'precios' && (
          <ProductoFormPreciosTab
            register={register}
            errors={errors}
            preciosMoneda={preciosMoneda}
            mostrarPreciosMoneda={mostrarPreciosMoneda}
            monedasDisponibles={monedasDisponibles}
            onTogglePreciosMoneda={() => setMostrarPreciosMoneda(!mostrarPreciosMoneda)}
            onAgregarPrecioMoneda={agregarPrecioMoneda}
            onEliminarPrecioMoneda={eliminarPrecioMoneda}
            onActualizarPrecioMoneda={actualizarPrecioMoneda}
          />
        )}

        {/* Tab: Inventario (Solo en crear) */}
        {activeTab === 'inventario' && mode === 'create' && (
          <ProductoFormInventarioTab register={register} errors={errors} />
        )}

        {/* Tab: Configuración */}
        {activeTab === 'config' && (
          <ProductoFormConfigTab
            register={register}
            errors={errors}
            esPerecedero={esPerecedero}
            autoGenerarOC={autoGenerarOC}
            tieneVariantes={tieneVariantes}
            esEdicion={esEdicion}
            producto={producto}
            onMostrarModalVariantes={() => setMostrarModalVariantes(true)}
          />
        )}

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

      {/* Modal para generar variantes */}
      {esEdicion && producto && (
        <GenerarVariantesModal
          isOpen={mostrarModalVariantes}
          onClose={() => setMostrarModalVariantes(false)}
          productoId={producto.id}
          productoNombre={producto.nombre}
          productoSku={producto.sku}
        />
      )}
    </Drawer>
  );
}

export default ProductoFormDrawer;
