import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
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
  FileText
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
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

  // Forms state
  const [invitadoForm, setInvitadoForm] = useState({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
  const [ubicacionForm, setUbicacionForm] = useState({ nombre: '', tipo: 'ceremonia', direccion: '', hora: '', google_maps_url: '' });
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

  const handleGuardarUbicacion = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: ubicacionForm.nombre,
        tipo: ubicacionForm.tipo,
        direccion: ubicacionForm.direccion || undefined,
        hora: ubicacionForm.hora || undefined,
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
      setUbicacionForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora: '', google_maps_url: '' });
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
      hora: ubi.hora || '',
      google_maps_url: ubi.google_maps_url || '',
    });
    setEditingUbicacionId(ubi.id);
    setShowUbicacionForm(true);
  };

  const handleCancelarUbicacion = () => {
    setUbicacionForm({ nombre: '', tipo: 'ceremonia', direccion: '', hora: '', google_maps_url: '' });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Evento no encontrado</p>
          <Button onClick={() => navigate('/eventos-digitales')} className="mt-4">
            Volver a Eventos
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'invitados', label: 'Invitados', icon: Users, count: invitadosData?.total || 0 },
    { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin, count: ubicaciones?.length || 0 },
    { id: 'regalos', label: 'Mesa de Regalos', icon: Gift, count: regalos?.length || 0 },
    { id: 'felicitaciones', label: 'Felicitaciones', icon: MessageCircle, count: felicitacionesData?.total || 0 },
  ];

  const getEstadoBadge = (estado) => {
    const badges = {
      borrador: 'bg-gray-100 text-gray-800',
      publicado: 'bg-green-100 text-green-800',
      finalizado: 'bg-blue-100 text-blue-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getRSVPBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/eventos-digitales')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-100 rounded-xl flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{evento.nombre}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(evento.estado)}`}>
                    {evento.estado}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
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
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Total Invitados</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.resumen.total_invitados || 0}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-600">Confirmados</p>
                <p className="text-2xl font-bold text-green-700">{estadisticas.resumen.total_confirmados || 0}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-sm text-red-600">No Asisten</p>
                <p className="text-2xl font-bold text-red-700">{estadisticas.resumen.total_declinados || 0}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-sm text-yellow-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-700">{estadisticas.resumen.total_pendientes || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                <span className={`
                  px-2 py-0.5 text-xs rounded-full
                  ${activeTab === tab.id ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab: Invitados */}
        {activeTab === 'invitados' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Lista de Invitados</h2>
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
                <Button onClick={() => setShowInvitadoForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Modal de Importación CSV */}
            {showImportModal && (
              <div className="bg-white rounded-lg shadow-sm p-4 border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Importar Invitados desde CSV
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setShowImportModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p className="font-medium mb-2">Formato esperado:</p>
                    <code className="block bg-white p-2 rounded border text-xs">
                      nombre,email,telefono,grupo_familiar,max_acompanantes<br/>
                      Juan Pérez,juan@email.com,5551234567,Familia Pérez,2<br/>
                      María López,maria@email.com,5559876543,,1
                    </code>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pega aquí el contenido CSV
                    </label>
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
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

            {showInvitadoForm && (
              <form onSubmit={handleGuardarInvitado} className="bg-white rounded-lg shadow-sm p-4 border">
                <h3 className="font-medium mb-4">{editingInvitadoId ? 'Editar Invitado' : 'Nuevo Invitado'}</h3>
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
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RSVP</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Asistentes</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitadosData.invitados.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-gray-900">{inv.nombre}</p>
                          {inv.grupo_familiar && (
                            <p className="text-sm text-gray-500">{inv.grupo_familiar}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-600">
                            {inv.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{inv.email}</p>}
                            {inv.telefono && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{inv.telefono}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRSVPBadge(inv.estado_rsvp)}`}>
                            {inv.estado_rsvp}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <span className="text-sm text-gray-600">
                            {inv.num_asistentes || 0} / {inv.max_acompanantes + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
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
                              className="text-red-600 hover:bg-red-50"
                              title="Eliminar invitado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay invitados todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Ubicaciones */}
        {activeTab === 'ubicaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Ubicaciones del Evento</h2>
              <Button onClick={() => setShowUbicacionForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Ubicación
              </Button>
            </div>

            {showUbicacionForm && (
              <form onSubmit={handleGuardarUbicacion} className="bg-white rounded-lg shadow-sm p-4 border">
                <h3 className="font-medium mb-4">{editingUbicacionId ? 'Editar Ubicación' : 'Nueva Ubicación'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={ubicacionForm.nombre}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, nombre: e.target.value })}
                    placeholder="Ej: Iglesia Santa María"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={ubicacionForm.tipo}
                      onChange={(e) => setUbicacionForm({ ...ubicacionForm, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    label="Hora"
                    type="time"
                    value={ubicacionForm.hora}
                    onChange={(e) => setUbicacionForm({ ...ubicacionForm, hora: e.target.value })}
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
                  <div key={ubi.id} className="bg-white rounded-lg shadow-sm p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{ubi.nombre}</h3>
                        <span className="text-xs text-gray-500 uppercase">{ubi.tipo}</span>
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
                          className="text-red-600 hover:bg-red-50"
                          title="Eliminar ubicación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {ubi.direccion && <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-4 h-4" />{ubi.direccion}</p>}
                    {ubi.hora && <p className="text-sm text-gray-600 flex items-center gap-1"><Clock className="w-4 h-4" />{ubi.hora}</p>}
                    {ubi.google_maps_url && (
                      <a href={ubi.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1 mt-2">
                        <ExternalLink className="w-4 h-4" />Ver en Google Maps
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay ubicaciones todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Mesa de Regalos */}
        {activeTab === 'regalos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Mesa de Regalos</h2>
              <Button onClick={() => setShowRegaloForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Regalo
              </Button>
            </div>

            {showRegaloForm && (
              <form onSubmit={handleGuardarRegalo} className="bg-white rounded-lg shadow-sm p-4 border">
                <h3 className="font-medium mb-4">{editingRegaloId ? 'Editar Regalo' : 'Nuevo Regalo'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    value={regaloForm.nombre}
                    onChange={(e) => setRegaloForm({ ...regaloForm, nombre: e.target.value })}
                    placeholder="Ej: Licuadora Oster"
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={regaloForm.tipo}
                      onChange={(e) => setRegaloForm({ ...regaloForm, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={regaloForm.descripcion}
                      onChange={(e) => setRegaloForm({ ...regaloForm, descripcion: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  <div key={regalo.id} className="bg-white rounded-lg shadow-sm p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{regalo.nombre}</h3>
                        <span className="text-xs text-gray-500 uppercase">{regalo.tipo.replace('_', ' ')}</span>
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
                          className="text-red-600 hover:bg-red-50"
                          title="Eliminar regalo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {regalo.descripcion && <p className="text-sm text-gray-600 mb-2">{regalo.descripcion}</p>}
                    {regalo.precio && <p className="text-lg font-semibold text-pink-600">${regalo.precio.toLocaleString()}</p>}
                    {regalo.comprado && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-2">
                        <Check className="w-3 h-3" />Comprado
                      </span>
                    )}
                    {regalo.url_externa && (
                      <a href={regalo.url_externa} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:underline flex items-center gap-1 mt-2">
                        <ExternalLink className="w-4 h-4" />Ver producto
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay regalos en la mesa todavía</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Felicitaciones */}
        {activeTab === 'felicitaciones' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Felicitaciones</h2>
            </div>

            {loadingFelicitaciones ? (
              <LoadingSpinner />
            ) : felicitacionesData?.felicitaciones?.length > 0 ? (
              <div className="space-y-4">
                {felicitacionesData.felicitaciones.map((fel) => (
                  <div key={fel.id} className="bg-white rounded-lg shadow-sm p-4 border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{fel.nombre_autor}</p>
                        <p className="text-sm text-gray-500">{new Date(fel.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="flex gap-2">
                        {!fel.aprobada && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => aprobarFelicitacion.mutate({ id: fel.id, eventoId: id })}
                              className="text-green-600 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rechazarFelicitacion.mutate({ id: fel.id, eventoId: id })}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {fel.aprobada && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Aprobada</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2 italic">"{fel.mensaje}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay felicitaciones todavía</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventoDetailPage;
