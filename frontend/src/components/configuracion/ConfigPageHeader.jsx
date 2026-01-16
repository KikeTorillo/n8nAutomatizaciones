import BackButton from '@/components/ui/BackButton';

/**
 * Header genérico para páginas de configuración
 * Reemplaza el patrón repetido en 12+ páginas
 *
 * @param {Object} props
 * @param {string} props.title - Título principal
 * @param {string} [props.subtitle] - Subtítulo descriptivo
 * @param {React.ElementType} [props.icon] - Icono Lucide opcional
 * @param {string} [props.backTo="/configuracion"] - Ruta de retorno
 * @param {string} [props.backLabel="Configuración"] - Label del botón back
 * @param {React.ReactNode} [props.actions] - Acciones (botones) a la derecha
 * @param {string} [props.maxWidth="max-w-4xl"] - Ancho máximo del contenedor
 */
function ConfigPageHeader({
  title,
  subtitle,
  icon: Icon,
  backTo = '/configuracion',
  backLabel = 'Configuración',
  actions,
  maxWidth = 'max-w-4xl',
}) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {/* Back button - usa componente estándar */}
            <BackButton to={backTo} label={backLabel} />

            {/* Icon + Title */}
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="hidden sm:flex p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfigPageHeader;
