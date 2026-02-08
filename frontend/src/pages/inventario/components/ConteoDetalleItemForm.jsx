import { memo } from 'react';
import { XCircle, Minus, Plus, Save } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import { Textarea } from '@/components/ui';

/**
 * Formulario para registrar el conteo de un item activo.
 * Muestra cantidad en sistema, input de cantidad contada con +/-, diferencia y notas.
 */
function ConteoDetalleItemForm({
    itemActivo,
    cantidadInput,
    onCantidadChange,
    onAjustarCantidad,
    notasInput,
    onNotasChange,
    onGuardar,
    onCerrar,
    isLoading,
}) {
    const diferencia = cantidadInput !== '' ? parseInt(cantidadInput) - itemActivo.cantidad_sistema : null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                        {itemActivo.producto_nombre}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {itemActivo.producto_sku || '-'}
                    </p>
                </div>
                <IconButton
                    icon={<XCircle />}
                    label="Cerrar formulario de conteo"
                    variant="ghost"
                    onClick={onCerrar}
                />
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cantidad en Sistema
                    </label>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {itemActivo.cantidad_sistema}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cantidad Contada
                    </label>
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={<Minus />}
                            label="Decrementar cantidad"
                            variant="ghost"
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            onClick={() => onAjustarCantidad(-1)}
                        />
                        <input
                            type="number"
                            value={cantidadInput}
                            onChange={(e) => onCantidadChange(e.target.value)}
                            className="flex-1 text-center text-2xl font-bold py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            min="0"
                        />
                        <IconButton
                            icon={<Plus />}
                            label="Incrementar cantidad"
                            variant="ghost"
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                            onClick={() => onAjustarCantidad(1)}
                        />
                    </div>
                </div>

                {/* Diferencia */}
                {diferencia !== null && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Diferencia
                        </label>
                        <div
                            className={`text-xl font-bold ${
                                diferencia === 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : diferencia > 0
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-red-600 dark:text-red-400'
                            }`}
                        >
                            {diferencia > 0 ? '+' : ''}
                            {diferencia}
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notas (opcional)
                    </label>
                    <Textarea
                        value={notasInput}
                        onChange={(e) => onNotasChange(e.target.value)}
                        placeholder="Observaciones..."
                        rows={2}
                    />
                </div>

                <Button
                    onClick={onGuardar}
                    className="w-full"
                    isLoading={isLoading}
                >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Conteo
                </Button>
            </div>
        </div>
    );
}

export default memo(ConteoDetalleItemForm);
