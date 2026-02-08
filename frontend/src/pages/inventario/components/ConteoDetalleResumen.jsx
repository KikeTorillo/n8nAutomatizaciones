import { memo } from 'react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Panel colapsable con resumen del conteo.
 * Muestra totales de productos, pendientes, contados, con/sin diferencia.
 */
function ConteoDetalleResumen({ resumen, mostrar, onToggle }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={onToggle}
            >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resumen
                </h3>
                {mostrar ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
            </div>

            {mostrar && (
                <div className="mt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total productos</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {resumen?.total || 0}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Pendientes</span>
                        <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            {resumen?.pendientes || 0}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Contados</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                            {resumen?.contados || 0}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Con diferencia</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                            {resumen?.con_diferencia || 0}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Sin diferencia</span>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                            {resumen?.sin_diferencia || 0}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(ConteoDetalleResumen);
