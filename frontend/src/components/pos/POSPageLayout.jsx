import BasePageLayout from '@/components/ui/BasePageLayout';
import POSNavTabs from './POSNavTabs';

/**
 * POSPageLayout - Layout wrapper para todas las páginas del módulo POS
 *
 * Usa BasePageLayout con configuración específica de Punto de Venta.
 * Similar a InventarioPageLayout pero para el módulo POS.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono lucide-react para la sección
 * @param {string} props.title - Título de la sección (ej: "Promociones")
 * @param {string} [props.subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [props.actions] - Botones de acción
 * @param {React.ReactNode} props.children - Contenido principal
 * @param {string} [props.className] - Clases adicionales
 * @param {boolean} [props.hideSectionHeader] - Ocultar header de sección
 */
export default function POSPageLayout({
  icon,
  title,
  subtitle,
  actions,
  children,
  className,
  hideSectionHeader = false
}) {
  return (
    <BasePageLayout
      moduleTitle="Punto de Venta"
      moduleDescription="Ventas, promociones y cupones de descuento"
      navTabs={<POSNavTabs />}
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
