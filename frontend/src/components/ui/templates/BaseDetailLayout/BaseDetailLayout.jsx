import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { DetailHeader } from './DetailHeader';
import { DetailLoadingState } from './DetailLoadingState';
import { DetailNotFoundState } from './DetailNotFoundState';
import StateNavTabs from '../../organisms/state-nav-tabs';

/**
 * BaseDetailLayout - Template para páginas de detalle
 *
 * Layout estandarizado para páginas de detalle con:
 * - Header con navegación, título, badges y acciones
 * - Tabs opcionales
 * - Estados de carga y no encontrado
 *
 * @param {string} backTo - Ruta para volver
 * @param {string} backLabel - Texto del botón volver
 * @param {string} title - Título principal
 * @param {string} subtitle - Subtítulo
 * @param {React.ComponentType} icon - Icono junto al título
 * @param {Array} badges - Badges [{label, variant}]
 * @param {ReactNode} actions - Botones de acción
 * @param {Array} tabs - Configuración de tabs [{id, label, icon}]
 * @param {string} activeTab - ID del tab activo
 * @param {function} onTabChange - Callback (tabId) => void
 * @param {ReactNode} beforeTabs - Contenido antes de los tabs
 * @param {ReactNode} children - Contenido principal
 * @param {boolean} isLoading - Estado de carga
 * @param {Object} error - Objeto de error
 * @param {boolean} notFound - Si el recurso no fue encontrado
 * @param {Object} notFoundConfig - Configuración del estado no encontrado
 * @param {string} className - Clases adicionales
 *
 * @example
 * <BaseDetailLayout
 *   backTo="/clientes"
 *   backLabel="Volver a clientes"
 *   title={cliente.nombre}
 *   subtitle={cliente.email}
 *   icon={UserIcon}
 *   badges={[{ label: 'Activo', variant: 'success' }]}
 *   actions={
 *     <>
 *       <Button onClick={handleEdit}>Editar</Button>
 *       <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
 *     </>
 *   }
 *   tabs={[
 *     { id: 'general', label: 'General', icon: InfoIcon },
 *     { id: 'historial', label: 'Historial', icon: ClockIcon },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   isLoading={isLoading}
 * >
 *   {activeTab === 'general' && <GeneralTab cliente={cliente} />}
 *   {activeTab === 'historial' && <HistorialTab clienteId={cliente.id} />}
 * </BaseDetailLayout>
 */
const BaseDetailLayout = memo(function BaseDetailLayout({
  // Header
  backTo,
  backLabel,
  title,
  subtitle,
  icon,
  badges = [],
  actions,
  // Tabs
  tabs = [],
  activeTab,
  onTabChange,
  // Content
  beforeTabs,
  children,
  // States
  isLoading = false,
  error,
  notFound = false,
  notFoundConfig = {},
  // Styling
  className,
}) {
  // Estado de carga
  if (isLoading) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {backTo && (
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        )}
        <DetailLoadingState />
      </div>
    );
  }

  // Estado no encontrado
  if (notFound || error?.response?.status === 404) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        <DetailNotFoundState config={{ backTo, ...notFoundConfig }} />
      </div>
    );
  }

  // Estado de error genérico
  if (error) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        <DetailNotFoundState
          config={{
            title: 'Error',
            description: error.message || 'Ocurrió un error al cargar los datos.',
            backTo,
            ...notFoundConfig,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      {/* Header */}
      <DetailHeader
        backTo={backTo}
        backLabel={backLabel}
        title={title}
        subtitle={subtitle}
        icon={icon}
        badges={badges}
        actions={actions}
      />

      {/* Before tabs content */}
      {beforeTabs}

      {/* Tabs */}
      {tabs.length > 0 && (
        <div className="mb-6">
          <StateNavTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            sticky={false}
          />
        </div>
      )}

      {/* Main content */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
});

BaseDetailLayout.displayName = 'BaseDetailLayout';

BaseDetailLayout.propTypes = {
  /** Ruta para volver */
  backTo: PropTypes.string,
  /** Texto del botón volver */
  backLabel: PropTypes.string,
  /** Título principal */
  title: PropTypes.string,
  /** Subtítulo */
  subtitle: PropTypes.string,
  /** Icono (componente Lucide) */
  icon: PropTypes.elementType,
  /** Array de badges */
  badges: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    variant: PropTypes.string,
  })),
  /** Botones de acción */
  actions: PropTypes.node,
  /** Configuración de tabs */
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
  })),
  /** ID del tab activo */
  activeTab: PropTypes.string,
  /** Callback cuando cambia el tab */
  onTabChange: PropTypes.func,
  /** Contenido antes de los tabs */
  beforeTabs: PropTypes.node,
  /** Contenido principal */
  children: PropTypes.node,
  /** Estado de carga */
  isLoading: PropTypes.bool,
  /** Objeto de error */
  error: PropTypes.object,
  /** Si el recurso no fue encontrado */
  notFound: PropTypes.bool,
  /** Configuración del estado no encontrado */
  notFoundConfig: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    backLabel: PropTypes.string,
  }),
  /** Clases adicionales */
  className: PropTypes.string,
};

export { BaseDetailLayout };
