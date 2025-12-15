import { useNavigate, useParams } from 'react-router-dom';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ClienteForm from '@/components/clientes/ClienteForm';
import { useCliente, useCrearCliente, useActualizarCliente } from '@/hooks/useClientes';
import { useToast } from '@/hooks/useToast';

/**
 * Página para crear o editar un cliente
 */
function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const toast = useToast();

  // Obtener cliente si estamos editando
  const { data: cliente, isLoading: loadingCliente } = useCliente(id);

  // Mutations
  const crearMutation = useCrearCliente();
  const actualizarMutation = useActualizarCliente();

  const isLoading = crearMutation.isPending || actualizarMutation.isPending;

  const handleSubmit = (data) => {
    if (isEditing) {
      // Actualizar cliente existente
      actualizarMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            toast.success('Cliente actualizado exitosamente');
            navigate(`/clientes/${id}`);
          },
          onError: (error) => {
            console.error('Error al actualizar cliente:', error);
            toast.error(
              error.response?.data?.error ||
              'Error al actualizar el cliente. Por favor intenta nuevamente.'
            );
          },
        }
      );
    } else {
      // Crear nuevo cliente
      crearMutation.mutate(data, {
        onSuccess: (nuevoCliente) => {
          toast.success('Cliente creado exitosamente');
          navigate(`/clientes/${nuevoCliente.id}`);
        },
        onError: (error) => {
          console.error('Error al crear cliente:', error);
          toast.error(
            error.response?.data?.error ||
            'Error al crear el cliente. Por favor intenta nuevamente.'
          );
        },
      });
    }
  };

  if (isEditing && loadingCliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <BackButton to="/clientes" label="Volver" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditing
                ? 'Actualiza la información del cliente'
                : 'Completa el formulario para agregar un nuevo cliente'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ClienteForm
          cliente={isEditing ? cliente : null}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default ClienteFormPage;
