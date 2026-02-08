import apiClient from '../../client';
import type { Producto, Categoria } from '@/types/entities';

// ========== Tipos de parámetros ==========

interface CategoriaCreateData {
  nombre: string;
  descripcion?: string;
  categoria_padre_id?: number;
  icono?: string;
  color?: string;
  orden?: number;
  activo?: boolean;
}

interface CategoriaListParams {
  activo?: boolean;
  categoria_padre_id?: number;
  busqueda?: string;
}

interface ProveedorCreateData {
  nombre: string;
  razon_social?: string;
  rfc?: string;
  telefono?: string;
  email?: string;
  sitio_web?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  pais?: string;
  dias_credito?: number;
  dias_entrega_estimados?: number;
  monto_minimo_compra?: number;
  notas?: string;
  activo?: boolean;
}

interface ProveedorListParams {
  activo?: boolean;
  busqueda?: string;
  ciudad?: string;
  rfc?: string;
  limit?: number;
  offset?: number;
}

interface ProductoCreateData {
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigo_barras?: string;
  categoria_id?: number;
  proveedor_id?: number;
  precio_compra?: number;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  unidad_medida?: string;
  alerta_stock_minimo?: boolean;
  es_perecedero?: boolean;
  dias_vida_util?: number;
  permite_venta?: boolean;
  permite_uso_servicio?: boolean;
  notas?: string;
  activo?: boolean;
}

interface ProductoListParams {
  activo?: boolean;
  categoria_id?: number;
  proveedor_id?: number;
  busqueda?: string;
  sku?: string;
  codigo_barras?: string;
  stock_bajo?: boolean;
  stock_agotado?: boolean;
  permite_venta?: boolean;
  orden_por?: string;
  orden_dir?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

interface ProductoBuscarParams {
  q: string;
  tipo_busqueda?: string;
  categoria_id?: number;
  proveedor_id?: number;
  solo_activos?: boolean;
  solo_con_stock?: boolean;
  limit?: number;
}

// ========== API ==========

export const catalogoApi = {
  // ========== Categorias de Productos ==========

  crearCategoria: (data: CategoriaCreateData) =>
    apiClient.post<Categoria>('/inventario/categorias', data),

  listarCategorias: (params: CategoriaListParams = {}) =>
    apiClient.get<{ categorias: Categoria[] }>('/inventario/categorias', { params }),

  obtenerArbolCategorias: () =>
    apiClient.get<{ arbol: Categoria[] }>('/inventario/categorias/arbol'),

  obtenerCategoria: (id: number) =>
    apiClient.get<Categoria>(`/inventario/categorias/${id}`),

  actualizarCategoria: (id: number, data: Partial<CategoriaCreateData>) =>
    apiClient.put<Categoria>(`/inventario/categorias/${id}`, data),

  eliminarCategoria: (id: number) =>
    apiClient.delete(`/inventario/categorias/${id}`),

  // ========== Proveedores ==========

  crearProveedor: (data: ProveedorCreateData) =>
    apiClient.post('/inventario/proveedores', data),

  listarProveedores: (params: ProveedorListParams = {}) =>
    apiClient.get('/inventario/proveedores', { params }),

  obtenerProveedor: (id: number) =>
    apiClient.get(`/inventario/proveedores/${id}`),

  actualizarProveedor: (id: number, data: Partial<ProveedorCreateData>) =>
    apiClient.put(`/inventario/proveedores/${id}`, data),

  eliminarProveedor: (id: number) =>
    apiClient.delete(`/inventario/proveedores/${id}`),

  // ========== Productos CRUD Basico ==========

  crearProducto: (data: ProductoCreateData) =>
    apiClient.post<Producto>('/inventario/productos', data),

  bulkCrearProductos: (data: { productos: ProductoCreateData[] }) =>
    apiClient.post<{ productos_creados: Producto[]; errores?: Array<{ index: number; error: string }> }>(
      '/inventario/productos/bulk',
      data,
    ),

  listarProductos: (params: ProductoListParams = {}) =>
    apiClient.get<{ productos: Producto[]; total: number }>('/inventario/productos', { params }),

  buscarProductos: (params: ProductoBuscarParams) =>
    apiClient.get<{ productos: Producto[] }>('/inventario/productos/buscar', { params }),

  obtenerStockCritico: () =>
    apiClient.get<{ productos: Producto[] }>('/inventario/productos/stock-critico'),

  obtenerProducto: (id: number) =>
    apiClient.get<Producto>(`/inventario/productos/${id}`),

  actualizarProducto: (id: number, data: Partial<ProductoCreateData>) =>
    apiClient.put<Producto>(`/inventario/productos/${id}`, data),

  eliminarProducto: (id: number) =>
    apiClient.delete(`/inventario/productos/${id}`),
};
