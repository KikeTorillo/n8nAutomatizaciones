import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Edit,
  Calendar,
  Users,
  MapPin,
  Gift,
  MessageCircle,
  Share2,
  ExternalLink,
  Copy,
  PartyPopper,
  ScanLine,
  LayoutGrid,
  Palette,
} from 'lucide-react';
import { BackButton, Button, LoadingSpinner, MobileTabSelector } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { SeatingChartEditor } from '@/components/eventos-digitales';
import {
  useEvento,
  useEventoEstadisticas,
  useInvitados,
  useUbicacionesEvento,
  useMesaRegalos,
  useFelicitaciones,
  usePublicarEvento,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,
  useEliminarUbicacion,
  useEliminarRegalo,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
  useCheckinStats,
} from '@/hooks/otros';
import {
  InvitadosTab,
  CheckinTab,
  UbicacionesTab,
  RegalosTab,
  FelicitacionesTab,
} from '@/components/eventos-digitales';

/**
 * Pagina de detalle de evento digital con tabs
 */
function EventoDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('invitados');

  // Queries
  const { data: evento, isLoading: loadingEvento } = useEvento(id);
  const { data: estadisticas } = useEventoEstadisticas(id);
  const { data: invitadosData, isLoading: loadingInvitados } = useInvitados(id);
  const { data: ubicaciones, isLoading: loadingUbicaciones } = useUbicacionesEvento(id);
  const { data: regalos, isLoading: loadingRegalos } = useMesaRegalos(id);
  const { data: felicitacionesData, isLoading: loadingFelicitaciones } = useFelicitaciones(id);
  const { data: checkinStats } = useCheckinStats(id);

  // Mutations
  const publicarEvento = usePublicarEvento();
  const eliminarInvitado = useEliminarInvitado();
  const importarInvitados = useImportarInvitados();
  const exportarInvitados = useExportarInvitados();
  const eliminarUbicacion = useEliminarUbicacion();
  const eliminarRegalo = useEliminarRegalo();
  const aprobarFelicitacion = useAprobarFelicitacion();
  const rechazarFelicitacion = useRechazarFelicitacion();

  const handlePublicar = async () => {
    try {
      const data = await publicarEvento.mutateAsync(id);
      toast.success('Evento publicado correctamente');
      if (data.url_publica) {
        navigator.clipboard.writeText(data.url_publica);
        toast.info('Link copiado al portapapeles');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCopiarLink = () => {
    const url = `${window.location.origin}/e/${evento.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado al portapapeles');
  };

  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Evento no encontrado</p>
          <Button onClick={() => navigate('/eventos-digitales')} className="mt-4">
            Volver a Eventos
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'invitados', label: 'Invitados', icon: Users, count: invitadosData?.total || 0 },
    { id: 'checkin', label: 'Check-in', icon: ScanLine, count: checkinStats?.total_checkin || 0 },
    { id: 'mesas', label: 'Mesas', icon: LayoutGrid },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin, count: ubicaciones?.length || 0 },
    { id: 'regalos', label: 'Mesa de Regalos', icon: Gift, count: regalos?.length || 0 },
    { id: 'felicitaciones', label: 'Felicitaciones', icon: MessageCircle, count: felicitacionesData?.total || 0 },
  ];

  const getEstadoBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      publicado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
      finalizado: 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400',
    };
    return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <BackButton to="/eventos-digitales" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/40 rounded-xl flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{evento.nombre}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(evento.estado)}`}>
                    {evento.estado}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              {evento.estado === 'borrador' && (
                <Button size="sm" onClick={handlePublicar} disabled={publicarEvento.isPending} className="bg-green-600 hover:bg-green-700">
                  <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                  Publicar
                </Button>
              )}
              {evento.estado === 'publicado' && evento.slug && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopiarLink}>
                    <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">Link</span>
                    <span className="hidden sm:inline">Copiar Link</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/e/${evento.slug}`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-1 sm:mr-2" />
                    Ver
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(`/eventos-digitales/${id}/editar`)}>
                <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                Editar
              </Button>
              <Button size="sm" onClick={() => navigate(`/eventos-digitales/${id}/editor`)}>
                <Palette className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="sm:hidden">Diseñar</span>
                <span className="hidden sm:inline">Diseñar Invitación</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          {estadisticas?.resumen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Invitados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{estadisticas.resumen.total_invitados || 0}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <p className="text-sm text-green-600 dark:text-green-400">Confirmados</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{estadisticas.resumen.total_confirmados || 0}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">No Asisten</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{estadisticas.resumen.total_declinados || 0}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{estadisticas.resumen.total_pendientes || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Móvil: Select dropdown */}
          <div className="py-3 sm:hidden">
            <MobileTabSelector
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              getTabIcon={(tabId) => tabs.find((t) => t.id === tabId)?.icon}
            />
          </div>

          {/* Desktop: Tab bar horizontal */}
          <nav className="hidden sm:flex gap-6 pb-px -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${activeTab === tab.id ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {activeTab === 'invitados' && (
          <InvitadosTab
            invitadosData={invitadosData}
            isLoading={loadingInvitados}
            evento={evento}
            mostrarQR={true}
            eliminarInvitado={eliminarInvitado}
            importarInvitados={importarInvitados}
            exportarInvitados={exportarInvitados}
            eventoId={id}
          />
        )}

        {activeTab === 'checkin' && (
          <CheckinTab
            eventoId={id}
            totalInvitados={invitadosData?.total || 0}
          />
        )}

        {activeTab === 'mesas' && (
          <div className="space-y-4">
            <SeatingChartEditor eventoId={parseInt(id)} />
          </div>
        )}

        {activeTab === 'ubicaciones' && (
          <UbicacionesTab
            ubicaciones={ubicaciones}
            isLoading={loadingUbicaciones}
            eliminarUbicacion={eliminarUbicacion}
            eventoId={id}
          />
        )}

        {activeTab === 'regalos' && (
          <RegalosTab
            regalos={regalos}
            isLoading={loadingRegalos}
            eliminarRegalo={eliminarRegalo}
            eventoId={id}
          />
        )}

        {activeTab === 'felicitaciones' && (
          <FelicitacionesTab
            felicitacionesData={felicitacionesData}
            isLoading={loadingFelicitaciones}
            aprobarFelicitacion={aprobarFelicitacion}
            rechazarFelicitacion={rechazarFelicitacion}
            eventoId={id}
          />
        )}
      </div>
    </div>
  );
}

export default EventoDetailPage;
