import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Search, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useClientes } from '@/hooks/useClientes';
import { useToast } from '@/hooks/useToast';
import WalkInModal from '@/components/clientes/WalkInModal';
import ClientesList from '@/components/clientes/ClientesList';

/**
 * Página principal de gestión de clientes
 */
function ClientesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);

  const { data, isLoading } = useClientes({
    page,
    limit: 20,
    busqueda,
  });

  const handleWalkInSuccess = (cita) => {
    // Mostrar notificación de éxito
    toast.success(`Cita walk-in creada exitosamente: ${cita.codigo_cita || 'sin código'}`);
    setWalkInOpen(false);
    // Podría navegar a la vista de la cita o refrescar la lista
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver al Inicio
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tus clientes y atención walk-in
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setWalkInOpen(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Walk-in
              </Button>

              <Button onClick={() => navigate('/clientes/nuevo')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClientesList
          clientes={data?.clientes}
          pagination={data?.pagination}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={handleWalkInSuccess}
      />
    </div>
  );
}

export default ClientesPage;
