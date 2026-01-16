import { z } from 'zod';

/**
 * Schema de validación Zod para CREAR producto - COMPLETO
 */
export const productoCreateSchema = z
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

    // Números de serie (Dic 2025 - Fase 3 Gaps)
    requiere_numero_serie: z.boolean().default(false),

    // Variantes de producto (Dic 2025)
    tiene_variantes: z.boolean().default(false),

    // Auto-generación OC (Dic 2025 - Fase 2 Gaps)
    auto_generar_oc: z.boolean().default(false),
    cantidad_oc_sugerida: z.coerce.number().min(1, 'Mínimo 1 unidad').default(50),

    // Dropshipping (Dic 2025 - Fase 1 Gaps)
    ruta_preferida: z.enum(['normal', 'dropship', 'fabricar']).default('normal'),
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
export const productoEditSchema = z
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
    // Números de serie (Dic 2025 - Fase 3 Gaps)
    requiere_numero_serie: z.boolean().optional(),
    // Variantes de producto (Dic 2025)
    tiene_variantes: z.boolean().optional(),
    // Auto-generación OC (Dic 2025 - Fase 2 Gaps)
    auto_generar_oc: z.boolean().optional(),
    cantidad_oc_sugerida: z.coerce.number().min(1, 'Mínimo 1 unidad').optional(),

    // Dropshipping (Dic 2025 - Fase 1 Gaps)
    ruta_preferida: z.enum(['normal', 'dropship', 'fabricar']).optional(),
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
 * Valores por defecto para crear producto
 */
export const defaultValuesCreate = {
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
  requiere_numero_serie: false,
  tiene_variantes: false,
  auto_generar_oc: false,
  cantidad_oc_sugerida: 50,
  ruta_preferida: 'normal',
};

/**
 * Genera valores por defecto para editar producto
 */
export const getDefaultValuesEdit = (producto) => ({
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
  requiere_numero_serie: producto.requiere_numero_serie || false,
  tiene_variantes: producto.tiene_variantes || false,
  auto_generar_oc: producto.auto_generar_oc || false,
  cantidad_oc_sugerida: producto.cantidad_oc_sugerida || 50,
  ruta_preferida: producto.ruta_preferida || 'normal',
});
