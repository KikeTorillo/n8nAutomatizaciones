/**
 * ====================================================================
 * PROFESIONALES PAGE
 * ====================================================================
 *
 * Migrado a ListadoCRUDPage - Ene 2026
 * - ViewModes para tabla/tarjetas
 * - Navegación a rutas (sin FormDrawer)
 *
 * Reducción: 432 → ~290 LOC (-33%)
 * ====================================================================
 */

import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus, Search, Filter, X, Users,
  LayoutGrid, LayoutList, Download
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  ListadoCRUDPage,
  Modal,
  ViewTabs,
} from '@/components/ui';
import ProfesionalesPageLayout from '@/components/profesionales/ProfesionalesPageLayout';
import ProfesionalesList from '@/components/profesionales/ProfesionalesList';
import HorariosProfesionalModal from '@/components/profesionales/HorariosProfesionalModal';
import ServiciosProfesionalModal from '@/components/profesionales/ServiciosProfesionalModal';
import { useProfesionales, ESTADOS_LABORALES } from '@/hooks/personas';
import { useDepartamentos } from '@/hooks/personas';
import { useToast, useExportCSV, useFilters } from '@/hooks/utils';
import { ProfesionalesStatsGrid, ProfesionalesAlerta } from './components';

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  activo: '',
  estado: '',
  departamento_id: '',
};

/**
 * Vista de tarjetas usando ProfesionalesList
 */
function ProfesionalesCardsView({
  items, pagination, isLoading, onPageChange, handlers
}) {
  const navigate = useNavigate();
  return (
    <ProfesionalesList
      profesionales={items}
      pagination={pagination}
      viewMode="cards"
      isLoading={isLoading}
      onVerDetalle={(p) => navigate(`/profesionales/${p.id}`)}
      onDelete={(p) => handlers?.onDelete?.(p)}
      onGestionarHorarios={(p) => handlers?.openModal?.('horarios', p)}
      onGestionarServicios={(p) => handlers?.openModal?.('servicios', p)}
      onPageChange={onPageChange}
    />
  );
}

/**
 * Vista de tabla usando ProfesionalesList
 */
function ProfesionalesTableView({
  items, pagination, isLoading, onPageChange, handlers
}) {
  const navigate = useNavigate();
  return (
    <ProfesionalesList
      profesionales={items}
      pagination={pagination}
      viewMode="table"
      isLoading={isLoading}
      onVerDetalle={(p) => navigate(`/profesionales/${p.id}`)}
      onDelete={(p) => handlers?.onDelete?.(p)}
      onGestionarHorarios={(p) => handlers?.openModal?.('horarios', p)}
      onGestionarServicios={(p) => handlers?.openModal?.('servicios', p)}
      onPageChange={onPageChange}
    />
  );
}

/**
 * Página principal de gestión de profesionales
 */
function ProfesionalesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { exportCSV } = useExportCSV();

  // Filtros con persistencia
  const {
    filtros,
    filtrosQuery,
    hasFiltrosActivos,
    filtrosActivos,
    setFiltro,
    limpiarFiltros,
  } = useFilters(INITIAL_FILTERS, { moduloId: 'profesionales.lista' });

  // Departamentos para filtros
  const { data: departamentos = [] } = useDepartamentos({ activo: true });

  // Exportar CSV
  const handleExportarCSV = useCallback((profesionales) => {
    if (!profesionales || profesionales.length === 0) return;

    const datosExportar = profesionales.map(p => ({
      nombre: p.nombre_completo || '',
      email: p.email || '',
      telefono: p.telefono || '',
      departamento: p.departamento_nombre || '',
      puesto: p.puesto_nombre || '',
      estado: p.estado || '',
      fecha_contratacion: p.fecha_contratacion ? format(new Date(p.fecha_contratacion), 'dd/MM/yyyy') : '',
    }));

    exportCSV(datosExportar, [
      { key: 'nombre', header: 'Nombre' },
      { key: 'email', header: 'Email' },
      { key: 'telefono', header: 'Teléfono' },
      { key: 'departamento', header: 'Departamento' },
      { key: 'puesto', header: 'Puesto' },
      { key: 'estado', header: 'Estado' },
      { key: 'fecha_contratacion', header: 'Fecha Contratación' },
    ], `profesionales_${format(new Date(), 'yyyyMMdd')}`);
  }, [exportCSV]);

  // ViewModes
  const viewModes = useMemo(() => [
    { id: 'cards', label: 'Tarjetas', icon: LayoutGrid, component: ProfesionalesCardsView },
    { id: 'table', label: 'Tabla', icon: LayoutList, component: ProfesionalesTableView },
  ], []);

  return (
    <ListadoCRUDPage
      // Layout
      title="Lista de Profesionales"
      icon={Users}
      PageLayout={ProfesionalesPageLayout}

      // Data
      useListQuery={(params) => useProfesionales({
        page: params.pagina,
        limit: params.limite,
        busqueda: filtrosQuery.busqueda || undefined,
        activo: filtrosQuery.activo === '' ? undefined : filtrosQuery.activo === 'true',
        estado: filtrosQuery.estado || undefined,
        departamento_id: filtrosQuery.departamento_id ? parseInt(filtrosQuery.departamento_id, 10) : undefined,
      })}
      dataKey="profesionales"

      // No usamos tabla nativa (usamos ProfesionalesList)
      columns={[]}
      useCustomTable

      // ViewModes
      viewModes={viewModes}
      defaultViewMode="cards"

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="profesionales.lista"
      limit={20}

      // Extra Modals
      extraModals={{
        horarios: {
          component: HorariosProfesionalModal,
          mapData: (data) => ({ profesional: data }),
        },
        servicios: {
          component: ServiciosProfesionalModal,
          mapData: (data) => ({ profesional: data }),
        },
      }}

      // Actions
      actions={({ items }) => (
        <>
          <Button variant="outline" onClick={() => handleExportarCSV(items)} disabled={!items?.length}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button onClick={() => navigate('/profesionales/nuevo')}>
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Profesional</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </>
      )}
      showNewButton={false}

      // Stats y Alerta antes de tabla
      renderBeforeTable={({ items, paginacion, openModal }) => (
        <>
          <ProfesionalesStatsGrid
            profesionales={items}
            total={paginacion?.total ?? 0}
            className="mb-6"
          />
          <ProfesionalesAlerta
            profesionales={items}
            onAsignarServicios={(p) => openModal('servicios', p)}
          />
        </>
      )}

      // Custom filters
      renderFilters={({ resetPage }) => (
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={filtros.busqueda}
                onChange={(e) => { setFiltro('busqueda', e.target.value); resetPage(); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visible
                </label>
                <Select
                  value={filtros.activo}
                  onChange={(e) => { setFiltro('activo', e.target.value); resetPage(); }}
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado Laboral
                </label>
                <Select
                  value={filtros.estado}
                  onChange={(e) => { setFiltro('estado', e.target.value); resetPage(); }}
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(ESTADOS_LABORALES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <Select
                  value={filtros.departamento_id}
                  onChange={(e) => { setFiltro('departamento_id', e.target.value); resetPage(); }}
                >
                  <option value="">Todos los departamentos</option>
                  {departamentos.map((depto) => (
                    <option key={depto.id} value={depto.id}>{depto.nombre}</option>
                  ))}
                </Select>
              </div>
            </div>
            {hasFiltrosActivos && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => { limpiarFiltros(); resetPage(); }}>
                  <X className="w-4 h-4 mr-1" />
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
}

export default ProfesionalesPage;
