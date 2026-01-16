import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Plus,
  UserPlus,
  Search,
  UserCircle,
  Users,
  UserCheck,
  UserX,
  Mail,
  FileSpreadsheet,
  Upload,
  List,
  LayoutGrid,
  Filter,
  X,
  Tag,
  Building2,
  Layers,
} from 'lucide-react';
import {
  Button,
  Input,
  MultiSelect,
  StatCardGrid,
  ViewTabs
} from '@/components/ui';
import ClientesPageLayout from '@/components/clientes/ClientesPageLayout';
import { useClientes, useEstadisticasClientes } from '@/hooks/useClientes';
import { useEtiquetas } from '@/hooks/useEtiquetasClientes';
import { useToast } from '@/hooks/useToast';
import { useExportCSV } from '@/hooks/useExportCSV';
import { useModalManager } from '@/hooks/useModalManager';
import { useFilters } from '@/hooks/useFilters';
import WalkInModal from '@/components/clientes/WalkInModal';
import ImportarClientesModal from '@/components/clientes/ImportarClientesModal';
import ClientesList from '@/components/clientes/ClientesList';
import ClientesCardsGrid from '@/components/clientes/ClientesCardsGrid';
import EtiquetasBadges from '@/components/clientes/EtiquetasBadges';

/**
 * Página principal de gestión de clientes
 * Ene 2026: Actualizado con patrones UX (StatCardGrid, ViewTabs, Exportar CSV)
 */
function ClientesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { exportCSV } = useExportCSV();
  const [page, setPage] = useState(1);
  const [vistaActiva, setVistaActiva] = useState('tabla');
  const [agruparPor, setAgruparPor] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de modales centralizados con useModalManager
  const {
    openModal,
    closeModal,
    isOpen,
  } = useModalManager({
    walkIn: { isOpen: false },
    importar: { isOpen: false },
  });

  // Filtros con persistencia usando useFilters
  const {
    filtros,
    filtrosQuery,
    filtrosActivos,
    hasFiltrosActivos,
    setFiltro,
    limpiarFiltros: resetFiltros,
  } = useFilters(
    {
      busqueda: '',
      activo: '',
      tipo: '',
      marketing_permitido: '',
      etiqueta_ids: [],
    },
    { moduloId: 'clientes.lista' }
  );

  // Reset page cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [filtrosQuery]);

  // Query de etiquetas disponibles
  const { data: etiquetasDisponibles = [] } = useEtiquetas();

  // Query de clientes con filtros (usando filtrosQuery debounced)
  const { data, isLoading } = useClientes({
    page,
    limit: 20,
    busqueda: filtrosQuery.busqueda || undefined,
    activo: filtrosQuery.activo || undefined,
    tipo: filtrosQuery.tipo || undefined,
    marketing_permitido: filtrosQuery.marketing_permitido || undefined,
    etiqueta_ids: filtrosQuery.etiqueta_ids?.length > 0 ? filtrosQuery.etiqueta_ids : undefined,
  });

  // Query de estadísticas
  const { data: estadisticas } = useEstadisticasClientes();

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    resetFiltros();
    setPage(1);
  };

  // Agrupar clientes (frontend) - solo si hay agrupación activa
  const clientesAgrupados = useMemo(() => {
    if (!agruparPor || !data?.clientes) {
      return null;
    }

    return data.clientes.reduce((grupos, cliente) => {
      let key;

      if (agruparPor === 'tipo') {
        key = cliente.tipo === 'empresa' ? 'Empresas' : 'Personas';
      } else if (agruparPor === 'activo') {
        key = cliente.activo ? 'Activos' : 'Inactivos';
      } else if (agruparPor === 'etiqueta') {
        // Si tiene etiquetas, usar la primera; si no, "Sin etiqueta"
        if (cliente.etiquetas && cliente.etiquetas.length > 0) {
          key = cliente.etiquetas[0].nombre;
        } else {
          key = 'Sin etiqueta';
        }
      } else {
        key = 'Todos';
      }

      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(cliente);
      return grupos;
    }, {});
  }, [data?.clientes, agruparPor]);

  // Configuración de StatCards
  const statsConfig = useMemo(
    () => [
      {
        key: 'total',
        icon: Users,
        label: 'Total Clientes',
        value: estadisticas?.total_clientes || 0,
        color: 'primary',
      },
      {
        key: 'activos',
        icon: UserCheck,
        label: 'Activos',
        value: estadisticas?.clientes_activos || 0,
        color: 'green',
      },
      {
        key: 'marketing',
        icon: Mail,
        label: 'Permiten Marketing',
        value: estadisticas?.clientes_marketing || 0,
        color: 'blue',
      },
      {
        key: 'inactivos',
        icon: UserX,
        label: 'Inactivos',
        value: estadisticas?.clientes_inactivos || 0,
        color: 'yellow',
      },
    ],
    [estadisticas]
  );

  // Configuración de ViewTabs
  const viewTabsConfig = useMemo(
    () => [
      { id: 'tabla', label: 'Tabla', icon: List },
      { id: 'tarjetas', label: 'Tarjetas', icon: LayoutGrid },
    ],
    []
  );

  // Handler para exportar CSV usando hook centralizado
  const handleExportarCSV = () => {
    if (!data?.clientes || data.clientes.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    const datosExportar = data.clientes.map((c) => ({
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
  };

  const handleWalkInSuccess = (cita) => {
    toast.success(`Cita walk-in creada exitosamente: ${cita.codigo_cita || 'sin código'}`);
    closeModal('walkIn');
  };

  const handleNuevoCliente = () => {
    navigate('/clientes/nuevo');
  };

  // Botones de accion para el header usando useModalManager
  const actionButtons = (
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
        onClick={handleExportarCSV}
        disabled={!data?.clientes?.length}
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
  );

  return (
    <ClientesPageLayout
      icon={UserCircle}
      title="Lista de Clientes"
      subtitle={`${data?.pagination?.total || 0} clientes en total`}
      actions={actionButtons}
    >
      {/* Estadisticas */}
      <StatCardGrid stats={statsConfig} columns={4} className="mb-6" />

        {/* Barra de búsqueda + Filtros + ViewTabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Primera fila: Search + Botones */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltro('busqueda', e.target.value)}
                    className="pl-10 h-10 w-full"
                    aria-label="Buscar clientes"
                  />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Botón Filtros */}
                  <Button
                    variant="secondary"
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className={`relative ${mostrarFiltros ? 'ring-2 ring-primary-500' : ''}`}
                    aria-label="Mostrar filtros"
                  >
                    <Filter className={`w-4 h-4 sm:mr-2 ${filtrosActivos > 0 ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                    <span className="hidden sm:inline">Filtros</span>
                    {filtrosActivos > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {filtrosActivos}
                      </span>
                    )}
                  </Button>

                  {/* Separador visual */}
                  <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600" />

                  {/* Selector Agrupar Por */}
                  <div className="relative">
                    <select
                      value={agruparPor}
                      onChange={(e) => setAgruparPor(e.target.value)}
                      className="appearance-none h-10 pl-3 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Agrupar por"
                    >
                      <option value="">Sin agrupar</option>
                      <option value="tipo">Por Tipo</option>
                      <option value="activo">Por Estado</option>
                      <option value="etiqueta">Por Etiqueta</option>
                    </select>
                    <Layers className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Separador visual */}
                  <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600" />

                  {/* ViewTabs */}
                  <ViewTabs
                    tabs={viewTabsConfig}
                    activeTab={vistaActiva}
                    onChange={setVistaActiva}
                    ariaLabel="Cambiar vista de clientes"
                  />
                </div>
              </div>

              {/* Panel de filtros expandible (Fase 2) */}
              {mostrarFiltros && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro Estado */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado
                      </label>
                      <select
                        value={filtros.activo}
                        onChange={(e) => setFiltro('activo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Todos</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                      </select>
                    </div>

                    {/* Filtro Tipo */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo
                      </label>
                      <select
                        value={filtros.tipo}
                        onChange={(e) => setFiltro('tipo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Todos</option>
                        <option value="persona">Personas</option>
                        <option value="empresa">Empresas</option>
                      </select>
                    </div>

                    {/* Filtro Marketing */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Marketing
                      </label>
                      <select
                        value={filtros.marketing_permitido}
                        onChange={(e) => setFiltro('marketing_permitido', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Todos</option>
                        <option value="true">Permiten marketing</option>
                        <option value="false">No permiten</option>
                      </select>
                    </div>

                    {/* Filtro Etiquetas (Multi-select - Fase 3) */}
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
                        onChange={(values) => setFiltro('etiqueta_ids', values)}
                        placeholder="Filtrar por etiquetas..."
                        max={5}
                      />
                    </div>
                  </div>

                  {/* Filtros activos chips + botón limpiar */}
                  {hasFiltrosActivos && (
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>

                      {filtros.activo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Estado: {filtros.activo === 'true' ? 'Activos' : 'Inactivos'}
                          <button
                            onClick={() => setFiltro('activo', '')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtros.tipo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Tipo: {filtros.tipo === 'persona' ? 'Personas' : 'Empresas'}
                          <button
                            onClick={() => setFiltro('tipo', '')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtros.marketing_permitido && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Marketing: {filtros.marketing_permitido === 'true' ? 'Permitido' : 'No permitido'}
                          <button
                            onClick={() => setFiltro('marketing_permitido', '')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtros.etiqueta_ids?.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Etiquetas: {filtros.etiqueta_ids.map((id) =>
                            etiquetasDisponibles.find((e) => e.id === id)?.nombre
                          ).filter(Boolean).join(', ') || 'N/A'}
                          <button
                            onClick={() => setFiltro('etiqueta_ids', [])}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      <button
                        onClick={limpiarFiltros}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Limpiar todos
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contenido según vista */}
          <div className="p-4">
            {/* Vista agrupada */}
            {clientesAgrupados ? (
              <div className="space-y-6">
                {Object.entries(clientesAgrupados).map(([grupo, clientesGrupo]) => (
                  <div key={grupo} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Header del grupo */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {agruparPor === 'tipo' && (
                          <Building2 className={`w-4 h-4 ${grupo === 'Empresas' ? 'text-blue-500' : 'text-purple-500'}`} />
                        )}
                        {agruparPor === 'activo' && (
                          <span className={`w-2 h-2 rounded-full ${grupo === 'Activos' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        )}
                        {agruparPor === 'etiqueta' && (
                          <Tag className="w-4 h-4 text-primary-500" />
                        )}
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {grupo}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({clientesGrupo.length})
                        </span>
                      </div>
                    </div>

                    {/* Contenido del grupo */}
                    <div className="p-4">
                      {vistaActiva === 'tabla' ? (
                        <ClientesList
                          clientes={clientesGrupo}
                          isLoading={false}
                          showPagination={false}
                        />
                      ) : (
                        <ClientesCardsGrid
                          clientes={clientesGrupo}
                          isLoading={false}
                          showPagination={false}
                          onNuevoCliente={handleNuevoCliente}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Paginación global cuando hay agrupación */}
                {data?.pagination && data.pagination.totalPaginas > 1 && (
                  <div className="flex justify-center pt-4">
                    <nav className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Página {page} de {data.pagination.totalPaginas}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.pagination.totalPaginas}
                        onClick={() => setPage(page + 1)}
                      >
                        Siguiente
                      </Button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              // Vista sin agrupación
              <>
                {vistaActiva === 'tabla' ? (
                  <ClientesList
                    clientes={data?.clientes}
                    pagination={data?.pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                  />
                ) : (
                  <ClientesCardsGrid
                    clientes={data?.clientes}
                    pagination={data?.pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                    onNuevoCliente={handleNuevoCliente}
                  />
                )}
              </>
            )}
          </div>
        </div>

      {/* Walk-in Modal usando useModalManager */}
      <WalkInModal
        isOpen={isOpen('walkIn')}
        onClose={() => closeModal('walkIn')}
        onSuccess={handleWalkInSuccess}
      />

      {/* Importar CSV Modal usando useModalManager */}
      <ImportarClientesModal
        isOpen={isOpen('importar')}
        onClose={() => closeModal('importar')}
      />
    </ClientesPageLayout>
  );
}

export default ClientesPage;
