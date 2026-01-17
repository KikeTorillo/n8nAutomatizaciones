import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  BackButton,
  Button,
  Input,
  Select
} from '@/components/ui';
import {
  usePeriodosContables,
  useCuentasAfectables,
  useBalanzaComprobacion,
  useLibroMayor,
  useEstadoResultados,
  useBalanceGeneral,
} from '@/hooks/otros';
import { formatCurrency } from '@/lib/utils';
import { format, startOfYear, endOfMonth, startOfMonth } from 'date-fns';

// Tabs de reportes
const REPORTES = [
  { id: 'balanza', label: 'Balanza de Comprobación', icon: TrendingUp },
  { id: 'libro-mayor', label: 'Libro Mayor', icon: BookOpen },
  { id: 'resultados', label: 'Estado de Resultados', icon: DollarSign },
  { id: 'balance', label: 'Balance General', icon: BarChart3 },
];

/**
 * Página de reportes contables
 */
function ReportesContablesPage() {
  const [searchParams] = useSearchParams();

  // Estado
  const hoy = new Date();
  const [reporteActivo, setReporteActivo] = useState('balanza');

  // Filtros por reporte
  const [periodoId, setPeriodoId] = useState(null);
  const [cuentaId, setCuentaId] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(format(startOfYear(hoy), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(hoy), 'yyyy-MM-dd'));
  const [fechaBalance, setFechaBalance] = useState(format(hoy, 'yyyy-MM-dd'));

  // Verificar query param tipo
  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo && REPORTES.some((r) => r.id === tipo)) {
      setReporteActivo(tipo);
    }
  }, [searchParams]);

  // Queries
  const { data: periodos } = usePeriodosContables();
  const { data: cuentas } = useCuentasAfectables();

  // Seleccionar primer período por defecto
  useEffect(() => {
    if (periodos?.length > 0 && !periodoId) {
      const periodoAbierto = periodos.find((p) => p.estado === 'abierto');
      setPeriodoId(periodoAbierto?.id || periodos[0].id);
    }
  }, [periodos, periodoId]);

  // Queries de reportes
  const { data: balanza, isLoading: loadingBalanza } = useBalanzaComprobacion(
    reporteActivo === 'balanza' ? periodoId : null
  );
  const { data: libroMayor, isLoading: loadingLibroMayor } = useLibroMayor(
    reporteActivo === 'libro-mayor' ? cuentaId : null,
    reporteActivo === 'libro-mayor' ? fechaInicio : null,
    reporteActivo === 'libro-mayor' ? fechaFin : null
  );
  const { data: estadoResultados, isLoading: loadingResultados } = useEstadoResultados(
    reporteActivo === 'resultados' ? fechaInicio : null,
    reporteActivo === 'resultados' ? fechaFin : null
  );
  const { data: balanceGeneral, isLoading: loadingBalance } = useBalanceGeneral(
    reporteActivo === 'balance' ? fechaBalance : null
  );

  // Render filtros según reporte
  const renderFiltros = () => {
    switch (reporteActivo) {
      case 'balanza':
        return (
          <div className="flex gap-4 items-end">
            <Select
              label="Período"
              value={periodoId || ''}
              onChange={(e) => setPeriodoId(parseInt(e.target.value))}
              options={[
                { value: '', label: 'Seleccionar período' },
                ...(periodos?.map((p) => ({
                  value: p.id,
                  label: `${p.nombre} (${p.estado})`,
                })) || []),
              ]}
              className="w-64"
            />
          </div>
        );

      case 'libro-mayor':
        return (
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              label="Cuenta"
              value={cuentaId || ''}
              onChange={(e) => setCuentaId(parseInt(e.target.value))}
              options={[
                { value: '', label: 'Seleccionar cuenta' },
                ...(cuentas?.map((c) => ({
                  value: c.id,
                  label: `${c.codigo} - ${c.nombre}`,
                })) || []),
              ]}
              className="w-80"
            />
            <Input
              type="date"
              label="Desde"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              label="Hasta"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-40"
            />
          </div>
        );

      case 'resultados':
        return (
          <div className="flex gap-4 items-end">
            <Input
              type="date"
              label="Fecha inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              label="Fecha fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-40"
            />
          </div>
        );

      case 'balance':
        return (
          <div className="flex gap-4 items-end">
            <Input
              type="date"
              label="Fecha de corte"
              value={fechaBalance}
              onChange={(e) => setFechaBalance(e.target.value)}
              className="w-40"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render contenido del reporte
  const renderReporte = () => {
    switch (reporteActivo) {
      case 'balanza':
        return <ReporteBalanza data={balanza} isLoading={loadingBalanza} />;
      case 'libro-mayor':
        return <ReporteLibroMayor data={libroMayor} isLoading={loadingLibroMayor} />;
      case 'resultados':
        return <ReporteEstadoResultados data={estadoResultados} isLoading={loadingResultados} />;
      case 'balance':
        return <ReporteBalanceGeneral data={balanceGeneral} isLoading={loadingBalance} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton to="/contabilidad" label="Volver a Contabilidad" className="mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes Financieros</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Reportes contables: Balanza, Libro Mayor, Estado de Resultados y Balance General
          </p>
        </div>

        {/* Tabs de reportes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px overflow-x-auto">
              {REPORTES.map((reporte) => {
                const Icon = reporte.icon;
                const isActive = reporteActivo === reporte.id;
                return (
                  <button
                    key={reporte.id}
                    onClick={() => setReporteActivo(reporte.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {reporte.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {renderFiltros()}
          </div>

          {/* Contenido del reporte */}
          <div className="p-4">{renderReporte()}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reporte: Balanza de Comprobación
 */
function ReporteBalanza({ data, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando balanza...</div>;
  }

  if (!data?.cuentas?.length) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No hay datos para mostrar</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Selecciona un período con movimientos contables
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Info del período */}
      <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span className="text-primary-700 dark:text-primary-300 font-medium">{data.periodo?.nombre}</span>
        </div>
        <span
          className={`px-2 py-0.5 text-xs rounded-full ${
            data.cuadra ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400'
          }`}
        >
          {data.cuadra ? 'Cuadrada' : 'Descuadrada'}
        </span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Código
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Cuenta
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Saldo Inicial
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Debe
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Haber
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Saldo Final
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.cuentas.map((cuenta) => (
              <tr key={cuenta.cuenta_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 font-mono text-sm text-gray-600 dark:text-gray-400">{cuenta.codigo}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{cuenta.nombre}</td>
                <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                  {formatCurrency(cuenta.saldo_inicial || 0)}
                </td>
                <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(cuenta.total_debe || 0)}
                </td>
                <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(cuenta.total_haber || 0)}
                </td>
                <td
                  className={`px-4 py-2 text-sm text-right font-bold ${
                    cuenta.saldo_final >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(cuenta.saldo_final || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-gray-900">
            <tr>
              <td colSpan={2} className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                TOTALES
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.totales?.saldo_inicial || 0)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.totales?.total_debe || 0)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.totales?.total_haber || 0)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(data.totales?.saldo_final || 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * Reporte: Libro Mayor
 */
function ReporteLibroMayor({ data, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando libro mayor...</div>;
  }

  if (!data?.cuenta) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Selecciona una cuenta para ver su libro mayor</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info de la cuenta */}
      <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-primary-600 dark:text-primary-400">{data.cuenta.codigo}</span>
            <h3 className="font-bold text-primary-900 dark:text-primary-200">{data.cuenta.nombre}</h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-primary-600 dark:text-primary-400">Saldo Final</span>
            <p
              className={`text-xl font-bold ${
                data.saldo_final >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(data.saldo_final || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {data.movimientos?.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Asiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Concepto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Debe
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Haber
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.movimientos.map((mov, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(mov.fecha), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">#{mov.numero_asiento}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    {mov.concepto}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {mov.debe > 0 ? formatCurrency(mov.debe) : ''}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {mov.haber > 0 ? formatCurrency(mov.haber) : ''}
                  </td>
                  <td
                    className={`px-4 py-2 text-sm text-right font-bold ${
                      mov.saldo_acumulado >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(mov.saldo_acumulado || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                  TOTALES
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(data.totales?.total_debe || 0)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(data.totales?.total_haber || 0)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(data.saldo_final || 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No hay movimientos en el período seleccionado
        </p>
      )}
    </div>
  );
}

/**
 * Reporte: Estado de Resultados (PyG)
 */
function ReporteEstadoResultados({ data, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando estado de resultados...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Selecciona un rango de fechas</p>
      </div>
    );
  }

  const utilidadNeta = data.utilidad_neta || 0;
  const esGanancia = utilidadNeta >= 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Ingresos */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          INGRESOS
        </h3>
        {data.ingresos?.cuentas?.length > 0 ? (
          <div className="space-y-2">
            {data.ingresos.cuentas.map((cuenta, i) => (
              <div key={i} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{cuenta.nombre}</span>
                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(cuenta.saldo)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100">
              <span>Total Ingresos</span>
              <span className="text-green-600 dark:text-green-400">{formatCurrency(data.ingresos.total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin ingresos registrados</p>
        )}
      </div>

      {/* Gastos */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          GASTOS
        </h3>
        {data.gastos?.cuentas?.length > 0 ? (
          <div className="space-y-2">
            {data.gastos.cuentas.map((cuenta, i) => (
              <div key={i} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">{cuenta.nombre}</span>
                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(cuenta.saldo)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-2 px-2 border-t border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-gray-100">
              <span>Total Gastos</span>
              <span className="text-red-600 dark:text-red-400">{formatCurrency(data.gastos.total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sin gastos registrados</p>
        )}
      </div>

      {/* Resultado */}
      <div
        className={`p-4 rounded-lg ${
          esGanancia ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex justify-between items-center">
          <span className={`font-bold text-lg ${esGanancia ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {esGanancia ? 'UTILIDAD NETA' : 'PÉRDIDA NETA'}
          </span>
          <span className={`text-2xl font-bold ${esGanancia ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(Math.abs(utilidadNeta))}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Reporte: Balance General
 */
function ReporteBalanceGeneral({ data, isLoading }) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando balance general...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Selecciona una fecha de corte</p>
      </div>
    );
  }

  // Clases de colores para cada sección (usando clases completas para que Tailwind las detecte)
  const colorClasses = {
    blue: {
      title: 'text-primary-800 dark:text-primary-300',
      total: 'text-primary-600 dark:text-primary-400',
    },
    red: {
      title: 'text-red-800 dark:text-red-300',
      total: 'text-red-600 dark:text-red-400',
    },
    purple: {
      title: 'text-secondary-800 dark:text-secondary-300',
      total: 'text-secondary-600 dark:text-secondary-400',
    },
  };

  const renderSeccion = (titulo, cuentas, total, color) => (
    <div className="mb-6">
      <h3 className={`font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 ${colorClasses[color].title}`}>{titulo}</h3>
      {cuentas?.length > 0 ? (
        <div className="space-y-1">
          {cuentas.map((cuenta, i) => (
            <div key={i} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
              <span className="text-sm text-gray-700 dark:text-gray-300">{cuenta.nombre}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(cuenta.saldo)}</span>
            </div>
          ))}
          <div className={`flex justify-between items-center py-2 px-2 border-t border-gray-200 dark:border-gray-700 font-bold ${colorClasses[color].total}`}>
            <span>Total {titulo}</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Sin registros</p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Columna Izquierda: Activos */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        {renderSeccion('ACTIVOS', data.activos?.cuentas, data.activos?.total, 'blue')}
      </div>

      {/* Columna Derecha: Pasivos y Capital */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          {renderSeccion('PASIVOS', data.pasivos?.cuentas, data.pasivos?.total, 'red')}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          {renderSeccion('CAPITAL', data.capital?.cuentas, data.capital?.total, 'purple')}
        </div>
      </div>

      {/* Ecuación Contable */}
      <div className="md:col-span-2">
        <div
          className={`p-4 rounded-lg ${
            data.ecuacion_contable?.cuadra
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}
        >
          <h4 className="font-bold text-center mb-3 text-gray-900 dark:text-gray-100">Ecuación Contable: Activo = Pasivo + Capital</h4>
          <div className="flex justify-center items-center gap-4 text-lg">
            <span className="font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(data.activos?.total || 0)}
            </span>
            <span className="text-gray-700 dark:text-gray-300">=</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data.pasivos?.total || 0)}
            </span>
            <span className="text-gray-700 dark:text-gray-300">+</span>
            <span className="font-bold text-secondary-600 dark:text-secondary-400">
              {formatCurrency(data.capital?.total || 0)}
            </span>
          </div>
          <p
            className={`text-center mt-2 text-sm ${
              data.ecuacion_contable?.cuadra ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {data.ecuacion_contable?.cuadra
              ? 'La ecuación contable cuadra correctamente'
              : `Diferencia: ${formatCurrency(data.ecuacion_contable?.diferencia || 0)}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportesContablesPage;
