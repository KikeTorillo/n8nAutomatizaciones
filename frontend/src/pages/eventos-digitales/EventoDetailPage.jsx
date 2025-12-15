import { useState, useEffect, useRef } from 'react';
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
  Plus,
  Trash2,
  Check,
  X,
  Copy,
  PartyPopper,
  Clock,
  Mail,
  Phone,
  Upload,
  Download,
  FileText,
  QrCode,
  ScanLine,
  Camera,
  UserCheck,
  AlertCircle,
  LayoutGrid,
  MoreVertical
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { SeatingChartEditor } from './components';
import useAuthStore from '@/store/authStore';
import {
  useEvento,
  useEventoEstadisticas,
  useInvitados,
  useUbicacionesEvento,
  useMesaRegalos,
  useFelicitaciones,
  usePublicarEvento,
  useCrearInvitado,
  useActualizarInvitado,
  useEliminarInvitado,
  useImportarInvitados,
  useExportarInvitados,
  useCrearUbicacion,
  useActualizarUbicacion,
  useEliminarUbicacion,
  useCrearRegalo,
  useActualizarRegalo,
  useEliminarRegalo,
  useAprobarFelicitacion,
  useRechazarFelicitacion,
} from '@/hooks/useEventosDigitales';

/**
 * Página de detalle de evento digital con tabs
 */
function EventoDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [activeTab, setActiveTab] = useState('invitados');
  const [showInvitadoForm, setShowInvitadoForm] = useState(false);
  const [showUbicacionForm, setShowUbicacionForm] = useState(false);
  const [showRegaloForm, setShowRegaloForm] = useState(false);

  // Queries
  const { data: evento, isLoading: loadingEvento } = useEvento(id);
  const { data: estadisticas } = useEventoEstadisticas(id);
  const { data: invitadosData, isLoading: loadingInvitados } = useInvitados(id);
  const { data: ubicaciones, isLoading: loadingUbicaciones } = useUbicacionesEvento(id);
  const { data: regalos, isLoading: loadingRegalos } = useMesaRegalos(id);
  const { data: felicitacionesData, isLoading: loadingFelicitaciones } = useFelicitaciones(id);

  // Mutations
  const publicarEvento = usePublicarEvento();
  const crearInvitado = useCrearInvitado();
  const actualizarInvitado = useActualizarInvitado();
  const eliminarInvitado = useEliminarInvitado();
  const crearUbicacion = useCrearUbicacion();
  const actualizarUbicacion = useActualizarUbicacion();
  const eliminarUbicacion = useEliminarUbicacion();
  const crearRegalo = useCrearRegalo();
  const actualizarRegalo = useActualizarRegalo();
  const eliminarRegalo = useEliminarRegalo();
  const aprobarFelicitacion = useAprobarFelicitacion();
  const rechazarFelicitacion = useRechazarFelicitacion();
  const importarInvitados = useImportarInvitados();
  const exportarInvitados = useExportarInvitados();

  // Estados para edición
  const [editingInvitadoId, setEditingInvitadoId] = useState(null);
  const [editingUbicacionId, setEditingUbicacionId] = useState(null);
  const [editingRegaloId, setEditingRegaloId] = useState(null);

  // Estado para importación CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');

  // Estado para modal QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQRData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // Estado para Check-in
  const [scannerActive, setScannerActive] = useState(false);
  const [checkinStats, setCheckinStats] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Estado para menú móvil de invitados (iOS fix)
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  // Forms state
  const [invitadoForm, setInvitadoForm] = useState({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
  const [ubicacionForm, setUbicacionForm] = useState({ nombre: '', tipo: 'ceremonia', direccion: '', hora_inicio: '', hora_fin: '', google_maps_url: '' });
  const [regaloForm, setRegaloForm] = useState({ nombre: '', tipo: 'producto', descripcion: '', precio: '', url_externa: '' });

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

  const handleGuardarInvitado = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: invitadoForm.nombre,
        email: invitadoForm.email || undefined,
        telefono: invitadoForm.telefono || undefined,
        max_acompanantes: parseInt(invitadoForm.max_acompanantes) || 0,
      };

      if (editingInvitadoId) {
        await actualizarInvitado.mutateAsync({ id: editingInvitadoId, eventoId: id, data });
        toast.success('Invitado actualizado');
        setEditingInvitadoId(null);
      } else {
        await crearInvitado.mutateAsync({ eventoId: id, data });
        toast.success('Invitado agregado');
      }
      setInvitadoForm({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
      setShowInvitadoForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditarInvitado = (inv) => {
    setInvitadoForm({
      nombre: inv.nombre,
      email: inv.email || '',
      telefono: inv.telefono || '',
      max_acompanantes: inv.max_acompanantes || 0,
    });
    setEditingInvitadoId(inv.id);
    setShowInvitadoForm(true);
  };

  const handleCancelarInvitado = () => {
    setInvitadoForm({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
    setEditingInvitadoId(null);
    setShowInvitadoForm(false);
  };

  // Funciones para QR
  const handleVerQR = async (invitado) => {
    setLoadingQR(true);
    setShowQRModal(true);
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${id}/invitados/${invitado.id}/qr?formato=base64`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setQRData({ ...data.data, invitado });
      } else {
        toast.error('Error al obtener QR');
        setShowQRModal(false);
      }
    } catch (error) {
      toast.error('Error al obtener QR');
      setShowQRModal(false);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDescargarQR = () => {
    if (!qrData?.qr) return;
    const link = document.createElement('a');
    link.href = qrData.qr;
    link.download = `qr-${qrData.invitado.nombre.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDescargarQRMasivo = async () => {
    toast.info('Generando ZIP con todos los QR...');
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${id}/qr-masivo`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${evento.slug}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('QR descargados exitosamente');
      } else {
        toast.error('Error al descargar QR');
      }
    } catch (error) {
      toast.error('Error al descargar QR');
    }
  };

  // Funciones de Check-in
  const fetchCheckinStats = async () => {
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${id}/checkin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setCheckinStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching checkin stats:', error);
    }
  };

  const fetchRecentCheckins = async () => {
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${id}/checkin/lista`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setRecentCheckins(data.data);
      }
    } catch (error) {
      console.error('Error fetching recent checkins:', error);
    }
  };

  const handleCheckin = async (token) => {
    setLoadingCheckin(true);
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${id}/checkin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        }
      );
      const data = await response.json();
      if (data.success) {
        setLastCheckin({ ...data.data, success: true });
        toast.success(`Check-in exitoso: ${data.data.nombre}`);
        fetchCheckinStats();
        fetchRecentCheckins();
      } else {
        setLastCheckin({ success: false, mensaje: data.message });
        toast.error(data.message || 'Error en check-in');
      }
    } catch (error) {
      setLastCheckin({ success: false, mensaje: 'Error de conexión' });
      toast.error('Error de conexión');
    } finally {
      setLoadingCheckin(false);
    }
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-scanner');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Extraer token de la URL
          const urlParts = decodedText.split('/');
          const token = urlParts[urlParts.length - 1];
          if (token && token.length > 10) {
            handleCheckin(token);
            // Pausar brevemente para evitar múltiples lecturas
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.pause(true);
              setTimeout(() => {
                if (html5QrCodeRef.current) {
                  html5QrCodeRef.current.resume();
                }
              }, 2000);
            }
          }
        },
        () => {} // Ignorar errores de escaneo
      );
      setScannerActive(true);
    } catch (error) {
      toast.error('No se pudo acceder a la cámara');
      console.error('Scanner error:', error);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setScannerActive(false);
  };

  // Cargar stats de check-in al montar el componente (para el contador del tab)
  useEffect(() => {
    if (id && accessToken) {
      fetchCheckinStats();
    }
  }, [id, accessToken]);

  // Cargar datos completos cuando se activa el tab de check-in
  useEffect(() => {
    if (activeTab === 'checkin') {
      fetchCheckinStats();
      fetchRecentCheckins();
    }
    return () => {
      stopScanner();
    };
  }, [activeTab]);

  const handleGuardarUbicacion = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: ubicacionForm.nombre,
        tipo: ubicacionForm.tipo,
        direccion: ubicacionForm.direccion || undefined,
        hora_inicio: ubicacionForm.hora_inicio || undefined,
        hora_fin: ubicacionForm.hora_fin || undefined,
        google_maps_url: ubicacionForm.google_maps_url || undefined,
      };

      if (editingUbicacionId) {
        await actualizarUbicacion.mutateAsync({ id: editingUbicacionId, eventoId: id, data });
        toast.success('Ubicación actualizada');
        setEditingUbicacionId(null);
      } else {
        await crearUbicacion.mutateAsync({ eventoId: id, data });
        toast.success('Ubicación agregada');
      }
      setUbicacionForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora_inicio: '', hora_fin: '', google_maps_url: '' });
      setShowUbicacionForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditarUbicacion = (ubi) => {
    setUbicacionForm({
      nombre: ubi.nombre,
      tipo: ubi.tipo || 'ceremonia',
      direccion: ubi.direccion || '',
      hora_inicio: ubi.hora_inicio || '',
      hora_fin: ubi.hora_fin || '',
      google_maps_url: ubi.google_maps_url || '',
    });
    setEditingUbicacionId(ubi.id);
    setShowUbicacionForm(true);
  };

  const handleCancelarUbicacion = () => {
    setUbicacionForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora_inicio: '', hora_fin: '', google_maps_url: '' });
    setEditingUbicacionId(null);
    setShowUbicacionForm(false);
  };

  const handleGuardarRegalo = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: regaloForm.nombre,
        tipo: regaloForm.tipo,
        descripcion: regaloForm.descripcion || undefined,
        precio: regaloForm.precio ? parseFloat(regaloForm.precio) : undefined,
        url_externa: regaloForm.url_externa || undefined,
      };

      if (editingRegaloId) {
        await actualizarRegalo.mutateAsync({ id: editingRegaloId, eventoId: id, data });
        toast.success('Regalo actualizado');
        setEditingRegaloId(null);
      } else {
        await crearRegalo.mutateAsync({ eventoId: id, data });
        toast.success('Regalo agregado');
      }
      setRegaloForm({ nombre: '', tipo: 'producto', descripcion: '', precio: '', url_externa: '' });
      setShowRegaloForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditarRegalo = (regalo) => {
    setRegaloForm({
      nombre: regalo.nombre,
      tipo: regalo.tipo || 'producto',
      descripcion: regalo.descripcion || '',
      precio: regalo.precio ? String(regalo.precio) : '',
      url_externa: regalo.url_externa || '',
    });
    setEditingRegaloId(regalo.id);
    setShowRegaloForm(true);
  };

  const handleCancelarRegalo = () => {
    setRegaloForm({ nombre: '', tipo: 'producto', descripcion: '', precio: '', url_externa: '' });
    setEditingRegaloId(null);
    setShowRegaloForm(false);
  };

  // Parsear CSV a array de invitados
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const invitados = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 1 && values[0]) {
        const inv = {};
        headers.forEach((header, idx) => {
          if (values[idx]) {
            if (header === 'nombre') inv.nombre = values[idx];
            else if (header === 'email') inv.email = values[idx];
            else if (header === 'telefono' || header === 'teléfono') inv.telefono = values[idx];
            else if (header === 'grupo_familiar' || header === 'grupo') inv.grupo_familiar = values[idx];
            else if (header === 'max_acompanantes' || header === 'acompañantes') inv.max_acompanantes = parseInt(values[idx]) || 0;
          }
        });
        if (inv.nombre) invitados.push(inv);
      }
    }
    return invitados;
  };

  const handleImportarCSV = async () => {
    try {
      const invitados = parseCSV(csvText);
      if (invitados.length === 0) {
        toast.error('No se encontraron invitados válidos en el CSV');
        return;
      }

      await importarInvitados.mutateAsync({ eventoId: id, formData: { invitados } });
      toast.success(`${invitados.length} invitados importados correctamente`);
      setCsvText('');
      setShowImportModal(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExportarCSV = async () => {
    try {
      const blob = await exportarInvitados.mutateAsync(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invitados-${evento?.slug || id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invitados exportados correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al exportar');
    }
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

  const mostrarQR = evento?.configuracion?.mostrar_qr_invitado === true;
  const mostrarSeatingChart = evento?.configuracion?.habilitar_seating_chart === true;

  const tabs = [
    { id: 'invitados', label: 'Invitados', icon: Users, count: invitadosData?.total || 0 },
    // Solo mostrar tab de Check-in si el QR está habilitado
    ...(mostrarQR ? [{ id: 'checkin', label: 'Check-in', icon: ScanLine, count: checkinStats?.total_checkin || 0 }] : []),
    // Solo mostrar tab de Mesas si seating chart está habilitado
    ...(mostrarSeatingChart ? [{ id: 'mesas', label: 'Mesas', icon: LayoutGrid }] : []),
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

  const getRSVPBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
      confirmado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
      rechazado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
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

            <div className="flex gap-2">
              {evento.estado === 'borrador' && (
                <Button onClick={handlePublicar} disabled={publicarEvento.isLoading} className="bg-green-600 hover:bg-green-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              )}
              {evento.estado === 'publicado' && evento.slug && (
                <>
                  <Button variant="outline" onClick={handleCopiarLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button variant="outline" onClick={() => window.open(`/e/${evento.slug}`, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => navigate(`/eventos-digitales/${id}/editar`)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Gradiente indicador de scroll derecho */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10 sm:hidden" />
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-px -mb-px" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors flex-shrink-0
                  ${activeTab === tab.id
                    ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden sm:hidden">{tab.label.substring(0, 3)}</span>
                {tab.count !== undefined && (
                  <span className={`
                    px-1.5 sm:px-2 py-0.5 text-xs rounded-full
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
        {/* Tab: Invitados */}
        {activeTab === 'invitados' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lista de Invitados</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportarCSV}
                  disabled={exportarInvitados.isLoading || !invitadosData?.invitados?.length}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportarInvitados.isLoading ? 'Exportando...' : 'Exportar CSV'}
                </Button>
                {mostrarQR && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDescargarQRMasivo}
                    disabled={!invitadosData?.invitados?.length}
                    title="Descargar todos los códigos QR en un ZIP"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Descargar QR
                  </Button>
                )}
                <Button onClick={() => setShowInvitadoForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Modal de Importación CSV */}
            {showImportModal && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Importar Invitados desde CSV
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setShowImportModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-medium mb-2">Formato esperado:</p>
                    <code className="block bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 text-xs">
                      nombre,email,telefono,grupo_familiar,max_acompanantes<br/>
                      Juan Pérez,juan@email.com,5551234567,Familia Pérez,2<br/>
                      María López,maria@email.com,5559876543,,1
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pega aquí el contenido CSV
                    </label>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="nombre,email,telefono,grupo_familiar,max_acompanantes&#10;Juan Pérez,juan@email.com,5551234567,Familia Pérez,2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportarCSV}
                      disabled={importarInvitados.isLoading || !csvText.trim()}
                    >
                      {importarInvitados.isLoading ? 'Importando...' : 'Importar'}
                    </Button>
                    <Button variant="outline" onClick={() => { setCsvText(''); setShowImportModal(false); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de visualización QR */}
            {showQRModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">Código QR</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowQRModal(false);
                        setQRData(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {loadingQR ? (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : qrData ? (
                    <div className="text-center">
                      <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">{qrData.invitado?.nombre}</p>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 inline-block mb-4">
                        <img
                          src={qrData.qr}
                          alt={`QR de ${qrData.invitado?.nombre}`}
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 break-all">{qrData.url}</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={handleDescargarQR}>
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(qrData.url);
                            toast.success('Link copiado');
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Link
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No se pudo cargar el QR</p>
                  )}
                </div>
              </div>
            )}

            {showInvitadoForm && (
              <form onSubmit={handleGuardarInvitado} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingInvitadoId ? 'Editar Invitado' : 'Nuevo Invitado'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={invitadoForm.nombre}
                    onChange={(e) => setInvitadoForm({ ...invitadoForm, nombre: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={invitadoForm.email}
                    onChange={(e) => setInvitadoForm({ ...invitadoForm, email: e.target.value })}
                  />
                  <Input
                    label="Teléfono"
                    value={invitadoForm.telefono}
                    onChange={(e) => setInvitadoForm({ ...invitadoForm, telefono: e.target.value })}
                  />
                  <Input
                    label="Máx. Acompañantes"
                    type="number"
                    min="0"
                    value={invitadoForm.max_acompanantes}
                    onChange={(e) => setInvitadoForm({ ...invitadoForm, max_acompanantes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={crearInvitado.isLoading || actualizarInvitado.isLoading}>
                    {(crearInvitado.isLoading || actualizarInvitado.isLoading) ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleCancelarInvitado}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {loadingInvitados ? (
              <LoadingSpinner />
            ) : invitadosData?.invitados?.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Contacto</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">RSVP</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Asistentes</th>
                      <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-20 sm:w-auto"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invitadosData.invitados.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{inv.nombre}</p>
                          {inv.grupo_familiar && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{inv.grupo_familiar}</p>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {inv.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{inv.email}</p>}
                            {inv.telefono && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{inv.telefono}</p>}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRSVPBadge(inv.estado_rsvp)}`}>
                            {inv.estado_rsvp}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {inv.num_asistentes || 0} / {inv.max_acompanantes + 1}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                          {/* Desktop: botones visibles */}
                          <div className="hidden sm:flex items-center justify-end gap-2">
                            {mostrarQR && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerQR(inv)}
                                title="Ver código QR"
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const invitacionUrl = `${window.location.origin}/e/${evento.slug}/${inv.token}`;
                                navigator.clipboard.writeText(invitacionUrl);
                                toast.success('Link de invitación copiado');
                              }}
                              title="Copiar link de invitación"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditarInvitado(inv)}
                              title="Editar invitado"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => eliminarInvitado.mutate({ id: inv.id, eventoId: id })}
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Eliminar invitado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {/* Mobile: menú dropdown */}
                          <div className="sm:hidden relative">
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuAbiertoId(menuAbiertoId === inv.id ? null : inv.id);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {menuAbiertoId === inv.id && (
                              <>
                                {/* Overlay para cerrar al tocar fuera */}
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuAbiertoId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                                  {mostrarQR && (
                                    <button
                                      onClick={() => {
                                        handleVerQR(inv);
                                        setMenuAbiertoId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <QrCode className="w-4 h-4" /> Ver QR
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const invitacionUrl = `${window.location.origin}/e/${evento.slug}/${inv.token}`;
                                      navigator.clipboard.writeText(invitacionUrl);
                                      toast.success('Link copiado');
                                      setMenuAbiertoId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Copy className="w-4 h-4" /> Copiar link
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEditarInvitado(inv);
                                      setMenuAbiertoId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" /> Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      eliminarInvitado.mutate({ id: inv.id, eventoId: id });
                                      setMenuAbiertoId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay invitados todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Check-in */}
        {activeTab === 'checkin' && (
          <div className="space-y-6">
            {/* Header y Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel del Escáner */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Escáner de QR
                  </h2>
                  {scannerActive ? (
                    <Button variant="outline" onClick={stopScanner} className="text-red-600 dark:text-red-400">
                      <X className="w-4 h-4 mr-2" />
                      Detener
                    </Button>
                  ) : (
                    <Button onClick={startScanner}>
                      <ScanLine className="w-4 h-4 mr-2" />
                      Iniciar Escáner
                    </Button>
                  )}
                </div>

                {/* Área del escáner */}
                <div className="relative">
                  {/* Placeholder cuando el escáner no está activo */}
                  {!scannerActive && (
                    <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Presiona "Iniciar Escáner" para activar la cámara</p>
                        <p className="text-sm mt-2">Apunta al código QR del invitado</p>
                      </div>
                    </div>
                  )}
                  {/* Contenedor para html5-qrcode - separado del contenido React */}
                  <div
                    id="qr-scanner"
                    ref={scannerRef}
                    className={`w-full min-h-[300px] bg-gray-900 rounded-lg ${!scannerActive ? 'hidden' : ''}`}
                    style={{
                      position: 'relative',
                    }}
                  />
                  {/* Estilos para el video de html5-qrcode */}
                  <style>{`
                    #qr-scanner video {
                      width: 100% !important;
                      height: auto !important;
                      border-radius: 0.5rem;
                    }
                    #qr-scanner #qr-shaded-region {
                      border-width: 50px !important;
                    }
                  `}</style>
                </div>

                {/* Último check-in */}
                {lastCheckin && (
                  <div className={`mt-4 p-4 rounded-lg ${lastCheckin.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
                    {lastCheckin.success ? (
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-300">{lastCheckin.nombre}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">Check-in registrado correctamente</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-300">Error en check-in</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{lastCheckin.mensaje}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {loadingCheckin && (
                  <div className="mt-4 flex items-center justify-center p-4">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Procesando check-in...</span>
                  </div>
                )}
              </div>

              {/* Panel de Estadísticas */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Estadísticas</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total invitados</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{invitadosData?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Confirmados</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{checkinStats?.total_confirmados || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Check-ins</span>
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{checkinStats?.total_checkin || 0}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {checkinStats?.total_confirmados ?
                            Math.round((checkinStats.total_checkin / checkinStats.total_confirmados) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${checkinStats?.total_confirmados ?
                              Math.min(100, (checkinStats.total_checkin / checkinStats.total_confirmados) * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { fetchCheckinStats(); fetchRecentCheckins(); }}
                >
                  Actualizar datos
                </Button>
              </div>
            </div>

            {/* Últimos Check-ins */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Últimos Check-ins</h3>
              {recentCheckins.length > 0 ? (
                <div className="space-y-3">
                  {recentCheckins.map((checkin, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{checkin.nombre}</p>
                          {checkin.grupo_familiar && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{checkin.grupo_familiar}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(checkin.checkin_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No hay check-ins registrados</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Mesas (Seating Chart) */}
        {activeTab === 'mesas' && (
          <div className="space-y-4">
            <SeatingChartEditor eventoId={parseInt(id)} />
          </div>
        )}

        {/* Tab: Ubicaciones */}
        {activeTab === 'ubicaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ubicaciones del Evento</h2>
              <Button onClick={() => setShowUbicacionForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Ubicación
              </Button>
            </div>

            {showUbicacionForm && (
              <form onSubmit={handleGuardarUbicacion} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingUbicacionId ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={ubicacionForm.nombre}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, nombre: e.target.value })}
                    placeholder="Ej: Iglesia Santa María"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select
                      value={ubicacionForm.tipo}
                      onChange={(e) => setUbicacionForm({ ...ubicacionForm, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="ceremonia">Ceremonia</option>
                      <option value="recepcion">Recepción</option>
                      <option value="fiesta">Fiesta</option>
                      <option value="after">After Party</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <Input
                    label="Dirección"
                    value={ubicacionForm.direccion}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, direccion: e.target.value })}
                  />
                  <Input
                    label="Hora Inicio"
                    type="time"
                    value={ubicacionForm.hora_inicio}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, hora_inicio: e.target.value })}
                  />
                  <Input
                    label="Hora Fin"
                    type="time"
                    value={ubicacionForm.hora_fin}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, hora_fin: e.target.value })}
                  />
                  <Input
                    label="Link Google Maps"
                    value={ubicacionForm.google_maps_url}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, google_maps_url: e.target.value })}
                    className="sm:col-span-2"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={crearUbicacion.isLoading || actualizarUbicacion.isLoading}>
                    {(crearUbicacion.isLoading || actualizarUbicacion.isLoading) ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleCancelarUbicacion}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {loadingUbicaciones ? (
              <LoadingSpinner />
            ) : ubicaciones?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ubicaciones.map((ubi) => (
                  <div key={ubi.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{ubi.nombre}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{ubi.tipo}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarUbicacion(ubi)}
                          title="Editar ubicación"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarUbicacion.mutate({ id: ubi.id, eventoId: id })}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Eliminar ubicación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {ubi.direccion && <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-4 h-4" />{ubi.direccion}</p>}
                    {(ubi.hora_inicio || ubi.hora_fin) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {ubi.hora_inicio}{ubi.hora_inicio && ubi.hora_fin && ' - '}{ubi.hora_fin}
                      </p>
                    )}
                    {ubi.google_maps_url && (
                      <a href={ubi.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                        <ExternalLink className="w-4 h-4" />Ver en Google Maps
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay ubicaciones todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Mesa de Regalos */}
        {activeTab === 'regalos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mesa de Regalos</h2>
              <Button onClick={() => setShowRegaloForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Regalo
              </Button>
            </div>

            {showRegaloForm && (
              <form onSubmit={handleGuardarRegalo} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingRegaloId ? 'Editar Regalo' : 'Nuevo Regalo'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={regaloForm.nombre}
                    onChange={(e) => setRegaloForm({ ...regaloForm, nombre: e.target.value })}
                    placeholder="Ej: Licuadora Oster"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select
                      value={regaloForm.tipo}
                      onChange={(e) => setRegaloForm({ ...regaloForm, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="producto">Producto</option>
                      <option value="sobre_digital">Sobre Digital</option>
                      <option value="link_externo">Link Externo</option>
                    </select>
                  </div>
                  <Input
                    label="Precio"
                    type="number"
                    step="0.01"
                    value={regaloForm.precio}
                    onChange={(e) => setRegaloForm({ ...regaloForm, precio: e.target.value })}
                  />
                  <Input
                    label="URL Externa"
                    value={regaloForm.url_externa}
                    onChange={(e) => setRegaloForm({ ...regaloForm, url_externa: e.target.value })}
                    placeholder="https://..."
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                      value={regaloForm.descripcion}
                      onChange={(e) => setRegaloForm({ ...regaloForm, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={crearRegalo.isLoading || actualizarRegalo.isLoading}>
                    {(crearRegalo.isLoading || actualizarRegalo.isLoading) ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleCancelarRegalo}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            {loadingRegalos ? (
              <LoadingSpinner />
            ) : regalos?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regalos.map((regalo) => (
                  <div key={regalo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{regalo.nombre}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{regalo.tipo.replace('_', ' ')}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarRegalo(regalo)}
                          title="Editar regalo"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarRegalo.mutate({ id: regalo.id, eventoId: id })}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Eliminar regalo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {regalo.descripcion && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{regalo.descripcion}</p>}
                    {regalo.precio && <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">${regalo.precio.toLocaleString()}</p>}
                    {regalo.comprado && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-2 py-1 rounded-full mt-2">
                        <Check className="w-3 h-3" />Comprado
                      </span>
                    )}
                    {regalo.url_externa && (
                      <a href={regalo.url_externa} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1 mt-2">
                        <ExternalLink className="w-4 h-4" />Ver producto
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay regalos en la mesa todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Felicitaciones */}
        {activeTab === 'felicitaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Felicitaciones</h2>
            </div>

            {loadingFelicitaciones ? (
              <LoadingSpinner />
            ) : felicitacionesData?.felicitaciones?.length > 0 ? (
              <div className="space-y-4">
                {felicitacionesData.felicitaciones.map((fel) => (
                  <div key={fel.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{fel.nombre_autor}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(fel.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="flex gap-2">
                        {!fel.aprobada && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => aprobarFelicitacion.mutate({ id: fel.id, eventoId: id })}
                              className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rechazarFelicitacion.mutate({ id: fel.id, eventoId: id })}
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {fel.aprobada && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 px-2 py-1 rounded-full">Aprobada</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mt-2 italic">"{fel.mensaje}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay felicitaciones todavía</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventoDetailPage;
