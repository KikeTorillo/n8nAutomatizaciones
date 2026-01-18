/**
 * Configuración de columnas para tabla de Productos
 * Ene 2026 - Migración a ListadoCRUDPage
 */

import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui';

/**
 * Helpers para determinar estado de stock
 */
export const getStockVariant = (producto) => {
  if (producto.stock_actual === 0) return 'error';
  if (producto.stock_actual <= producto.stock_minimo) return 'warning';
  if (producto.stock_actual >= producto.stock_maximo) return 'primary';
  return 'success';
};

export const getStockLabel = (producto) => {
  if (producto.stock_actual === 0) return 'Agotado';
  if (producto.stock_actual <= producto.stock_minimo) return 'Stock bajo';
  if (producto.stock_actual >= producto.stock_maximo) return 'Stock alto';
  return 'Normal';
};

/**
 * Factory para crear columnas con categorías y proveedores
 */
export const createProductosColumns = ({ categorias = [], proveedores = [] }) => {
  const obtenerNombreCategoria = (categoriaId) => {
    const categoria = categorias.find((c) => c.id === categoriaId);
    return categoria?.nombre || 'Sin categoría';
  };

  const obtenerNombreProveedor = (proveedorId) => {
    const proveedor = proveedores.find((p) => p.id === proveedorId);
    return proveedor?.nombre || 'Sin proveedor';
  };

  return [
    {
      key: 'nombre',
      header: 'Producto',
      width: 'xl',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-10 w-10">
            {row.imagen_url ? (
              <img
                src={row.imagen_url}
                alt={row.nombre}
                className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {row.nombre}
            </div>
            {row.descripcion && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {row.descripcion}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU / Código',
      hideOnMobile: true,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{row.sku || '-'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.codigo_barras || '-'}</div>
        </div>
      ),
    },
    {
      key: 'categoria_id',
      header: 'Categoría',
      hideOnMobile: true,
      render: (row) => obtenerNombreCategoria(row.categoria_id),
    },
    {
      key: 'proveedor_id',
      header: 'Proveedor',
      hideOnMobile: true,
      render: (row) => obtenerNombreProveedor(row.proveedor_id),
    },
    {
      key: 'stock_actual',
      header: 'Stock',
      align: 'right',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {row.stock_actual} {row.unidad_medida || 'unid'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Min: {row.stock_minimo} | Max: {row.stock_maximo}
          </div>
        </div>
      ),
    },
    {
      key: 'precio_venta',
      header: 'Precio',
      align: 'right',
      hideOnMobile: true,
      render: (row) => `$${parseFloat(row.precio_venta || 0).toFixed(2)}`,
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'center',
      render: (row) => (
        <Badge variant={getStockVariant(row)} size="sm">
          {getStockLabel(row)}
        </Badge>
      ),
    },
  ];
};

/**
 * Filtros iniciales para productos
 */
export const PRODUCTOS_INITIAL_FILTERS = {
  busqueda: '',
  categoria_id: '',
  proveedor_id: '',
  activo: true,
  stock_bajo: false,
  stock_agotado: false,
};

/**
 * Factory para crear configuración de filtros
 */
export const createFilterConfig = ({ categorias = [], proveedores = [] }) => [
  {
    id: 'stock',
    label: 'Estado de Stock',
    type: 'checkbox-group',
    options: [
      { field: 'stock_bajo', label: 'Stock bajo' },
      { field: 'stock_agotado', label: 'Agotados' },
    ],
  },
  {
    id: 'categoria_id',
    label: 'Categoría',
    type: 'select',
    placeholder: 'Todas las categorías',
    options: categorias.map((c) => ({ value: c.id, label: c.nombre })),
  },
  {
    id: 'proveedor_id',
    label: 'Proveedor',
    type: 'select',
    placeholder: 'Todos los proveedores',
    options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
  },
];

/**
 * Columnas para exportación CSV
 */
export const PRODUCTOS_CSV_COLUMNS = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'sku', header: 'SKU' },
  { key: 'codigo_barras', header: 'Código Barras' },
  { key: 'categoria', header: 'Categoría' },
  { key: 'proveedor', header: 'Proveedor' },
  { key: 'stock', header: 'Stock' },
  { key: 'stock_minimo', header: 'Mínimo' },
  { key: 'stock_maximo', header: 'Máximo' },
  { key: 'precio_compra', header: 'Precio Compra' },
  { key: 'precio_venta', header: 'Precio Venta' },
  { key: 'estado', header: 'Estado' },
];

/**
 * Mapear producto a fila CSV
 */
export const mapProductoToCSV = (producto) => ({
  nombre: producto.nombre || '',
  sku: producto.sku || '',
  codigo_barras: producto.codigo_barras || '',
  categoria: producto.categoria_nombre || 'Sin categoría',
  proveedor: producto.proveedor_nombre || 'Sin proveedor',
  stock: producto.stock_actual || 0,
  stock_minimo: producto.stock_minimo || 0,
  stock_maximo: producto.stock_maximo || 0,
  precio_compra: parseFloat(producto.precio_compra || 0).toFixed(2),
  precio_venta: parseFloat(producto.precio_venta || 0).toFixed(2),
  estado: getStockLabel(producto),
});
