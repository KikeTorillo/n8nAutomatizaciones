import { useState, useMemo } from 'react';
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
  List,
  LayoutGrid,
  Filter,
  X,
  Tag,
  Building2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Input from '@/components/ui/Input';
import MultiSelect from '@/components/ui/MultiSelect';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import { ViewTabs } from '@/components/ui/ViewTabs';
import { useClientes, useEstadisticasClientes } from '@/hooks/useClientes';
import { useEtiquetas } from '@/hooks/useEtiquetasClientes';
import { useToast } from '@/hooks/useToast';
import WalkInModal from '@/components/clientes/WalkInModal';
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
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('tabla');

  // Estados para filtros (Fase 2 - Ene 2026)
  const [filtroActivo, setFiltroActivo] = useState(''); // '', 'true', 'false'
  const [filtroTipo, setFiltroTipo] = useState(''); // '', 'persona', 'empresa'
  const [filtroMarketing, setFiltroMarketing] = useState(''); // '', 'true', 'false'
  const [filtroEtiquetas, setFiltroEtiquetas] = useState([]); // array de IDs
  const [agruparPor, setAgruparPor] = useState(''); // '', 'tipo', 'activo', 'etiqueta'
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Query de etiquetas disponibles
  const { data: etiquetasDisponibles = [] } = useEtiquetas();

  // Query de clientes con filtros
  const { data, isLoading } = useClientes({
    page,
    limit: 20,
    busqueda,
    activo: filtroActivo || undefined,
    tipo: filtroTipo || undefined,
    marketing_permitido: filtroMarketing || undefined,
    etiqueta_ids: filtroEtiquetas.length > 0 ? filtroEtiquetas : undefined,
  });

  // Query de estadísticas
  const { data: estadisticas } = useEstadisticasClientes();

  // Contar filtros activos
  const filtrosActivos = useMemo(() => {
    let count = 0;
    if (filtroActivo) count++;
    if (filtroTipo) count++;
    if (filtroMarketing) count++;
    if (filtroEtiquetas.length > 0) count++;
    return count;
  }, [filtroActivo, filtroTipo, filtroMarketing, filtroEtiquetas]);

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroActivo('');
    setFiltroTipo('');
    setFiltroMarketing('');
    setFiltroEtiquetas([]);
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

  // Handler para exportar CSV
  const handleExportarCSV = () => {
    if (!data?.clientes || data.clientes.length === 0) {
      toast.error('No hay clientes para exportar');
      return;
    }

    try {
      const headers = [
        'Nombre',
        'Email',
        'Teléfono',
        'Total Citas',
        'Última Cita',
        'Estado',
        'Marketing',
      ];

      const rows = data.clientes.map((c) => [
        c.nombre || '',
        c.email || '',
        c.telefono || '',
        c.total_citas || 0,
        c.ultima_cita ? format(new Date(c.ultima_cita), 'dd/MM/yyyy') : 'Sin citas',
        c.activo ? 'Activo' : 'Inactivo',
        c.marketing_permitido ? 'Sí' : 'No',
      ]);

      // BOM para UTF-8 (Excel)
      const BOM = '\uFEFF';
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_${format(new Date(), 'yyyyMMdd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast.success('Clientes exportados exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar CSV');
    }
  };

  const handleWalkInSuccess = (cita) => {
    toast.success(`Cita walk-in creada exitosamente: ${cita.codigo_cita || 'sin código'}`);
    setWalkInOpen(false);
  };

  const handleNuevoCliente = () => {
    navigate('/clientes/nuevo');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        {/* Header - Mobile First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-6 w-6 sm:h-7 sm:w-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Clientes
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Gestiona tu base de clientes y atención walk-in
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/clientes/etiquetas')}
              aria-label="Gestionar etiquetas"
              className="flex-1 sm:flex-none"
            >
              <Tag className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Etiquetas</span>
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
              onClick={() => setWalkInOpen(true)}
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
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Estadísticas */}
        <StatCardGrid stats={statsConfig} columns={4} className="mb-6" />

        {/* Barra de búsqueda + Filtros + ViewTabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              {/* Primera fila: Search + Botones */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                    aria-label="Buscar clientes"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Botón Filtros */}
                  <Button
                    variant={mostrarFiltros ? 'primary' : 'outline'}
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="relative"
                    aria-label="Mostrar filtros"
                  >
                    <Filter className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filtros</span>
                    {filtrosActivos > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                        {filtrosActivos}
                      </span>
                    )}
                  </Button>

                  {/* Selector Agrupar Por */}
                  <div className="relative">
                    <select
                      value={agruparPor}
                      onChange={(e) => setAgruparPor(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Agrupar por"
                    >
                      <option value="">Sin agrupar</option>
                      <option value="tipo">Por Tipo</option>
                      <option value="activo">Por Estado</option>
                      <option value="etiqueta">Por Etiqueta</option>
                    </select>
                    <Layers className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

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
                        value={filtroActivo}
                        onChange={(e) => {
                          setFiltroActivo(e.target.value);
                          setPage(1);
                        }}
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
                        value={filtroTipo}
                        onChange={(e) => {
                          setFiltroTipo(e.target.value);
                          setPage(1);
                        }}
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
                        value={filtroMarketing}
                        onChange={(e) => {
                          setFiltroMarketing(e.target.value);
                          setPage(1);
                        }}
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
                        value={filtroEtiquetas}
                        onChange={(values) => {
                          setFiltroEtiquetas(values);
                          setPage(1);
                        }}
                        placeholder="Filtrar por etiquetas..."
                        max={5}
                      />
                    </div>
                  </div>

                  {/* Filtros activos chips + botón limpiar */}
                  {filtrosActivos > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Filtros activos:</span>

                      {filtroActivo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Estado: {filtroActivo === 'true' ? 'Activos' : 'Inactivos'}
                          <button
                            onClick={() => setFiltroActivo('')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtroTipo && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Tipo: {filtroTipo === 'persona' ? 'Personas' : 'Empresas'}
                          <button
                            onClick={() => setFiltroTipo('')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtroMarketing && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Marketing: {filtroMarketing === 'true' ? 'Permitido' : 'No permitido'}
                          <button
                            onClick={() => setFiltroMarketing('')}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {filtroEtiquetas.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                          Etiquetas: {filtroEtiquetas.map((id) =>
                            etiquetasDisponibles.find((e) => e.id === id)?.nombre
                          ).filter(Boolean).join(', ') || 'N/A'}
                          <button
                            onClick={() => setFiltroEtiquetas([])}
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
      </div>

      {/* Walk-in Modal */}
      <WalkInModal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSuccess={handleWalkInSuccess}
      />
    </div>
  );
}

export default ClientesPage;
