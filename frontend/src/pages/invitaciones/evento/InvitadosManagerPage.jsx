/**
 * InvitadosManagerPage — Tabla de invitados + agregar + importar CSV + filtros RSVP
 */
import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Search, Upload, Download,
  Users, CheckCircle2, Clock, XCircle, Trash2
} from 'lucide-react';
import {
  useInvitados, useCrearInvitado, useEliminarInvitado,
  useImportarInvitados, useExportarInvitados, useEvento
} from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';
import InvitacionesPublicLayout from '../InvitacionesPublicLayout';
import InvitadoForm from './components/InvitadoForm';
import RSVPTracker from './components/RSVPTracker';

const FILTROS_ESTADO = [
  { label: 'Todos', value: '', icono: Users },
  { label: 'Confirmados', value: 'confirmado', icono: CheckCircle2 },
  { label: 'Pendientes', value: 'pendiente', icono: Clock },
  { label: 'Rechazados', value: 'rechazado', icono: XCircle },
];

export default function InvitadosManagerPage() {
  const { id: eventoId } = useParams();
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const { data: eventoData } = useEvento(eventoId);
  const evento = eventoData;

  const params = useMemo(() => ({
    ...(busqueda && { busqueda }),
    ...(filtroEstado && { estado_rsvp: filtroEstado }),
  }), [busqueda, filtroEstado]);

  const { data: invitadosData, isLoading } = useInvitados(eventoId, params);
  const invitados = invitadosData?.invitados || [];

  const crearInvitado = useCrearInvitado();
  const eliminarInvitado = useEliminarInvitado();
  const importarInvitados = useImportarInvitados();
  const exportarInvitados = useExportarInvitados();

  const stats = useMemo(() => {
    const todos = invitadosData?.invitados || [];
    return {
      total_invitados: todos.length,
      total_confirmados: todos.filter(i => i.estado_rsvp === 'confirmado').length,
      total_pendientes: todos.filter(i => !i.estado_rsvp || i.estado_rsvp === 'pendiente').length,
      total_rechazados: todos.filter(i => i.estado_rsvp === 'rechazado').length,
    };
  }, [invitadosData]);

  const handleAgregar = useCallback(async (datos) => {
    try {
      await crearInvitado.mutateAsync({ eventoId, ...datos });
      toast.success('Invitado agregado');
    } catch { /* error manejado por hook */ }
  }, [eventoId, crearInvitado, toast]);

  const handleEliminar = useCallback(async (invitadoId) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    try {
      await eliminarInvitado.mutateAsync({ eventoId, invitadoId });
      toast.success('Invitado eliminado');
    } catch { /* error manejado por hook */ }
  }, [eventoId, eliminarInvitado, toast]);

  const handleImportar = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      await importarInvitados.mutateAsync({ eventoId, formData });
      toast.success('Invitados importados');
    } catch { /* error manejado por hook */ }
    e.target.value = '';
  }, [eventoId, importarInvitados, toast]);

  const handleExportar = useCallback(async () => {
    try {
      const blob = await exportarInvitados.mutateAsync({ eventoId });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invitados-${evento?.nombre || eventoId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* error manejado por hook */ }
  }, [eventoId, exportarInvitados, evento]);

  const ESTADO_BADGE = {
    confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rechazado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <InvitacionesPublicLayout>
      <section className="py-8 bg-white dark:bg-gray-950 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link
            to={`/invitaciones/evento/${eventoId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {evento?.nombre || 'Evento'}
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invitados</h1>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Importar CSV</span>
                    <input type="file" accept=".csv" onChange={handleImportar} className="hidden" />
                  </label>
                  <button
                    onClick={handleExportar}
                    disabled={exportarInvitados.isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                </div>
              </div>

              {/* Agregar */}
              <div className="mb-6">
                <InvitadoForm onSubmit={handleAgregar} isLoading={crearInvitado.isPending} />
              </div>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar invitado..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
                  />
                </div>
                <div className="flex gap-1.5">
                  {FILTROS_ESTADO.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFiltroEstado(f.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filtroEstado === f.value
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabla */}
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto" />
                </div>
              ) : invitados.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {busqueda || filtroEstado ? 'No se encontraron invitados con ese filtro' : 'Aún no tienes invitados. Agrega el primero arriba.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nombre</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">Teléfono</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Estado</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {invitados.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inv.nombre}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{inv.email || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">{inv.telefono || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[inv.estado_rsvp] || ESTADO_BADGE.pendiente}`}>
                              {inv.estado_rsvp || 'pendiente'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleEliminar(inv.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sidebar: Stats */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <RSVPTracker stats={stats} />
            </div>
          </div>
        </div>
      </section>
    </InvitacionesPublicLayout>
  );
}
