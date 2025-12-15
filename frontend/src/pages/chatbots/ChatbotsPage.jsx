import { useState } from 'react';
import { Plus, Bot, MessageCircle, MessageSquare, Power, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useChatbots, useEliminarChatbot, useCambiarEstadoChatbot } from '@/hooks/useChatbots';
import { useToast } from '@/hooks/useToast';
import ConfigurarChatbotModal from '@/components/chatbots/ConfigurarChatbotModal';

/**
 * Página principal de gestión de chatbots
 * Permite crear, activar/desactivar y eliminar chatbots de IA
 */
function ChatbotsPage() {
  const toast = useToast();

  // Estados para modales
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
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

  // Handler para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!chatbotAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(chatbotAEliminar.id);
      toast.success('Chatbot eliminado exitosamente');
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
        return 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400';
      case 'whatsapp_oficial':
        return 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Chatbots con IA</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Gestiona tus asistentes virtuales inteligentes para agendamiento automático
              </p>
            </div>

            <Button
              onClick={handleNuevoChatbot}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
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
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Error al cargar chatbots: {error.message}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data?.chatbots?.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No tienes chatbots configurados
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header con ícono y nombre */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getPlatformColor(chatbot.plataforma)}`}>
                      {getPlatformIcon(chatbot.plataforma)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{chatbot.nombre}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getPlatformName(chatbot.plataforma)}
                      </p>
                    </div>
                  </div>

                  {/* Badge de estado */}
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      chatbot.activo
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {chatbot.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Información del chatbot */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Modelo IA:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {chatbot.ai_model || 'deepseek-chat'}
                    </span>
                  </div>
                  {chatbot.workflow_id && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Workflow:</span>
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        #{chatbot.workflow_id}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    onClick={() => setChatbotAEliminar(chatbot)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
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
        <ConfirmDialog
          isOpen={!!chatbotAEliminar}
          onClose={() => setChatbotAEliminar(null)}
          onConfirm={handleConfirmDelete}
          title="Eliminar chatbot"
          message={`Esta acción eliminará el chatbot "${chatbotAEliminar?.nombre}" y su workflow asociado en n8n. Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          isLoading={eliminarMutation.isPending}
        />
      </div>
    </div>
  );
}

export default ChatbotsPage;
