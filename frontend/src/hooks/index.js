/**
 * Hooks - Re-exports centralizados
 *
 * Organización por dominio:
 * - inventario/  - Gestión de productos, stock, órdenes de compra
 * - almacen/     - Operaciones de almacén, picking, despacho
 * - pos/         - Punto de venta, cupones, promociones
 * - agendamiento/- Citas, horarios, servicios
 * - personas/    - Clientes, profesionales, empleados, RRHH
 * - sistema/     - Auth, permisos, configuración, workflows
 * - utils/       - Utilidades genéricas, filtros, UI helpers
 * - otros/       - Módulos específicos (contabilidad, website, etc.)
 *
 * Uso:
 *   import { useCitas, useClientes } from '@/hooks';
 *   // o importar de subcarpeta específica:
 *   import { useCitas } from '@/hooks/agendamiento';
 */

// Inventario
export * from './inventario';

// Almacén
export * from './almacen';

// POS
export * from './pos';

// Agendamiento
export * from './agendamiento';

// Personas
export * from './personas';

// Sistema
export * from './sistema';

// Utilidades
export * from './utils';

// Otros módulos
export * from './otros';
