import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import ClienteCard from './ClienteCard';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';

/**
 * Componente de grid de tarjetas de clientes
 * Vista alternativa a la tabla
 * @param {boolean} showPagination - Mostrar paginación (default: true)
 */
function ClientesCardsGrid({ clientes, pagination, isLoading, onPageChange, onNuevoCliente, showPagination = true }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!clientes || clientes.length === 0) {
    return (
      <EmptyState
        icon={UserCircle}
        title="No hay clientes registrados"
        description="Comienza agregando tu primer cliente o atiende un cliente walk-in"
        actionLabel="Agregar Cliente"
        onAction={onNuevoCliente || (() => navigate('/clientes/nuevo'))}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clientes.map((cliente) => (
          <ClienteCard key={cliente.id} cliente={cliente} />
        ))}
      </div>

      {/* Paginación */}
      {showPagination && pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          showInfo={true}
        />
      )}
    </div>
  );
}

export default ClientesCardsGrid;
