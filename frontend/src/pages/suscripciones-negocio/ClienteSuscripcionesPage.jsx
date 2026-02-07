/**
 * ====================================================================
 * PÁGINA: SUSCRIPCIONES DE CLIENTES (Customer Billing)
 * ====================================================================
 * Página para administrar suscripciones de clientes propios.
 *
 * Funcionalidades:
 * - Ver tokens de checkout generados
 * - Crear nuevos links de checkout para clientes
 * - Cancelar tokens pendientes
 * - Copiar links al portapapeles
 *
 * @module pages/suscripciones-negocio/ClienteSuscripcionesPage
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Users,
  Plus,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

// Componentes UI
import { BasePageLayout } from '@/components/ui/templates';
import { Button, Badge, LoadingSpinner, SearchInput, Pagination, EmptyState } from '@/components/ui';
import { DataTable } from '@/components/ui/organisms';
import { StatCardGrid } from '@/components/ui';

// Hooks
import {
  useCheckoutTokens,
  useCancelarCheckoutToken,
  ESTADO_TOKEN_LABELS,
  ESTADO_TOKEN_COLORS,
  ESTADOS_TOKEN,
} from '@/hooks/suscripciones-negocio';

// Componentes locales
import { CrearSuscripcionClienteDrawer } from '@/components/suscripciones-negocio';

// Utils
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

/**
 * Página de Suscripciones de Clientes
 */
function ClienteSuscripcionesPage() {
  const navigate = useNavigate();

  // Estado local
  const [page, setPage] = useState(1);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  // Queries
  const {
    data: tokensData,
    isLoading,
    error,
    refetch,
  } = useCheckoutTokens({
    page,
    limit: 20,
    estado: estadoFilter || undefined,
  });

  // Mutations
  const cancelarMutation = useCancelarCheckoutToken();

  // Handlers
  const handleCopyLink = useCallback(async (token) => {
    const url = `${window.location.origin}/checkout/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      toast.error('Error al copiar el link');
    }
  }, []);

  const handleCancelar = useCallback(async (tokenId) => {
    try {
      await cancelarMutation.mutateAsync(tokenId);
      toast.success('Token cancelado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cancelar token');
    }
  }, [cancelarMutation]);

  const handleOpenCheckout = useCallback((token) => {
    window.open(`/checkout/${token}`, '_blank');
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    setDrawerOpen(false);
    refetch();
  }, [refetch]);

  // Estadísticas para StatCardGrid
  const statsCards = useMemo(() => {
    const items = tokensData?.items || [];
    const pendientes = items.filter(t => t.estado === ESTADOS_TOKEN.PENDIENTE).length;
    const usados = items.filter(t => t.estado === ESTADOS_TOKEN.USADO).length;
    const total = tokensData?.paginacion?.total || items.length;

    return [
      {
        key: 'pendientes',
        label: 'Links Pendientes',
        value: pendientes,
        icon: Clock,
        color: 'blue',
      },
      {
        key: 'usados',
        label: 'Pagos Completados',
        value: usados,
        icon: CheckCircle,
        color: 'green',
      },
      {
        key: 'total',
        label: 'Total Generados',
        value: total,
        icon: LinkIcon,
        color: 'purple',
      },
    ];
  }, [tokensData]);

  // Columnas de la tabla
  const columns = useMemo(() => [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {row.cliente_nombre}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {row.cliente_email}
          </p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {row.plan_nombre}
        </span>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      render: (row) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          ${parseFloat(row.precio_calculado).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {row.moneda}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge color={ESTADO_TOKEN_COLORS[row.estado] || 'gray'}>
          {ESTADO_TOKEN_LABELS[row.estado] || row.estado}
        </Badge>
      ),
    },
    {
      key: 'expira',
      header: 'Expira',
      render: (row) => {
        if (row.estado !== ESTADOS_TOKEN.PENDIENTE) return '-';

        const expiraEn = new Date(row.expira_en);
        const ahora = new Date();
        const expirado = expiraEn < ahora;

        return (
          <span className={expirado ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}>
            {formatDistanceToNow(expiraEn, { addSuffix: true, locale: es })}
          </span>
        );
      },
    },
    {
      key: 'creado',
      header: 'Creado',
      render: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {format(new Date(row.creado_en), 'dd/MM/yyyy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.estado === ESTADOS_TOKEN.PENDIENTE && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyLink(row.token)}
                title="Copiar link"
              >
                {copiedToken === row.token ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenCheckout(row.token)}
                title="Abrir checkout"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelar(row.id)}
                disabled={cancelarMutation.isPending}
                title="Cancelar"
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.estado === ESTADOS_TOKEN.USADO && row.suscripcion_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/suscripciones-negocio/suscripciones/${row.suscripcion_id}`)}
              title="Ver suscripción"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ], [handleCopyLink, handleOpenCheckout, handleCancelar, cancelarMutation.isPending, copiedToken, navigate]);

  // Filtros de estado
  const estadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: ESTADOS_TOKEN.PENDIENTE, label: 'Pendientes' },
    { value: ESTADOS_TOKEN.USADO, label: 'Usados' },
    { value: ESTADOS_TOKEN.EXPIRADO, label: 'Expirados' },
    { value: ESTADOS_TOKEN.CANCELADO, label: 'Cancelados' },
  ];

  // Render
  if (error) {
    return (
      <BasePageLayout
        title="Suscripciones de Clientes"
        subtitle="Administra las suscripciones de tus clientes"
        icon={Users}
      >
        <EmptyState
          icon={XCircle}
          title="Error al cargar"
          description={error.message || 'No se pudieron cargar los datos'}
          action={<Button onClick={() => refetch()}>Reintentar</Button>}
        />
      </BasePageLayout>
    );
  }

  return (
    <BasePageLayout
      title="Suscripciones de Clientes"
      subtitle="Genera links de pago para que tus clientes se suscriban"
      icon={Users}
      actions={
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Suscripción
        </Button>
      }
    >
      {/* Stats */}
      <StatCardGrid stats={statsCards} columns={3} className="mb-6" />

      {/* Filtros */}
      <div className="mb-4 flex gap-4">
        <select
          value={estadoFilter}
          onChange={(e) => {
            setEstadoFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          {estadoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : !tokensData?.items?.length ? (
        <EmptyState
          icon={LinkIcon}
          title="No hay links de checkout"
          description="Crea tu primer link de checkout para que un cliente pueda suscribirse"
          action={
            <Button onClick={() => setDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Link de Checkout
            </Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tokensData.items}
            keyExtractor={(row) => row.id}
          />

          {/* Paginación */}
          {tokensData.paginacion && tokensData.paginacion.paginas > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={tokensData.paginacion.paginas}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Drawer para crear suscripción */}
      <CrearSuscripcionClienteDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
      />
    </BasePageLayout>
  );
}

export default ClienteSuscripcionesPage;
