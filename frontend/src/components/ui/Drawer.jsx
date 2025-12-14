import { Drawer as VaulDrawer } from 'vaul';

/**
 * Componente Drawer (Bottom Sheet) para formularios en móvil
 * Basado en Vaul - maneja correctamente el teclado en iOS/Android
 *
 * @param {boolean} isOpen - Estado del drawer
 * @param {function} onClose - Callback para cerrar
 * @param {string} title - Título del drawer
 * @param {string} subtitle - Subtítulo opcional
 * @param {ReactNode} children - Contenido del drawer
 * @param {string} snapPoints - Puntos de snap (default: ['85%'])
 */
function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) {
  return (
    <VaulDrawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <VaulDrawer.Portal>
        {/* Overlay oscuro */}
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/50 z-40" />

        {/* Contenido del Drawer */}
        <VaulDrawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white dark:bg-gray-800 max-h-[96%]"
        >
          {/*
            IMPORTANTE: Estructura recomendada por Vaul
            El padding y overflow deben estar en este div interno
          */}
          <div className="flex flex-col overflow-hidden rounded-t-2xl">
            {/* Handle para arrastrar */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            {title && (
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <VaulDrawer.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </VaulDrawer.Title>
                {subtitle && (
                  <VaulDrawer.Description className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </VaulDrawer.Description>
                )}
              </div>
            )}

            {/* Contenido scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6">
              {children}
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

// Exportar también los subcomponentes de Vaul por si se necesita más control
Drawer.Root = VaulDrawer.Root;
Drawer.Trigger = VaulDrawer.Trigger;
Drawer.Portal = VaulDrawer.Portal;
Drawer.Overlay = VaulDrawer.Overlay;
Drawer.Content = VaulDrawer.Content;
Drawer.Title = VaulDrawer.Title;
Drawer.Description = VaulDrawer.Description;
Drawer.Close = VaulDrawer.Close;

export default Drawer;
