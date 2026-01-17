import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Copy,
  Upload,
  Download,
  QrCode,
  X,
  FileText,
  Mail,
  Phone,
  MoreVertical,
} from 'lucide-react';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';

/**
 * Tab de invitados del evento
 * @param {Object} props
 * @param {Object} props.invitadosData - Datos de invitados { invitados: [], total: number }
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.evento - Datos del evento (slug)
 * @param {boolean} props.mostrarQR - Si mostrar opciones de QR
 * @param {string} props.accessToken - Token de autenticacion
 * @param {Object} props.crearInvitado - Mutation para crear
 * @param {Object} props.actualizarInvitado - Mutation para actualizar
 * @param {Object} props.eliminarInvitado - Mutation para eliminar
 * @param {Object} props.importarInvitados - Mutation para importar CSV
 * @param {Object} props.exportarInvitados - Mutation para exportar CSV
 * @param {string} props.eventoId - ID del evento
 */
export default function InvitadosTab({
  invitadosData,
  isLoading,
  evento,
  mostrarQR,
  accessToken,
  crearInvitado,
  actualizarInvitado,
  eliminarInvitado,
  importarInvitados,
  exportarInvitados,
  eventoId,
}) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [loadingQR, setLoadingQR] = useState(false);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    qr: { isOpen: false, data: null },
  });

  const getRSVPBadge = (estado) => {
    const badges = {
      pendiente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
      confirmado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
      rechazado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
    };
    return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      const data = {
        nombre: form.nombre,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        max_acompanantes: parseInt(form.max_acompanantes) || 0,
      };

      if (editingId) {
        await actualizarInvitado.mutateAsync({ id: editingId, eventoId, data });
        toast.success('Invitado actualizado');
        setEditingId(null);
      } else {
        await crearInvitado.mutateAsync({ eventoId, data });
        toast.success('Invitado agregado');
      }
      setForm({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
      setShowForm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditar = (inv) => {
    setForm({
      nombre: inv.nombre,
      email: inv.email || '',
      telefono: inv.telefono || '',
      max_acompanantes: inv.max_acompanantes || 0,
    });
    setEditingId(inv.id);
    setShowForm(true);
  };

  const handleCancelar = () => {
    setForm({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleVerQR = async (invitado) => {
    setLoadingQR(true);
    openModal('qr', null);
    try {
      const response = await fetch(
        `/api/v1/eventos-digitales/eventos/${eventoId}/invitados/${invitado.id}/qr?formato=base64`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        openModal('qr', { ...data.data, invitado });
      } else {
        toast.error('Error al obtener QR');
        closeModal('qr');
      }
    } catch (err) {
      toast.error('Error al obtener QR');
      closeModal('qr');
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDescargarQR = () => {
    const qrData = getModalData('qr');
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
        `/api/v1/eventos-digitales/eventos/${eventoId}/qr-masivo`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
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
        toast.error('No se encontraron invitados validos en el CSV');
        return;
      }
      await importarInvitados.mutateAsync({ eventoId, formData: { invitados } });
      toast.success(`${invitados.length} invitados importados correctamente`);
      setCsvText('');
      setShowImportModal(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExportarCSV = async () => {
    try {
      const blob = await exportarInvitados.mutateAsync(eventoId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invitados-${evento?.slug || eventoId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Invitados exportados correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al exportar');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
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
            disabled={exportarInvitados.isPending || !invitadosData?.invitados?.length}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportarInvitados.isPending ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          {mostrarQR && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDescargarQRMasivo}
              disabled={!invitadosData?.invitados?.length}
              title="Descargar todos los codigos QR en un ZIP"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Descargar QR
            </Button>
          )}
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Modal de Importacion CSV */}
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
                Juan Perez,juan@email.com,5551234567,Familia Perez,2<br/>
                Maria Lopez,maria@email.com,5559876543,,1
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pega aqui el contenido CSV
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="nombre,email,telefono,grupo_familiar,max_acompanantes&#10;Juan Perez,juan@email.com,5551234567,Familia Perez,2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleImportarCSV}
                disabled={importarInvitados.isPending || !csvText.trim()}
              >
                {importarInvitados.isPending ? 'Importando...' : 'Importar'}
              </Button>
              <Button variant="outline" onClick={() => { setCsvText(''); setShowImportModal(false); }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualizacion QR */}
      {isOpen('qr') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">Codigo QR</h3>
              <Button variant="outline" size="sm" onClick={() => closeModal('qr')}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loadingQR ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : getModalData('qr') ? (
              <div className="text-center">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">{getModalData('qr')?.invitado?.nombre}</p>
                <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-600 inline-block mb-4">
                  <img
                    src={getModalData('qr')?.qr}
                    alt={`QR de ${getModalData('qr')?.invitado?.nombre}`}
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 break-all">{getModalData('qr')?.url}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleDescargarQR}>
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(getModalData('qr')?.url);
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

      {showForm && (
        <form onSubmit={handleGuardar} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{editingId ? 'Editar Invitado' : 'Nuevo Invitado'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
            <Input
              label="Max. Acompanantes"
              type="number"
              min="0"
              value={form.max_acompanantes}
              onChange={(e) => setForm({ ...form, max_acompanantes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={crearInvitado.isPending || actualizarInvitado.isPending}>
              {(crearInvitado.isPending || actualizarInvitado.isPending) ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" type="button" onClick={handleCancelar}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {invitadosData?.invitados?.length > 0 ? (
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
                          title="Ver codigo QR"
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
                          toast.success('Link de invitacion copiado');
                        }}
                        title="Copiar link de invitacion"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditar(inv)}
                        title="Editar invitado"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => eliminarInvitado.mutate({ id: inv.id, eventoId })}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Eliminar invitado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Mobile: menu dropdown */}
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
                                handleEditar(inv);
                                setMenuAbiertoId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Editar
                            </button>
                            <button
                              onClick={() => {
                                eliminarInvitado.mutate({ id: inv.id, eventoId });
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
          <p className="text-gray-500 dark:text-gray-400">No hay invitados todavia</p>
        </div>
      )}
    </div>
  );
}
