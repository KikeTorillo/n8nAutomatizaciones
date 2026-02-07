import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  PartyPopper,
  Calendar,
  Users,
  Eye,
  Trash2,
  Share2,
  ExternalLink,
  Palette,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DeleteConfirmDialog,
  Input,
  LoadingSpinner,
  Select,
} from '@/components/ui';
import { EventosDigitalesPageLayout } from '@/components/eventos-digitales';
import { useEventos, useEliminarEvento, usePublicarEvento } from '@/hooks/otros';
import { useToast, useModalManager, usePagination } from '@/hooks/utils';

/**
 * Página principal de gestión de eventos digitales
 * Dic 2025: Invitaciones para bodas, XV años, bautizos, etc.
 */
function EventosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');

  // Paginación
  const { page, handlePageChange } = usePagination({ limit: 12 });
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

  const ESTADO_BADGE_MAP = {
    borrador: 'default',
    publicado: 'success',
    finalizado: 'primary',
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
    <EventosDigitalesPageLayout
      icon={PartyPopper}
      title="Mis Eventos"
      subtitle="Administra y monitorea tus invitaciones digitales"
      actions={
        <div className="flex gap-2 sm:gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/eventos-digitales/plantillas/galeria')}
            className="flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Evento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      }
    >
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

          <Select
            options={tiposEvento}
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          />

          <Select
            options={estadosEvento}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          />
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
              <Card
                key={evento.id}
                hover
                padding="none"
                className="overflow-hidden"
              >
                {/* Imagen/Preview */}
                <div className="h-40 bg-gradient-to-br from-pink-100 to-secondary-100 dark:from-pink-900/30 dark:to-secondary-900/30 flex items-center justify-center overflow-hidden">
                  {evento.portada_url ? (
                    <img
                      src={evento.portada_url}
                      alt={evento.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PartyPopper className="w-16 h-16 text-pink-300 dark:text-pink-500" />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{evento.nombre}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getTipoLabel(evento.tipo)}</p>
                    </div>
                    <Badge variant={ESTADO_BADGE_MAP[evento.estado]} size="sm">
                      {evento.estado}
                    </Badge>
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
                  <div className="flex items-center flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/eventos-digitales/${evento.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/eventos-digitales/${evento.id}/editor`)}
                    >
                      <Palette className="w-4 h-4 mr-1" />
                      Diseñar
                    </Button>

                    {evento.estado === 'borrador' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublicar(evento.id)}
                        disabled={publicarEvento.isLoading}
                        className="bg-green-600 hover:bg-green-700"
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
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {data.paginacion && data.paginacion.total_paginas > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
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
                onClick={() => handlePageChange(page + 1)}
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
          <Button onClick={() => navigate('/eventos-digitales/plantillas/galeria')}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Evento
          </Button>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <DeleteConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        itemName={getModalData('delete')?.nombre}
        itemType="el evento"
        isLoading={eliminarEvento.isPending}
      />
    </EventosDigitalesPageLayout>
  );
}

export default EventosPage;
