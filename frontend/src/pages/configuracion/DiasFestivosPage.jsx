import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Download,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle,
  Loader2,
} from 'lucide-react';

import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select
} from '@/components/ui';
import { ConfigPageHeader, ConfigEmptyState } from '@/components/configuracion';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';
import { useBloqueos, useCrearBloqueo, useEliminarBloqueo } from '@/hooks/agendamiento';
import { useTiposBloqueo } from '@/hooks/agendamiento';
import {
  FERIADOS_LATAM,
  PAISES_DISPONIBLES,
  prepararFeriadosParaImportacion,
  obtenerInfoPais,
} from '@/data/feriados-latam';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página de Días Festivos
 *
 * Reutiliza infraestructura de bloqueos con tipo_bloqueo = 'feriado'
 */
function DiasFestivosPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Estado para filtros
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [busqueda, setBusqueda] = useState('');
  const [paisSeleccionado, setPaisSeleccionado] = useState('');

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    importar: { isOpen: false },
    delete: { isOpen: false, data: null },
  });

  // Obtener tipo de bloqueo 'feriado'
  const { data: tiposData } = useTiposBloqueo();
  const tipoFeriado = tiposData?.tipos?.find(t => t.codigo === 'feriado');

  // Obtener bloqueos de tipo feriado
  const { data: bloqueosData, isLoading } = useBloqueos({
    tipo_bloqueo_id: tipoFeriado?.id,
    fecha_inicio: `${anioSeleccionado}-01-01`,
    fecha_fin: `${anioSeleccionado}-12-31`,
    limite: 100,
  }, {
    enabled: !!tipoFeriado?.id,
  });

  const feriados = bloqueosData?.bloqueos || [];

  // Filtrar por búsqueda
  const feriadosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return feriados;
    const termino = busqueda.toLowerCase();
    return feriados.filter(f =>
      f.titulo?.toLowerCase().includes(termino) ||
      f.descripcion?.toLowerCase().includes(termino)
    );
  }, [feriados, busqueda]);

  // Agrupar por mes
  const feriadosPorMes = useMemo(() => {
    const grupos = {};
    feriadosFiltrados.forEach(feriado => {
      const fecha = parseISO(feriado.fecha_inicio.split('T')[0]);
      const mes = format(fecha, 'MMMM', { locale: es });
      if (!grupos[mes]) {
        grupos[mes] = [];
      }
      grupos[mes].push(feriado);
    });
    return grupos;
  }, [feriadosFiltrados]);

  // Mutations
  const crearMutation = useCrearBloqueo();
  const eliminarMutation = useEliminarBloqueo();

  // Importar feriados de un país
  const handleImportarFeriados = async () => {
    if (!paisSeleccionado || !tipoFeriado) {
      toast.error('Selecciona un país para importar');
      return;
    }

    const feriadosAImportar = prepararFeriadosParaImportacion(paisSeleccionado, anioSeleccionado);
    const paisInfo = obtenerInfoPais(paisSeleccionado);

    let importados = 0;
    let errores = 0;

    for (const feriado of feriadosAImportar) {
      try {
        await crearMutation.mutateAsync({
          ...feriado,
          tipo_bloqueo_id: tipoFeriado.id,
        });
        importados++;
      } catch (error) {
        // Puede fallar si ya existe
        console.warn('Error importando feriado:', error.message);
        errores++;
      }
    }

    queryClient.invalidateQueries(['bloqueos']);

    if (importados > 0) {
      toast.success(`Se importaron ${importados} feriados de ${paisInfo.nombre}`);
    }
    if (errores > 0) {
      toast.warning(`${errores} feriados ya existían o no pudieron importarse`);
    }

    closeModal('importar');
    setPaisSeleccionado('');
  };

  // Eliminar feriado
  const handleEliminarFeriado = async () => {
    const feriadoAEliminar = getModalData('delete');
    if (!feriadoAEliminar) return;

    try {
      await eliminarMutation.mutateAsync(feriadoAEliminar.id);
      toast.success('Feriado eliminado');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar feriado');
    }
  };

  // Años disponibles para selección
  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return [actual - 1, actual, actual + 1, actual + 2].map(a => ({
      value: a.toString(),
      label: a.toString(),
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ConfigPageHeader
        title="Días Festivos"
        subtitle="Feriados nacionales y días no laborables"
        icon={Calendar}
        maxWidth="max-w-6xl"
        actions={
          <Button
            variant="outline"
            onClick={() => openModal('importar')}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Importar
          </Button>
        }
      />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Selector de año */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnioSeleccionado(a => a - 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <Select
                value={anioSeleccionado.toString()}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                options={aniosDisponibles}
                className="w-28"
              />
              <button
                onClick={() => setAnioSeleccionado(a => a + 1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar feriado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {feriadosFiltrados.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Feriados en {anioSeleccionado}
            </div>
          </div>
          {Object.keys(feriadosPorMes).slice(0, 3).map(mes => (
            <div key={mes} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {feriadosPorMes[mes].length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {mes}
              </div>
            </div>
          ))}
        </div>

        {/* Lista de feriados por mes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : feriadosFiltrados.length === 0 ? (
          <ConfigEmptyState
            icon={Calendar}
            title="No hay feriados registrados"
            description="Importa feriados de tu país para comenzar"
            actionLabel="Importar Feriados"
            onAction={() => openModal('importar')}
            isFiltered={!!busqueda}
            filteredTitle="No se encontraron feriados"
            filteredDescription="Intenta con otro término de búsqueda"
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(feriadosPorMes).map(([mes, feriadosMes]) => (
              <div key={mes} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {mes} {anioSeleccionado}
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {feriadosMes.map((feriado) => {
                    const fecha = parseISO(feriado.fecha_inicio.split('T')[0]);
                    const esAutoGenerado = feriado.auto_generado;

                    return (
                      <div
                        key={feriado.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <div className="flex items-center gap-4">
                          {/* Fecha */}
                          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">
                              {format(fecha, 'd')}
                            </span>
                            <span className="text-xs text-red-500 dark:text-red-400 uppercase">
                              {format(fecha, 'EEE', { locale: es })}
                            </span>
                          </div>

                          {/* Info */}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {feriado.titulo}
                            </h4>
                            {feriado.descripcion && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {feriado.descripcion}
                              </p>
                            )}
                            {feriado.es_recurrente && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                                <CheckCircle className="h-3 w-3" />
                                Recurrente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-2">
                          {esAutoGenerado ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Importado
                            </span>
                          ) : (
                            <button
                              onClick={() => openModal('delete', feriado)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Importar */}
      <Modal
        isOpen={isOpen('importar')}
        onClose={() => {
          closeModal('importar');
          setPaisSeleccionado('');
        }}
        title="Importar Feriados"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <Globe className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Importa los feriados nacionales de un país de Latinoamérica para el año {anioSeleccionado}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecciona un país
            </label>
            <Select
              value={paisSeleccionado}
              onChange={(e) => setPaisSeleccionado(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar país...' },
                ...PAISES_DISPONIBLES,
              ]}
            />
          </div>

          {paisSeleccionado && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Vista previa de feriados a importar:
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {FERIADOS_LATAM[paisSeleccionado]?.feriados.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{f.nombre}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {f.fecha.split('-').reverse().join('/')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: <span className="font-medium">{FERIADOS_LATAM[paisSeleccionado]?.feriados.length} feriados</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                closeModal('importar');
                setPaisSeleccionado('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportarFeriados}
              disabled={!paisSeleccionado || crearMutation.isPending}
              isLoading={crearMutation.isPending}
            >
              Importar Feriados
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminarFeriado}
        title="Eliminar Feriado"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={eliminarMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

export default DiasFestivosPage;
