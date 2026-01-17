import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Package, Plus, Trash2, AlertCircle } from 'lucide-react';

import { Button, Drawer, Input } from '@/components/ui';
import ProductoSelectorInline from '@/components/pos/ProductoSelectorInline';
import { useToast } from '@/hooks/useToast';
import { useCombo, useCrearCombo, useActualizarCombo } from '@/hooks/useCombosModificadores';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';

// Tipos de precio disponibles
const TIPOS_PRECIO = [
  { value: 'fijo', label: 'Precio fijo', description: 'Usar precio del producto padre' },
  { value: 'suma_componentes', label: 'Suma de componentes', description: 'Sumar precios de todos los componentes' },
  { value: 'descuento_porcentaje', label: 'Descuento sobre suma', description: 'Aplicar descuento a la suma de componentes' },
];

// Opciones de manejo de stock
const MANEJO_STOCK = [
  { value: 'descontar_componentes', label: 'Descontar componentes', description: 'Descontar stock de cada componente individual' },
  { value: 'descontar_combo', label: 'Descontar combo', description: 'Descontar solo stock del producto padre' },
];

/**
 * Drawer para crear/editar combos
 * Ubicado en módulo Inventario (productos compuestos / Kits)
 */
export default function ComboFormDrawer({ isOpen, onClose, combo, onSuccess }) {
  const toast = useToast();
  const crearMutation = useCrearCombo();
  const actualizarMutation = useActualizarCombo();
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  const esEdicion = !!combo;

  // Cargar detalles completos del combo al editar
  const { data: comboCompleto, isLoading: cargandoCombo } = useCombo(
    combo?.producto_id,
    { enabled: isOpen && esEdicion && !!combo?.producto_id }
  );

  // Estado para producto padre
  const [productoPadre, setProductoPadre] = useState(null);

  // Estado para componentes
  const [componentes, setComponentes] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      tipo_precio: 'suma_componentes',
      descuento_porcentaje: '10',
      manejo_stock: 'descontar_componentes',
    }
  });

  const tipoPrecio = watch('tipo_precio');

  // Inicializar en edición (usa comboCompleto que tiene los componentes)
  useEffect(() => {
    // Usar comboCompleto (de la API) si está disponible, sino usar combo pasado
    const datosCombo = comboCompleto || combo;

    if (isOpen && esEdicion && datosCombo && !cargandoCombo) {
      setProductoPadre({
        id: datosCombo.producto_id,
        nombre: datosCombo.producto_nombre,
        sku: datosCombo.producto_sku,
        precio_venta: datosCombo.producto_precio
      });
      setComponentes(
        (datosCombo.componentes || []).map(c => ({
          id: c.producto_id,
          nombre: c.nombre || c.producto_nombre,
          sku: c.sku || c.producto_sku,
          precio_venta: c.precio_unitario || c.precio,
          cantidad: c.cantidad || 1
        }))
      );
      reset({
        tipo_precio: datosCombo.tipo_precio || 'suma_componentes',
        descuento_porcentaje: datosCombo.descuento_porcentaje?.toString() || '10',
        manejo_stock: datosCombo.manejo_stock || 'descontar_componentes',
      });
    } else if (isOpen && !esEdicion) {
      setProductoPadre(null);
      setComponentes([]);
      reset({
        tipo_precio: 'suma_componentes',
        descuento_porcentaje: '10',
        manejo_stock: 'descontar_componentes',
      });
    }
  }, [isOpen, esEdicion, combo, comboCompleto, cargandoCombo, reset]);

  // Agregar componente
  const handleAgregarComponente = (producto) => {
    const productoId = Number(producto.id);
    if (componentes.find(c => Number(c.id) === productoId)) {
      toast.warning('Este producto ya está en el combo');
      return;
    }
    if (productoPadre && productoId === Number(productoPadre.id)) {
      toast.warning('No puedes agregar el producto padre como componente');
      return;
    }
    setComponentes([...componentes, { ...producto, cantidad: 1 }]);
  };

  // Actualizar cantidad de componente
  const handleCantidadChange = (productoId, cantidad) => {
    setComponentes(componentes.map(c =>
      c.id === productoId ? { ...c, cantidad: Math.max(1, parseInt(cantidad) || 1) } : c
    ));
  };

  // Eliminar componente
  const handleEliminarComponente = (productoId) => {
    setComponentes(componentes.filter(c => c.id !== productoId));
  };

  // Calcular precio del combo
  const calcularPrecio = () => {
    if (tipoPrecio === 'fijo') {
      return parseFloat(productoPadre?.precio_venta || 0);
    }
    const sumaComponentes = componentes.reduce(
      (sum, c) => sum + (parseFloat(c.precio_venta || 0) * c.cantidad),
      0
    );
    if (tipoPrecio === 'descuento_porcentaje') {
      const descuento = parseFloat(watch('descuento_porcentaje')) || 0;
      return sumaComponentes * (1 - descuento / 100);
    }
    return sumaComponentes;
  };

  const onSubmit = async (data) => {
    // Validaciones
    if (!productoPadre) {
      toast.error('Selecciona un producto para el combo');
      return;
    }
    if (componentes.length < 2) {
      toast.error('El combo debe tener al menos 2 componentes');
      return;
    }

    try {
      // Asegurar que todos los IDs sean números enteros
      const payload = {
        producto_id: parseInt(productoPadre.id, 10),
        tipo_precio: data.tipo_precio,
        descuento_porcentaje: data.tipo_precio === 'descuento_porcentaje'
          ? parseFloat(data.descuento_porcentaje) || 0
          : 0,
        manejo_stock: data.manejo_stock,
        componentes: componentes.map(c => ({
          producto_id: parseInt(c.id, 10),
          cantidad: parseInt(c.cantidad, 10) || 1
        })),
        sucursal_id: sucursalActiva?.id ? parseInt(sucursalActiva.id, 10) : undefined
      };

      if (esEdicion) {
        await actualizarMutation.mutateAsync({
          productoId: parseInt(combo.producto_id, 10),
          data: payload
        });
      } else {
        await crearMutation.mutateAsync(payload);
      }

      // Hook ya muestra toast de éxito, solo llamar callback
      onSuccess?.();
    } catch (error) {
      // Hook ya muestra toast de error, solo log para debugging
      console.error('Error al guardar combo:', error.response?.data || error);
    }
  };

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;
  const precioCalculado = calcularPrecio();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Combo' : 'Nuevo Combo'}
      size="lg"
    >
      {cargandoCombo ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando combo...</span>
        </div>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
        {/* Producto padre */}
        <ProductoSelectorInline
          label="Producto del combo"
          placeholder="Buscar producto base..."
          productoSeleccionado={productoPadre}
          onSelect={setProductoPadre}
          excludeIds={componentes.map(c => c.id)}
          required
          disabled={esEdicion}
        />

        {/* Tipo de precio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de precio
          </label>
          <div className="space-y-2">
            {TIPOS_PRECIO.map((tipo) => (
              <label
                key={tipo.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  tipoPrecio === tipo.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={tipo.value}
                  {...register('tipo_precio')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {tipo.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tipo.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Descuento (solo si tipo es descuento_porcentaje) */}
        {tipoPrecio === 'descuento_porcentaje' && (
          <Input
            label="Porcentaje de descuento"
            type="number"
            min="0"
            max="100"
            step="1"
            {...register('descuento_porcentaje')}
            suffix="%"
          />
        )}

        {/* Manejo de stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Manejo de stock
          </label>
          <select
            {...register('manejo_stock')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {MANEJO_STOCK.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>

        {/* Componentes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Componentes del combo <span className="text-red-500">*</span>
          </label>

          {/* Lista de componentes */}
          {componentes.length > 0 && (
            <div className="space-y-2 mb-3">
              {componentes.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <Package className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {comp.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${parseFloat(comp.precio_venta || 0).toFixed(2)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={comp.cantidad}
                      onChange={(e) => handleCantidadChange(comp.id, e.target.value)}
                      className="w-16 px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleEliminarComponente(comp.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Agregar componente */}
          <ProductoSelectorInline
            placeholder="Buscar producto para agregar..."
            onSelect={handleAgregarComponente}
            excludeIds={[
              ...componentes.map(c => c.id),
              productoPadre?.id
            ].filter(Boolean)}
          />

          {componentes.length < 2 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Agrega al menos 2 componentes
            </p>
          )}
        </div>

        {/* Resumen de precio */}
        {productoPadre && componentes.length > 0 && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Precio del combo
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {tipoPrecio === 'fijo' && 'Precio del producto padre'}
                  {tipoPrecio === 'suma_componentes' && 'Suma de componentes'}
                  {tipoPrecio === 'descuento_porcentaje' && `Suma con ${watch('descuento_porcentaje')}% de descuento`}
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                ${precioCalculado.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !productoPadre || componentes.length < 2}
            className="flex-1"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {esEdicion ? 'Guardar cambios' : 'Crear combo'}
          </Button>
        </div>
      </form>
      )}
    </Drawer>
  );
}
