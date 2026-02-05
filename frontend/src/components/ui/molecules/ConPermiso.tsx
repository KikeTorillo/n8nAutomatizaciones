/**
 * ConPermiso - Wrapper para mostrar/ocultar elementos según permisos granulares
 *
 * CREADO: Ene 2026 - FIX RBAC post validación E2E
 *
 * Uso:
 * <ConPermiso codigo="agendamiento.crear_citas">
 *   <Button>Nueva Cita</Button>
 * </ConPermiso>
 *
 * Con fallback:
 * <ConPermiso codigo="pos.aplicar_descuentos" fallback={<Button disabled>Sin permiso</Button>}>
 *   <Button onClick={aplicarDescuento}>Aplicar Descuento</Button>
 * </ConPermiso>
 */

import { memo, type ReactNode } from 'react';
import { usePermiso } from '@/hooks/sistema/useAccesoModulo';

interface UsePermisoResult {
  tiene: boolean;
  valor?: unknown;
  isLoading: boolean;
  error?: Error;
  desdeCache?: boolean;
}

export interface ConPermisoProps {
  /** Código del permiso (ej: 'agendamiento.crear_citas') */
  codigo: string;
  /** Contenido a mostrar si tiene permiso */
  children: ReactNode;
  /** Contenido alternativo si no tiene permiso */
  fallback?: ReactNode;
  /** ID de sucursal específica (opcional, usa la del usuario) */
  sucursalId?: number | string;
}

/**
 * Wrapper para mostrar/ocultar elementos según permisos granulares
 */
export const ConPermiso = memo(function ConPermiso({
  codigo,
  children,
  fallback = null,
  sucursalId,
}: ConPermisoProps) {
  const { tiene, isLoading } = usePermiso(codigo, sucursalId) as UsePermisoResult;

  // Mientras carga, no mostrar nada para evitar flash
  if (isLoading) return null;

  // Si no tiene permiso, mostrar fallback
  if (!tiene) return <>{fallback}</>;

  // Tiene permiso, mostrar children
  return <>{children}</>;
});

ConPermiso.displayName = 'ConPermiso';
