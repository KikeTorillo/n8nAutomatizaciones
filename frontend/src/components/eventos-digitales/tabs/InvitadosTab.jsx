import { useState, useCallback } from 'react';
import {
  Plus,
  Users,
  Copy,
  Upload,
  Download,
  QrCode,
  X,
  FileText,
} from 'lucide-react';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import { useModalManager } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';
import { eventosDigitalesApi } from '@/services/api/modules';
import InvitadoTableRow from './InvitadoTableRow';

/**
 * Tab de invitados del evento
 * Refactorizado con React.memo y useCallback - Feb 2026
 *
 * @param {Object} props
 * @param {Object} props.invitadosData - Datos de invitados { invitados: [], total: number }
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Object} props.evento - Datos del evento (slug)
 * @param {boolean} props.mostrarQR - Si mostrar opciones de QR
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

  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    qr: { isOpen: false, data: null },
  });

  // ==================== HANDLERS MEMOIZADOS ====================

  const handleGuardar = useCallback(async (e) => {
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
  }, [form, editingId, eventoId, actualizarInvitado, crearInvitado, toast]);

  const handleEditar = useCallback((inv) => {
    setForm({
      nombre: inv.nombre,
      email: inv.email || '',
      telefono: inv.telefono || '',
      max_acompanantes: inv.max_acompanantes || 0,
    });
    setEditingId(inv.id);
    setShowForm(true);
  }, []);

  const handleCancelar = useCallback(() => {
    setForm({ nombre: '', email: '', telefono: '', max_acompanantes: 0 });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEliminar = useCallback((invitadoId) => {
    eliminarInvitado.mutate({ id: invitadoId, eventoId });
  }, [eliminarInvitado, eventoId]);

  const handleCopyLink = useCallback((url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link de invitacion copiado');
  }, [toast]);

  const handleVerQR = useCallback(async (invitado) => {
    setLoadingQR(true);
    openModal('qr', null);
    try {
      const response = await eventosDigitalesApi.obtenerQRInvitado(eventoId, invitado.id, 'base64');
      if (response.data?.success) {
        openModal('qr', { ...response.data.data, invitado });
      } else {
        toast.error('Error al obtener QR');
        closeModal('qr');
      }
    } catch {
      toast.error('Error al obtener QR');
      closeModal('qr');
    } finally {
      setLoadingQR(false);
    }
  }, [eventoId, openModal, closeModal, toast]);

  const handleDescargarQR = useCallback(() => {
    const qrData = getModalData('qr');
    if (!qrData?.qr) return;
    const link = document.createElement('a');
    link.href = qrData.qr;
    link.download = `qr-${qrData.invitado.nombre.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getModalData]);

  const handleDescargarQRMasivo = useCallback(async () => {
    toast.info('Generando ZIP con todos los QR...');
    try {
      const response = await eventosDigitalesApi.descargarQRMasivo(eventoId);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${evento.slug}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('QR descargados exitosamente');
    } catch {
      toast.error('Error al descargar QR');
    }
  }, [eventoId, evento?.slug, toast]);

  const parseCSV = useCallback((text) => {
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
  }, []);

  const handleImportarCSV = useCallback(async () => {
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
  }, [csvText, parseCSV, importarInvitados, eventoId, toast]);

  const handleExportarCSV = useCallback(async () => {
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
  }, [exportarInvitados, eventoId, evento?.slug, toast]);

  // ==================== RENDER ====================

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
                <InvitadoTableRow
                  key={inv.id}
                  invitado={inv}
                  mostrarQR={mostrarQR}
                  eventoSlug={evento.slug}
                  onEdit={handleEditar}
                  onDelete={handleEliminar}
                  onCopyLink={handleCopyLink}
                  onViewQR={handleVerQR}
                />
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
