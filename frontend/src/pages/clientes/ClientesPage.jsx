import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Search, ArrowLeft, UserCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useClientes } from '@/hooks/useClientes';
import { useToast } from '@/hooks/useToast';
import WalkInModal from '@/components/clientes/WalkInModal';
import ClientesList from '@/components/clientes/ClientesList';

/**
 * Página principal de gestión de clientes
 * Nov 2025: Clientes como módulo Core independiente (patrón Odoo/Salesforce)
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
    toast.success(`Cita walk-in creada exitosamente: ${cita.codigo_cita || 'sin código'}`);
    setWalkInOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 hover:text-gray-900 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        {/* Header - Mobile First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-6 w-6 sm:h-7 sm:w-7 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                Gestiona tu base de clientes y atención walk-in
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setWalkInOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Walk-in
            </Button>

            <Button onClick={() => navigate('/clientes/nuevo')} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
