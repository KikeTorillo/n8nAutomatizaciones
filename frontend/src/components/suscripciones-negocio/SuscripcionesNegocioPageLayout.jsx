import { BasePageLayout } from '@/components/ui';
import SuscripcionesNegocioNavTabs from './SuscripcionesNegocioNavTabs';

/**
 * SuscripcionesNegocioPageLayout - Layout wrapper para todas las páginas del módulo
 *
 * Usa BasePageLayout con configuración específica de Suscripciones-Negocio.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección
 * @param {string} [props.subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 * @param {boolean} [props.hideSectionHeader] - Ocultar header de sección
 */
export default function SuscripcionesNegocioPageLayout({
  icon,
  title,
  subtitle,
  actions,
  children,
  className,
  hideSectionHeader = false,
}) {
  return (
    <BasePageLayout
      moduleTitle="Suscripciones"
      moduleDescription="Gestión de planes y suscripciones de clientes"
      navTabs={<SuscripcionesNegocioNavTabs />}
      sectionIcon={icon}
      sectionTitle={title}
      sectionSubtitle={subtitle}
      actions={actions}
      className={className}
      hideSectionHeader={hideSectionHeader}
    >
      {children}
    </BasePageLayout>
  );
}
