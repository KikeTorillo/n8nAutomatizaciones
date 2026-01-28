/**
 * ====================================================================
 * CLIENTES PAGE
 * ====================================================================
 *
 * Migrado a ListadoCRUDPage - Ene 2026
 * - Eliminada agrupación frontend (simplificación arquitectónica)
 * - ViewModes para tabla/tarjetas
 *
 * Reducción: 600 → ~305 LOC (-49%)
 * ====================================================================
 */

import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus,
  UserPlus,
  Search,
  UserCircle,
  FileSpreadsheet,
  Upload,
  List,
  LayoutGrid,
  Filter,
  X,
} from 'lucide-react';
import {
  Button,
  Input,
  MultiSelect,
  ListadoCRUDPage,
} from '@/components/ui';
import ClientesPageLayout from '@/components/clientes/ClientesPageLayout';
import { useClientes } from '@/hooks/personas';
import { useEtiquetas } from '@/hooks/personas';
import { useToast, useExportCSV, useFilters, usePagination } from '@/hooks/utils';
import WalkInModal from '@/components/clientes/WalkInModal';
import ImportarClientesModal from '@/components/clientes/ImportarClientesModal';
import ClienteFormDrawer from '@/components/clientes/ClienteFormDrawer';
import ClientesList from '@/components/clientes/ClientesList';
import ClientesCardsGrid from '@/components/clientes/ClientesCardsGrid';
import { ClientesStatsGrid } from './components';

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  activo: '',
  tipo: '',
  marketing_permitido: '',
  etiqueta_ids: [],
};

/**
 * Configuración de ViewModes
 */
const VIEW_MODES = [
  { id: 'table', label: 'Tabla', icon: List },
  { id: 'tarjetas', label: 'Tarjetas', icon: LayoutGrid },
];

/**
 * Vista de tabla para clientes
 */
function ClientesTableView({ items, isLoading, pagination, onPageChange }) {
  return (
    <ClientesList
      clientes={items}
      pagination={pagination}
      isLoading={isLoading}
      onPageChange={onPageChange}
    />
  );
}

/**
 * Vista de tarjetas para clientes
 * Nota: onNuevoCliente se maneja desde el boton del header
 */
function ClientesCardsView({ items, isLoading, pagination, onPageChange }) {
  return (
    <ClientesCardsGrid
      clientes={items}
      pagination={pagination}
      isLoading={isLoading}
      onPageChange={onPageChange}
    />
  );
}

/**
 * Página principal de gestión de clientes
 */
function ClientesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { exportCSV } = useExportCSV();

  // Estado para drawer de nuevo cliente
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtros con persistencia
  const {
    filtros,
    filtrosQuery,
    filtrosActivos,
    hasFiltrosActivos,
    setFiltro,
    limpiarFiltros: resetFiltros,
  } = useFilters(INITIAL_FILTERS, { moduloId: 'clientes.lista' });

  // Etiquetas disponibles (useEtiquetas retorna { etiquetas: [], paginacion: {} })
  const { data: etiquetasData } = useEtiquetas();
  const etiquetasDisponibles = etiquetasData?.etiquetas || [];

  // Handler para exportar CSV
  const handleExportarCSV = useCallback((clientes) => {
    if (!clientes || clientes.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    const datosExportar = clientes.map((c) => ({
      nombre: c.nombre || '',
      email: c.email || '',
      telefono: c.telefono || '',
      total_citas: c.total_citas || 0,
      ultima_cita: c.ultima_cita ? format(new Date(c.ultima_cita), 'dd/MM/yyyy') : 'Sin citas',
      estado: c.activo ? 'Activo' : 'Inactivo',
      marketing: c.marketing_permitido ? 'Sí' : 'No',
    }));

    exportCSV(datosExportar, [
      { key: 'nombre', header: 'Nombre' },
      { key: 'email', header: 'Email' },
      { key: 'telefono', header: 'Teléfono' },
      { key: 'total_citas', header: 'Total Citas' },
      { key: 'ultima_cita', header: 'Última Cita' },
      { key: 'estado', header: 'Estado' },
      { key: 'marketing', header: 'Marketing' },
    ], `clientes_${format(new Date(), 'yyyyMMdd')}`);
  }, [exportCSV, toast]);

  const handleWalkInSuccess = useCallback((cita) => {
    toast.success(`Cita walk-in creada exitosamente: ${cita.codigo_cita || 'sin código'}`);
  }, [toast]);

  // Handler para abrir drawer de nuevo cliente
  const handleNuevoCliente = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  // ViewModes con componentes custom
  const viewModes = useMemo(() => [
    {
      ...VIEW_MODES[0],
      component: ClientesTableView,
    },
    {
      ...VIEW_MODES[1],
      component: ClientesCardsView,
    },
  ], []);

  return (
    <>
    <ListadoCRUDPage
      // Layout
      title="Lista de Clientes"
      icon={UserCircle}
      PageLayout={ClientesPageLayout}

      // Data
      useListQuery={(params) => useClientes({
        page: params.pagina,
        limit: params.limite,
        busqueda: filtrosQuery.busqueda || undefined,
        activo: filtrosQuery.activo || undefined,
        tipo: filtrosQuery.tipo || undefined,
        marketing_permitido: filtrosQuery.marketing_permitido || undefined,
        etiqueta_ids: filtrosQuery.etiqueta_ids?.length > 0 ? filtrosQuery.etiqueta_ids : undefined,
      })}
      dataKey="clientes"

      // No usamos delete (navegamos a detalle)
      useDeleteMutation={null}
      onRowClick={(cliente) => navigate(`/clientes/${cliente.id}`)}

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="clientes.lista"
      limit={20}

      // ViewModes
      viewModes={viewModes}
      defaultViewMode="table"

      // Extra Modals
      extraModals={{
        walkIn: {
          component: WalkInModal,
          props: { onSuccess: handleWalkInSuccess },
        },
        importar: {
          component: ImportarClientesModal,
        },
      }}

      // Actions
      actions={({ openModal, items }) => (
        <>
          <Button
            variant="secondary"
            onClick={() => openModal('importar')}
            aria-label="Importar clientes desde CSV"
            className="flex-1 sm:flex-none"
          >
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleExportarCSV(items)}
            disabled={!items?.length}
            aria-label="Exportar clientes a CSV"
            className="flex-1 sm:flex-none"
          >
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => openModal('walkIn')}
            aria-label="Registrar cliente walk-in"
            className="flex-1 sm:flex-none"
          >
            <UserPlus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Walk-in</span>
          </Button>

          <Button
            onClick={handleNuevoCliente}
            aria-label="Crear nuevo cliente"
            className="flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </>
      )}
      showNewButton={false}

      // Render estadísticas antes de tabla
      renderBeforeTable={() => <ClientesStatsGrid className="mb-6" />}

      // Custom filters
      renderFilters={({ resetPage }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-4">
          {/* Barra de búsqueda */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
              <Input
                type="text"
                placeholder="Buscar por nombre, teléfono o email..."
                value={filtros.busqueda}
                onChange={(e) => {
                  setFiltro('busqueda', e.target.value);
                  resetPage();
                }}
                className="pl-10 h-10 w-full"
                aria-label="Buscar clientes"
              />
            </div>
          </div>

          {/* Filtros en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                value={filtros.activo}
                onChange={(e) => { setFiltro('activo', e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => { setFiltro('tipo', e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="persona">Personas</option>
                <option value="empresa">Empresas</option>
              </select>
            </div>

            {/* Marketing */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marketing
              </label>
              <select
                value={filtros.marketing_permitido}
                onChange={(e) => { setFiltro('marketing_permitido', e.target.value); resetPage(); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos</option>
                <option value="true">Permiten marketing</option>
                <option value="false">No permiten</option>
              </select>
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Etiquetas
              </label>
              <MultiSelect
                options={etiquetasDisponibles.map((e) => ({
                  value: e.id,
                  label: e.nombre,
                }))}
                value={filtros.etiqueta_ids}
                onChange={(values) => { setFiltro('etiqueta_ids', values); resetPage(); }}
                placeholder="Filtrar por etiquetas..."
                max={5}
              />
            </div>
          </div>

          {/* Chips de filtros activos */}
          {hasFiltrosActivos && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>

              {filtros.activo && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  Estado: {filtros.activo === 'true' ? 'Activos' : 'Inactivos'}
                  <button onClick={() => setFiltro('activo', '')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtros.tipo && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  Tipo: {filtros.tipo === 'persona' ? 'Personas' : 'Empresas'}
                  <button onClick={() => setFiltro('tipo', '')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtros.marketing_permitido && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  Marketing: {filtros.marketing_permitido === 'true' ? 'Permitido' : 'No permitido'}
                  <button onClick={() => setFiltro('marketing_permitido', '')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtros.etiqueta_ids?.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                  Etiquetas: {filtros.etiqueta_ids.map((id) =>
                    etiquetasDisponibles.find((e) => e.id === id)?.nombre
                  ).filter(Boolean).join(', ') || 'N/A'}
                  <button onClick={() => setFiltro('etiqueta_ids', [])} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={() => { resetFiltros(); resetPage(); }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Limpiar todos
              </button>
            </div>
          )}
        </div>
      )}
    />

    {/* Drawer para crear cliente */}
    <ClienteFormDrawer
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      mode="create"
    />
  </>
  );
}

export default ClientesPage;
