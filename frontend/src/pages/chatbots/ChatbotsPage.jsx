import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, MessageCircle, MessageSquare, Power, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useChatbots, useEliminarChatbot, useCambiarEstadoChatbot } from '@/hooks/useChatbots';
import { useToast } from '@/hooks/useToast';
import ConfigurarChatbotModal from '@/components/chatbots/ConfigurarChatbotModal';

/**
 * Página principal de gestión de chatbots
 * Permite crear, activar/desactivar y eliminar chatbots de IA
 */
function ChatbotsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Estados para modal de configuración
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Estados para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatbotAEliminar, setChatbotAEliminar] = useState(null);

  // Fetch chatbots
  const { data, isLoading, error } = useChatbots();

  // Mutations
  const eliminarMutation = useEliminarChatbot();
  const cambiarEstadoMutation = useCambiarEstadoChatbot();

  // Handler para crear nuevo chatbot
  const handleNuevoChatbot = () => {
    setIsConfigModalOpen(true);
  };

  // Handler para activar/desactivar chatbot
  const handleToggleEstado = async (chatbot) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: chatbot.id,
        activo: !chatbot.activo,
      });
      toast.success(
        chatbot.activo
          ? 'Chatbot desactivado exitosamente'
          : 'Chatbot activado exitosamente'
      );
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.message ||
          'Error al cambiar estado del chatbot'
      );
    }
  };

  // Handler para abrir modal de eliminación
  const handleDelete = (chatbot) => {
    setChatbotAEliminar(chatbot);
    setIsDeleteModalOpen(true);
  };

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!chatbotAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(chatbotAEliminar.id);
      toast.success('Chatbot eliminado exitosamente');
      setIsDeleteModalOpen(false);
      setChatbotAEliminar(null);
    } catch (error) {
      toast.error(
        error.response?.data?.error || error.message || 'Error al eliminar chatbot'
      );
    }
  };

  // Obtener ícono según plataforma
  const getPlatformIcon = (plataforma) => {
    switch (plataforma) {
      case 'telegram':
        return <MessageCircle className="w-6 h-6" />;
      case 'whatsapp_oficial':
        return <MessageSquare className="w-6 h-6" />;
      default:
        return <Bot className="w-6 h-6" />;
    }
  };

  // Obtener color según plataforma
  const getPlatformColor = (plataforma) => {
    switch (plataforma) {
      case 'telegram':
        return 'bg-blue-100 text-blue-600';
      case 'whatsapp_oficial':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Obtener nombre de plataforma
  const getPlatformName = (plataforma) => {
    switch (plataforma) {
      case 'telegram':
        return 'Telegram';
      case 'whatsapp_oficial':
        return 'WhatsApp Business';
      default:
        return plataforma;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inicio
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chatbots con IA</h1>
              <p className="mt-2 text-gray-600">
                Gestiona tus asistentes virtuales inteligentes para agendamiento automático
              </p>
            </div>

            <Button
              onClick={handleNuevoChatbot}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Chatbot
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Cargando chatbots..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Error al cargar chatbots: {error.message}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.chatbots?.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes chatbots configurados
            </h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer chatbot con inteligencia artificial para automatizar el agendamiento de citas.
            </p>
            <Button onClick={handleNuevoChatbot} className="inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear Primer Chatbot
            </Button>
          </div>
        )}

        {/* Lista de Chatbots */}
        {!isLoading && !error && data?.chatbots?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.chatbots.map((chatbot) => (
              <div
                key={chatbot.id}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header con ícono y nombre */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getPlatformColor(chatbot.plataforma)}`}>
                      {getPlatformIcon(chatbot.plataforma)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{chatbot.nombre}</h3>
                      <p className="text-sm text-gray-500">
                        {getPlatformName(chatbot.plataforma)}
                      </p>
                    </div>
                  </div>

                  {/* Badge de estado */}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      chatbot.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {chatbot.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Información del chatbot */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Modelo IA:</span>
                    <span className="font-medium text-gray-900">
                      {chatbot.ai_model || 'deepseek-chat'}
                    </span>
                  </div>
                  {chatbot.workflow_id && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Workflow:</span>
                      <span className="font-mono text-xs text-gray-500">
                        #{chatbot.workflow_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant={chatbot.activo ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleEstado(chatbot)}
                    className="flex-1 flex items-center justify-center gap-2"
                    disabled={cambiarEstadoMutation.isPending}
                  >
                    <Power className="w-4 h-4" />
                    {chatbot.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(chatbot)}
                    className="text-red-600 hover:bg-red-50 border-red-200"
                    disabled={eliminarMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Configuración */}
        {isConfigModalOpen && (
          <ConfigurarChatbotModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onSuccess={() => {
              setIsConfigModalOpen(false);
              toast.success('Chatbot configurado exitosamente');
            }}
          />
        )}

        {/* Modal de Confirmación de Eliminación */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setChatbotAEliminar(null);
          }}
          title="Eliminar Chatbot"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">
                  ¿Estás seguro de eliminar este chatbot?
                </p>
                <p className="text-sm text-gray-600">
                  Esta acción eliminará el chatbot "{chatbotAEliminar?.nombre}" y su workflow asociado en n8n.
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setChatbotAEliminar(null);
                }}
                disabled={eliminarMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={eliminarMutation.isPending}
                disabled={eliminarMutation.isPending}
              >
                {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar Chatbot'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default ChatbotsPage;
