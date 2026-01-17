import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Users,
  Package,
  Loader2,
  Star,
  Percent,
  ChevronRight,
  AlertCircle,
  Search,
  UserPlus,
  X,
  DollarSign,
} from 'lucide-react';

import {
  Button,
  ConfirmDialog,
  Drawer,
  Input,
  Modal,
  Select
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import { listasPreciosApi, monedasApi, clientesApi, inventarioApi } from '@/services/api/endpoints';
import { useCurrency } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';

/**
 * Página de Gestión de Listas de Precios
 * Fase 5 - Diciembre 2025
 */
function ListasPreciosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal manager para form, items, clientes y delete
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    items: { isOpen: false, data: null },
    clientes: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Query: Listar listas de precios
  const { data: listas = [], isLoading: loadingListas } = useQuery({
    queryKey: ['listas-precios'],
    queryFn: async () => {
      const response = await listasPreciosApi.listar({ soloActivas: false });
      return response.data.data || [];
    },
  });

  // Query: Listar monedas
  const { data: monedas = [] } = useQuery({
    queryKey: ['monedas'],
    queryFn: async () => {
      const response = await monedasApi.listar(true);
      return response.data.data || [];
    },
  });

  // Mutation: Crear lista
  const crearMutation = useMutation({
    mutationFn: (data) => listasPreciosApi.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Lista de precios creada');
      closeModal('form');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al crear lista');
    },
  });

  // Mutation: Actualizar lista
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }) => listasPreciosApi.actualizar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Lista actualizada');
      closeModal('form');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al actualizar lista');
    },
  });

  // Mutation: Eliminar lista
  const eliminarMutation = useMutation({
    mutationFn: (id) => listasPreciosApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Lista eliminada');
      closeModal('delete');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error al eliminar lista');
    },
  });

  // Filtrar listas
  const listasFiltradas = listas.filter(lista =>
    lista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lista.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleNueva = () => {
    openModal('form', null);
  };

  const handleEditar = (lista) => {
    openModal('form', lista);
  };

  const handleVerItems = (lista) => {
    openModal('items', lista);
  };

  const handleVerClientes = (lista) => {
    openModal('clientes', lista);
  };

  const handleGuardar = (formData) => {
    const editingLista = getModalData('form');
    if (editingLista) {
      actualizarMutation.mutate({ id: editingLista.id, data: formData });
    } else {
      crearMutation.mutate(formData);
    }
  };

  return (
    <InventarioPageLayout
      icon={Tag}
      title="Listas de Precios"
      subtitle={`${listasFiltradas.length} lista${listasFiltradas.length !== 1 ? 's' : ''} de precios`}
      actions={
        <Button onClick={handleNueva}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva Lista
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar lista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de listas de precios */}
        {loadingListas ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : listasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {searchTerm ? 'No se encontraron listas' : 'Sin listas de precios'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm ? 'Intenta con otro término' : 'Crea tu primera lista de precios'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNueva} className="mt-4">
                <Plus className="w-4 h-4" />
                Nueva Lista
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listasFiltradas.map((lista) => (
              <ListaCard
                key={lista.id}
                lista={lista}
                onEdit={() => handleEditar(lista)}
                onDelete={() => openModal('delete', lista)}
                onVerItems={() => handleVerItems(lista)}
                onVerClientes={() => handleVerClientes(lista)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer: Formulario de Lista */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Lista' : 'Nueva Lista de Precios'}
      >
        <ListaForm
          lista={getModalData('form')}
          monedas={monedas}
          onSubmit={handleGuardar}
          onCancel={() => closeModal('form')}
          isLoading={crearMutation.isPending || actualizarMutation.isPending}
        />
      </Drawer>

      {/* Modal: Items de la lista */}
      <Modal
        isOpen={isOpen('items')}
        onClose={() => closeModal('items')}
        title={`Items: ${getModalData('items')?.nombre}`}
        size="lg"
      >
        {getModalData('items') && (
          <ListaItemsView listaId={getModalData('items').id} />
        )}
      </Modal>

      {/* Modal: Clientes de la lista */}
      <Modal
        isOpen={isOpen('clientes')}
        onClose={() => closeModal('clientes')}
        title={`Clientes: ${getModalData('clientes')?.nombre}`}
        size="md"
      >
        {getModalData('clientes') && (
          <ListaClientesView listaId={getModalData('clientes').id} />
        )}
      </Modal>

      {/* Confirm: Eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={() => eliminarMutation.mutate(getModalData('delete')?.id)}
        title="Eliminar Lista"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Los clientes asignados perderán su lista especial.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </InventarioPageLayout>
  );
}

/**
 * Card de Lista de Precios
 */
function ListaCard({ lista, onEdit, onDelete, onVerItems, onVerClientes }) {
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-xl border p-4
      ${lista.activo
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-100 dark:border-gray-800 opacity-60'
      }
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {lista.es_default && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {lista.codigo}
          </span>
        </div>
        <span className={`
          text-xs px-2 py-0.5 rounded-full
          ${lista.activo
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }
        `}>
          {lista.activo ? 'Activa' : 'Inactiva'}
        </span>
      </div>

      {/* Info */}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {lista.nombre}
      </h3>
      {lista.descripcion && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {lista.descripcion}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <span className="font-medium text-primary-600 dark:text-primary-400">
            {lista.moneda}
          </span>
        </div>
        {lista.descuento_global_pct > 0 && (
          <div className="flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" />
            <span>{lista.descuento_global_pct}%</span>
          </div>
        )}
      </div>

      {/* Counters */}
      <div className="flex items-center gap-4 text-sm border-t border-gray-100 dark:border-gray-700 pt-3 mb-4">
        <button
          onClick={onVerItems}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Package className="w-4 h-4" />
          <span>{lista.total_items || 0} items</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onVerClientes}
          className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>{lista.total_clientes || 0} clientes</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1">
          <Edit2 className="w-4 h-4" />
          Editar
        </Button>
        {!lista.es_default && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Formulario de Lista de Precios
 */
function ListaForm({ lista, monedas, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    codigo: lista?.codigo || '',
    nombre: lista?.nombre || '',
    descripcion: lista?.descripcion || '',
    moneda: lista?.moneda || 'MXN',
    descuento_global_pct: lista?.descuento_global_pct || 0,
    es_default: lista?.es_default || false,
    activo: lista?.activo !== false,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo || !formData.nombre) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Código *
          </label>
          <Input
            value={formData.codigo}
            onChange={(e) => handleChange('codigo', e.target.value.toUpperCase())}
            placeholder="Ej: MAYOREO"
            maxLength={20}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Moneda
          </label>
          <select
            value={formData.moneda}
            onChange={(e) => handleChange('moneda', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          >
            {monedas.map(m => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} ({m.simbolo})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre *
        </label>
        <Input
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          placeholder="Ej: Precios Mayoreo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => handleChange('descripcion', e.target.value)}
          placeholder="Descripción opcional..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descuento Global (%)
        </label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.descuento_global_pct}
          onChange={(e) => handleChange('descuento_global_pct', parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Se aplica a todos los productos de esta lista
        </p>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.activo}
            onChange={(e) => handleChange('activo', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Activa</span>
        </label>
        {!lista?.es_default && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.es_default}
              onChange={(e) => handleChange('es_default', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Es lista por defecto</span>
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || !formData.codigo || !formData.nombre}>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {lista ? 'Guardar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Vista de Items de una Lista
 */
function ListaItemsView({ listaId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tipoAplicacion, setTipoAplicacion] = useState('producto'); // 'producto' | 'categoria' | 'global'
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje'); // 'porcentaje' | 'fijo'
  const [valorDescuento, setValorDescuento] = useState('');
  const [cantidadMinima, setCantidadMinima] = useState('1');

  // Modal para confirmación de eliminación de item
  const { openModal: openItemModal, closeModal: closeItemModal, isOpen: isItemOpen, getModalData: getItemModalData } = useModalManager({
    deleteItem: { isOpen: false, data: null },
  });

  // Query: Items de la lista
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['lista-items', listaId],
    queryFn: async () => {
      const response = await listasPreciosApi.listarItems(listaId);
      return response.data.data || [];
    },
  });

  // Query: Buscar productos
  const { data: productosEncontrados = [], isLoading: buscandoProductos } = useQuery({
    queryKey: ['productos-busqueda', busquedaProducto],
    queryFn: async () => {
      if (busquedaProducto.length < 2) return [];
      const response = await inventarioApi.buscarProductos({ q: busquedaProducto, limit: 10 });
      return response.data.data || [];
    },
    enabled: busquedaProducto.length >= 2,
  });

  // Filtrar productos que ya están en la lista
  const productosDisponibles = productosEncontrados.filter(
    (p) => !items.some((item) => item.producto_id === p.id)
  );

  // Query: Buscar categorías
  const { data: categoriasEncontradas = [], isLoading: buscandoCategorias } = useQuery({
    queryKey: ['categorias-busqueda', busquedaCategoria],
    queryFn: async () => {
      if (busquedaCategoria.length < 2) return [];
      const response = await inventarioApi.listarCategorias({ busqueda: busquedaCategoria, activo: true });
      return response.data.data?.categorias || [];
    },
    enabled: busquedaCategoria.length >= 2,
  });

  // Filtrar categorías que ya están en la lista
  const categoriasDisponibles = categoriasEncontradas.filter(
    (c) => !items.some((item) => item.categoria_id === c.id)
  );

  // Mutation: Crear item
  const crearMutation = useMutation({
    mutationFn: async (data) => {
      return await listasPreciosApi.crearItem(listaId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-items', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Item agregado a la lista');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al agregar item');
    },
  });

  // Mutation: Eliminar item
  const eliminarMutation = useMutation({
    mutationFn: async (itemId) => {
      return await listasPreciosApi.eliminarItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-items', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Item eliminado de la lista');
      closeItemModal('deleteItem');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar item');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setTipoAplicacion('producto');
    setBusquedaProducto('');
    setProductoSeleccionado(null);
    setBusquedaCategoria('');
    setCategoriaSeleccionada(null);
    setTipoDescuento('porcentaje');
    setValorDescuento('');
    setCantidadMinima('1');
  };

  const handleSubmit = () => {
    // Validar selección según tipo de aplicación
    if (tipoAplicacion === 'producto' && !productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }
    if (tipoAplicacion === 'categoria' && !categoriaSeleccionada) {
      toast.error('Selecciona una categoría');
      return;
    }
    if (!valorDescuento || parseFloat(valorDescuento) <= 0) {
      toast.error('Ingresa un valor válido');
      return;
    }

    const data = {
      cantidad_minima: parseInt(cantidadMinima) || 1,
    };

    // Asignar según tipo de aplicación
    if (tipoAplicacion === 'producto') {
      data.producto_id = productoSeleccionado.id;
    } else if (tipoAplicacion === 'categoria') {
      data.categoria_id = categoriaSeleccionada.id;
    }
    // Si es 'global', no se asigna ni producto_id ni categoria_id

    if (tipoDescuento === 'fijo') {
      data.precio_fijo = parseFloat(valorDescuento);
    } else {
      data.descuento_pct = parseFloat(valorDescuento);
    }

    crearMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} item{items.length !== 1 ? 's' : ''} configurado{items.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant={showForm ? 'ghost' : 'primary'}
          onClick={() => showForm ? resetForm() : setShowForm(true)}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cerrar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Agregar Item
            </>
          )}
        </Button>
      </div>

      {/* Formulario para agregar item */}
      {showForm && (
        <div className="border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 space-y-4">
          {/* Selector: Aplicar a */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Aplicar a
            </label>
            <Select
              value={tipoAplicacion}
              onChange={(e) => {
                setTipoAplicacion(e.target.value);
                // Limpiar selecciones previas
                setProductoSeleccionado(null);
                setCategoriaSeleccionada(null);
                setBusquedaProducto('');
                setBusquedaCategoria('');
              }}
              options={[
                { value: 'producto', label: 'Producto específico' },
                { value: 'categoria', label: 'Categoría de productos' },
                { value: 'global', label: 'Todos los productos' },
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tipoAplicacion === 'producto' && 'El precio/descuento aplica solo a este producto'}
              {tipoAplicacion === 'categoria' && 'El precio/descuento aplica a todos los productos de la categoría'}
              {tipoAplicacion === 'global' && 'El precio/descuento aplica a todos los productos sin regla específica'}
            </p>
          </div>

          {/* Buscador de producto (solo si tipo = producto) */}
          {tipoAplicacion === 'producto' && !productoSeleccionado && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar Producto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre o SKU del producto..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {buscandoProductos && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              )}

              {busquedaProducto.length >= 2 && !buscandoProductos && productosDisponibles.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No se encontraron productos disponibles
                </p>
              )}

              {productosDisponibles.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {productosDisponibles.map((producto) => (
                    <li
                      key={producto.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setBusquedaProducto('');
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {producto.nombre}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {producto.sku} | ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Producto seleccionado */}
          {tipoAplicacion === 'producto' && productoSeleccionado && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {productoSeleccionado.nombre}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  SKU: {productoSeleccionado.sku} | Precio base: ${parseFloat(productoSeleccionado.precio_venta || 0).toFixed(2)}
                </div>
              </div>
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Buscador de categoría (solo si tipo = categoria) */}
          {tipoAplicacion === 'categoria' && !categoriaSeleccionada && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar Categoría
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Nombre de la categoría..."
                  value={busquedaCategoria}
                  onChange={(e) => setBusquedaCategoria(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {buscandoCategorias && (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              )}

              {busquedaCategoria.length >= 2 && !buscandoCategorias && categoriasDisponibles.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No se encontraron categorías disponibles
                </p>
              )}

              {categoriasDisponibles.length > 0 && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {categoriasDisponibles.map((categoria) => (
                    <li
                      key={categoria.id}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        setCategoriaSeleccionada(categoria);
                        setBusquedaCategoria('');
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {categoria.nombre}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {categoria.total_productos || 0} productos
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary-600" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Categoría seleccionada */}
          {tipoAplicacion === 'categoria' && categoriaSeleccionada && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {categoriaSeleccionada.nombre}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {categoriaSeleccionada.total_productos || 0} productos en esta categoría
                </div>
              </div>
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mensaje informativo para global */}
          {tipoAplicacion === 'global' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Esta regla aplicará a todos los productos que no tengan una regla específica (producto o categoría).
              </p>
            </div>
          )}

          {/* Tipo de descuento y valor */}
          {(productoSeleccionado || categoriaSeleccionada || tipoAplicacion === 'global') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Tipo de Precio
                  </label>
                  <Select
                    value={tipoDescuento}
                    onChange={(e) => {
                      setTipoDescuento(e.target.value);
                      setValorDescuento('');
                    }}
                    options={[
                      { value: 'porcentaje', label: 'Descuento %' },
                      { value: 'fijo', label: 'Precio Fijo' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    {tipoDescuento === 'fijo' ? 'Precio ($)' : 'Descuento (%)'}
                  </label>
                  <div className="relative">
                    {tipoDescuento === 'fijo' ? (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <Input
                      type="number"
                      min="0"
                      step={tipoDescuento === 'fijo' ? '0.01' : '1'}
                      max={tipoDescuento === 'porcentaje' ? '100' : undefined}
                      placeholder={tipoDescuento === 'fijo' ? '100.00' : '15'}
                      value={valorDescuento}
                      onChange={(e) => setValorDescuento(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Cantidad Mínima (opcional)
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={cantidadMinima}
                  onChange={(e) => setCantidadMinima(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El precio especial aplica desde esta cantidad
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={crearMutation.isPending}
                >
                  {crearMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Agregar'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lista de items */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay items configurados
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Los productos usarán el descuento global de la lista
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-800">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Cant. Mín.</th>
                <th className="pb-2">Precio/Dto.</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item) => (
                <tr key={item.id} className="text-sm group">
                  <td className="py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {item.producto_nombre || item.categoria_nombre || 'Todos'}
                    </div>
                    {item.producto_sku && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.producto_sku}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {item.cantidad_minima > 1 ? `≥ ${item.cantidad_minima}` : '-'}
                  </td>
                  <td className="py-3">
                    {item.precio_fijo ? (
                      <span className="text-gray-900 dark:text-gray-100">
                        ${item.precio_fijo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    ) : item.descuento_pct ? (
                      <span className="text-green-600 dark:text-green-400">
                        -{item.descuento_pct}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => openItemModal('deleteItem', item)}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm: Eliminar item */}
      <ConfirmDialog
        isOpen={isItemOpen('deleteItem')}
        onClose={() => closeItemModal('deleteItem')}
        onConfirm={() => eliminarMutation.mutate(getItemModalData('deleteItem')?.id)}
        title="Eliminar Item"
        message={`¿Eliminar "${getItemModalData('deleteItem')?.producto_nombre || getItemModalData('deleteItem')?.categoria_nombre}" de esta lista? El producto volverá a usar el descuento global.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

/**
 * Vista de Clientes de una Lista
 */
function ListaClientesView({ listaId }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showBuscador, setShowBuscador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // Query: Clientes asignados a esta lista
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['lista-clientes', listaId],
    queryFn: async () => {
      const response = await listasPreciosApi.listarClientes(listaId);
      return response.data.data || [];
    },
  });

  // Query: Buscar clientes disponibles (sin lista o con otra lista)
  const { data: clientesBusqueda = [], isLoading: buscando } = useQuery({
    queryKey: ['clientes-busqueda', busqueda],
    queryFn: async () => {
      if (busqueda.length < 2) return [];
      const response = await clientesApi.buscar({ q: busqueda, limit: 10 });
      return response.data.data || [];
    },
    enabled: busqueda.length >= 2,
  });

  // Mutation: Asignar cliente a la lista
  const asignarMutation = useMutation({
    mutationFn: async (clienteId) => {
      return await clientesApi.actualizar(clienteId, { lista_precios_id: listaId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-clientes', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Cliente asignado a la lista');
      setBusqueda('');
      setShowBuscador(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar cliente');
    },
  });

  // Mutation: Quitar cliente de la lista
  const quitarMutation = useMutation({
    mutationFn: async (clienteId) => {
      return await clientesApi.actualizar(clienteId, { lista_precios_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lista-clientes', listaId] });
      queryClient.invalidateQueries({ queryKey: ['listas-precios'] });
      toast.success('Cliente removido de la lista');
      setRemoveConfirm(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al quitar cliente');
    },
  });

  // Filtrar clientes que ya están asignados
  const clientesDisponibles = clientesBusqueda.filter(
    c => !clientes.some(asignado => asignado.id === c.id)
  );

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} asignado{clientes.length !== 1 ? 's' : ''}
        </p>
        <Button
          size="sm"
          variant={showBuscador ? 'ghost' : 'primary'}
          onClick={() => setShowBuscador(!showBuscador)}
        >
          {showBuscador ? (
            <>
              <X className="w-4 h-4" />
              Cerrar
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Asignar Cliente
            </>
          )}
        </Button>
      </div>

      {/* Buscador de clientes */}
      {showBuscador && (
        <div className="border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {buscando && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </div>
          )}

          {busqueda.length >= 2 && !buscando && clientesDisponibles.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              No se encontraron clientes disponibles
            </p>
          )}

          {clientesDisponibles.length > 0 && (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
              {clientesDisponibles.map((cliente) => (
                <li key={cliente.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {cliente.nombre?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cliente.nombre}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cliente.telefono || cliente.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => asignarMutation.mutate(cliente.id)}
                    disabled={asignarMutation.isPending}
                  >
                    {asignarMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Lista de clientes asignados */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay clientes asignados a esta lista
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Usa el botón "Asignar Cliente" para agregar
          </p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {clientes.map((cliente) => (
              <li key={cliente.id} className="py-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {cliente.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {cliente.nombre}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {cliente.email || cliente.telefono}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setRemoveConfirm(cliente)}
                  className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Quitar de la lista"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirm: Quitar cliente */}
      <ConfirmDialog
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={() => quitarMutation.mutate(removeConfirm.id)}
        title="Quitar Cliente"
        message={`¿Quitar a "${removeConfirm?.nombre}" de esta lista de precios? El cliente pasará a usar precios estándar.`}
        confirmText="Quitar"
        variant="warning"
        isLoading={quitarMutation.isPending}
      />
    </div>
  );
}

export default ListasPreciosPage;
