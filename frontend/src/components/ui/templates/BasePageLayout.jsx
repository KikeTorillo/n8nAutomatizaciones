import { memo } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '../molecules/BackButton';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

/**
 * BasePageLayout - Layout base unificado para módulos
 *
 * Estructura: Header módulo → NavTabs → Container → Section Header → Contenido
 * Reemplaza los layouts específicos (Inventario, Profesionales, Clientes, Agendamiento)
 *
 * @param {Object} props
 * @param {string} props.moduleTitle - Título del módulo ("Inventario", "Profesionales", etc.)
 * @param {string} props.moduleDescription - Descripción corta del módulo
 * @param {string} [props.backTo="/home"] - Ruta para el BackButton
 * @param {string} [props.backLabel="Volver al Inicio"] - Texto del BackButton
 * @param {React.ReactNode} props.navTabs - Componente de navegación de tabs del módulo
 * @param {React.ComponentType} [props.sectionIcon] - Icono lucide-react para la sección actual
 * @param {string} props.sectionTitle - Título de la sección (ej: "Productos", "Lista de Citas")
 * @param {string} [props.sectionSubtitle] - Subtítulo o contador (ej: "15 productos en total")
 * @param {React.ReactNode} [props.actions] - Botones de acción (Nuevo, Exportar, etc.)
 * @param {React.ReactNode} props.children - Contenido principal (filtros, tabla, etc.)
 * @param {string} [props.className] - Clases adicionales para el container
 * @param {boolean} [props.hideSectionHeader=false] - Ocultar header de sección (útil para páginas custom)
 */
const BasePageLayout = memo(function BasePageLayout({
  moduleTitle,
  moduleDescription,
  backTo = '/home',
  backLabel = 'Volver al Inicio',
  navTabs,
  sectionIcon: Icon,
  sectionTitle,
  sectionSubtitle,
  actions,
  children,
  className,
  hideSectionHeader = false,
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fijo del módulo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to={backTo} label={backLabel} className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{moduleTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{moduleDescription}</p>
      </div>

      {/* NavTabs del módulo */}
      {navTabs}

      {/* Container principal */}
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {/* Header de sección - Mobile First */}
        {!hideSectionHeader && sectionTitle && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                {Icon && (
                  <Icon className={cn('h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0', SEMANTIC_COLORS.primary.icon)} />
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {sectionTitle}
                  </h2>
                  {sectionSubtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sectionSubtitle}</p>
                  )}
                </div>
              </div>
              {actions && <div className="flex gap-2 sm:gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {children}
      </div>
    </div>
  );
});

BasePageLayout.displayName = 'BasePageLayout';

export { BasePageLayout };
export default BasePageLayout;
