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

import { memo } from 'react';
import PropTypes from 'prop-types';
import { usePermiso } from '@/hooks/sistema/useAccesoModulo';

/**
 * @param {string} codigo - Código del permiso (ej: 'agendamiento.crear_citas')
 * @param {ReactNode} children - Contenido a mostrar si tiene permiso
 * @param {ReactNode} fallback - Contenido alternativo si no tiene permiso (opcional)
 * @param {number} sucursalId - ID de sucursal específica (opcional, usa la del usuario)
 */
export const ConPermiso = memo(function ConPermiso({ codigo, children, fallback = null, sucursalId }) {
  const { tiene, isLoading } = usePermiso(codigo, sucursalId);

  // Mientras carga, no mostrar nada para evitar flash
  if (isLoading) return null;

  // Si no tiene permiso, mostrar fallback
  if (!tiene) return fallback;

  // Tiene permiso, mostrar children
  return children;
});

ConPermiso.displayName = 'ConPermiso';

ConPermiso.propTypes = {
  /** Código del permiso (ej: 'agendamiento.crear_citas') */
  codigo: PropTypes.string.isRequired,
  /** Contenido a mostrar si tiene permiso */
  children: PropTypes.node.isRequired,
  /** Contenido alternativo si no tiene permiso */
  fallback: PropTypes.node,
  /** ID de sucursal específica (opcional, usa la del usuario) */
  sucursalId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

