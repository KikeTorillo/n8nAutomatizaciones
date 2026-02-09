/**
 * ====================================================================
 * MOVIMIENTOS TABLE - Tabla de Movimientos de Crédito
 * ====================================================================
 *
 * Tabla que muestra el historial de movimientos de crédito:
 * - Cargos (ventas a crédito)
 * - Abonos (pagos del cliente)
 *
 * Enero 2026
 * ====================================================================
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { EmptyState, Button, Badge, SkeletonTable } from '@/components/ui';

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatea un monto monetario
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Tabla de movimientos de crédito
 */
const MovimientosTable = memo(function MovimientosTable({
  movimientos = [],
  paginacion,
  isLoading = false,
  onPageChange,
}) {
  // Paginación local si no viene del servidor
  const [paginaLocal, setPaginaLocal] = useState(1);
  const itemsPorPagina = 10;

  if (isLoading) {
    return <SkeletonTable rows={5} cols={5} />;
  }

  if (!movimientos || movimientos.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin movimientos"
        description="No hay movimientos de crédito registrados para este cliente."
      />
    );
  }

  // Usar paginación del servidor si está disponible
  const totalItems = paginacion?.total || movimientos.length;
  const paginaActual = paginacion?.pagina || paginaLocal;
  const totalPaginas = paginacion?.paginas || Math.ceil(movimientos.length / itemsPorPagina);

  // Si es paginación local, filtrar items
  const itemsMostrados = paginacion
    ? movimientos
    : movimientos.slice((paginaLocal - 1) * itemsPorPagina, paginaLocal * itemsPorPagina);

  const handlePreviousPage = () => {
    if (onPageChange) {
      onPageChange(paginaActual - 1);
    } else {
      setPaginaLocal((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (onPageChange) {
      onPageChange(paginaActual + 1);
    } else {
      setPaginaLocal((prev) => Math.min(totalPaginas, prev + 1));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Historial de Movimientos
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {totalItems} movimiento{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Saldo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {itemsMostrados.map((movimiento) => {
              const esCargo = movimiento.tipo === 'cargo';
              const TipoIcon = esCargo ? ArrowUpCircle : ArrowDownCircle;

              return (
                <tr
                  key={movimiento.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Fecha */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(movimiento.creado_en)}
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      variant={esCargo ? 'danger' : 'success'}
                      className="flex items-center gap-1 w-fit"
                    >
                      <TipoIcon className="w-3 h-3" />
                      {esCargo ? 'Cargo' : 'Abono'}
                    </Badge>
                  </td>

                  {/* Descripción */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                      {movimiento.descripcion || '-'}
                    </div>
                    {movimiento.venta_id && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Venta #{movimiento.venta_id}
                      </div>
                    )}
                  </td>

                  {/* Monto */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span
                      className={`font-medium ${
                        esCargo
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {esCargo ? '+' : '-'}{formatCurrency(Math.abs(movimiento.monto))}
                    </span>
                  </td>

                  {/* Saldo después */}
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(movimiento.saldo_despues)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Página {paginaActual} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={paginaActual <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={paginaActual >= totalPaginas}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

MovimientosTable.displayName = 'MovimientosTable';

MovimientosTable.propTypes = {
  movimientos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      tipo: PropTypes.oneOf(['cargo', 'abono']).isRequired,
      monto: PropTypes.number.isRequired,
      descripcion: PropTypes.string,
      saldo_despues: PropTypes.number,
      venta_id: PropTypes.number,
      creado_en: PropTypes.string,
    })
  ),
  paginacion: PropTypes.shape({
    total: PropTypes.number,
    pagina: PropTypes.number,
    paginas: PropTypes.number,
  }),
  isLoading: PropTypes.bool,
  onPageChange: PropTypes.func,
};

export default MovimientosTable;
