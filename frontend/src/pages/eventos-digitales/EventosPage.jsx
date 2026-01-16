import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  PartyPopper,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Share2,
  ExternalLink
} from 'lucide-react';
import {
  BackButton,
  Button,
  ConfirmDialog,
  Input
} from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEventos, useEliminarEvento, usePublicarEvento } from '@/hooks/useEventosDigitales';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';

/**
 * Página principal de gestión de eventos digitales
 * Dic 2025: Invitaciones para bodas, XV años, bautizos, etc.
 */
function EventosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    delete: { isOpen: false, data: null },
  });

  const { data, isLoading, refetch } = useEventos({
    pagina: page,
    limite: 12,
    busqueda: busqueda || undefined,
    estado: estadoFiltro || undefined,
    tipo: tipoFiltro || undefined,
  });

  const eliminarEvento = useEliminarEvento();
  const publicarEvento = usePublicarEvento();

  const handleEliminar = async () => {
    const evento = getModalData('delete');
    if (!evento) return;

    try {
      await eliminarEvento.mutateAsync(evento.id);
      toast.success('Evento eliminado correctamente');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar evento');
    }
  };

  const handlePublicar = async (id) => {
    try {
      const data = await publicarEvento.mutateAsync(id);
      toast.success('Evento publicado. Ya puedes compartir el link con tus invitados');
      // Copiar link al clipboard
      if (data.url_publica) {
        navigator.clipboard.writeText(data.url_publica);
        toast.info('Link copiado al portapapeles');
      }
    } catch (error) {
      toast.error(error.message || 'Error al publicar evento');
    }
  };

  const tiposEvento = [
    { value: '', label: 'Todos los tipos' },
    { value: 'boda', label: 'Boda' },
    { value: 'xv_anos', label: 'XV Años' },
    { value: 'bautizo', label: 'Bautizo' },
    { value: 'cumpleanos', label: 'Cumpleaños' },
    { value: 'corporativo', label: 'Corporativo' },
    { value: 'otro', label: 'Otro' },
  ];

  const estadosEvento = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'publicado', label: 'Publicado' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  const getEstadoBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      publicado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
      finalizado: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400',
    };
    return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      boda: 'Boda',
      xv_anos: 'XV Años',
      bautizo: 'Bautizo',
      cumpleanos: 'Cumpleaños',
      corporativo: 'Corporativo',
      otro: 'Otro',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <PartyPopper className="h-6 w-6 sm:h-7 sm:w-7 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Eventos Digitales</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Crea invitaciones digitales para bodas, XV años, bautizos y más
              </p>
            </div>
          </div>

          <Button onClick={() => navigate('/eventos-digitales/nuevo')} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Evento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {tiposEvento.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {estadosEvento.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Eventos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : data?.eventos?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Imagen/Preview */}
                  <div className="h-40 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <PartyPopper className="w-16 h-16 text-pink-300 dark:text-pink-500" />
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{evento.nombre}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getTipoLabel(evento.tipo)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(evento.estado)}`}>
                        {evento.estado}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(evento.fecha_evento).toLocaleDateString('es-ES')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {evento.total_invitados || 0}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/eventos-digitales/${evento.id}`)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>

                      {evento.estado === 'borrador' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublicar(evento.id)}
                          disabled={publicarEvento.isLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Publicar
                        </Button>
                      )}

                      {evento.estado === 'publicado' && evento.slug && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/e/${evento.slug}`, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Ver Link
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal('delete', evento)}
                        disabled={eliminarEvento.isPending}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {data.paginacion && data.paginacion.total_paginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {page} de {data.paginacion.total_paginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.paginacion.total_paginas}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No hay eventos todavía
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crea tu primera invitación digital para compartir con tus invitados
            </p>
            <Button onClick={() => navigate('/eventos-digitales/nuevo')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Evento
            </Button>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar evento"
        message={`¿Estás seguro de eliminar el evento "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarEvento.isPending}
      />
    </div>
  );
}

export default EventosPage;
