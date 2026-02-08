import { memo } from 'react';
import { CheckCircle, Package } from 'lucide-react';

/**
 * Fila individual de un item de conteo.
 */
const ConteoItemRow = memo(function ConteoItemRow({ item, esEditable, esActivo, onSeleccionar }) {
    return (
        <div
            onClick={() => esEditable && onSeleccionar(item)}
            className={`p-4 ${esEditable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                } ${esActivo ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                        {item.producto_nombre}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {item.producto_sku || '-'}
                        {item.codigo_barras && ` • ${item.codigo_barras}`}
                        {item.ubicacion_codigo && ` • Ubic: ${item.ubicacion_codigo}`}
                    </p>
                </div>

                <div className="flex items-center gap-4 ml-4">
                    {/* Cantidad sistema */}
                    <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sistema</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {item.cantidad_sistema}
                        </p>
                    </div>

                    {/* Cantidad contada */}
                    <div className="text-right min-w-[60px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Contado</p>
                        <p className={`font-medium ${item.estado === 'contado'
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            {item.cantidad_contada ?? '-'}
                        </p>
                    </div>

                    {/* Diferencia */}
                    <div className="text-right min-w-[50px]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dif.</p>
                        {item.estado === 'contado' ? (
                            <p
                                className={`font-medium ${item.diferencia === 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : item.diferencia > 0
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }`}
                            >
                                {item.diferencia > 0 ? '+' : ''}
                                {item.diferencia}
                            </p>
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500">-</p>
                        )}
                    </div>

                    {/* Estado */}
                    <div className="min-w-[80px]">
                        {item.estado === 'pendiente' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                Pendiente
                            </span>
                        ) : item.estado === 'contado' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Contado
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                                Ajustado
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

/**
 * Panel de lista de items del conteo con filtro por estado.
 */
function ConteoDetalleItems({
    items,
    filtro,
    onFiltroChange,
    esEditable,
    itemActivoId,
    onSeleccionarItem,
    estadoConteo,
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Filtros de items */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white">
                    Productos ({items.length})
                </h3>
                <div className="flex gap-2">
                    <select
                        value={filtro}
                        onChange={(e) => onFiltroChange(e.target.value)}
                        className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="todos">Todos</option>
                        <option value="pendientes">Pendientes</option>
                        <option value="contados">Contados</option>
                        <option value="diferencia">Con diferencia</option>
                    </select>
                </div>
            </div>

            {/* Lista de items */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        {estadoConteo === 'borrador'
                            ? 'Inicia el conteo para generar la lista de productos'
                            : 'No hay productos que coincidan con el filtro'}
                    </div>
                ) : (
                    items.map((item) => (
                        <ConteoItemRow
                            key={item.id}
                            item={item}
                            esEditable={esEditable}
                            esActivo={itemActivoId === item.id}
                            onSeleccionar={onSeleccionarItem}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default memo(ConteoDetalleItems);
