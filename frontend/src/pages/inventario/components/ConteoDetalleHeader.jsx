import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Play,
    CheckCircle,
    XCircle,
    Save,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import {
    ESTADOS_CONTEO_CONFIG,
    TIPOS_CONTEO_LABELS,
} from '@/hooks/inventario';

/**
 * Header del detalle de conteo.
 * Muestra folio, estado, acciones principales y barra de progreso.
 */
function ConteoDetalleHeader({
    conteo,
    puedeIniciar,
    puedeCompletar,
    puedeAplicarAjustes,
    puedeCancelar,
    onOpenModal,
}) {
    const navigate = useNavigate();

    const config = ESTADOS_CONTEO_CONFIG[conteo.estado] || ESTADOS_CONTEO_CONFIG.borrador;
    const porcentaje = conteo.resumen?.total > 0
        ? Math.round((conteo.resumen.contados / conteo.resumen.total) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <IconButton
                            icon={<ArrowLeft />}
                            label="Volver a conteos"
                            variant="ghost"
                            onClick={() => navigate('/inventario/conteos')}
                        />
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {conteo.folio}
                                </h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.badgeClass}`}>
                                    {config.label}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {TIPOS_CONTEO_LABELS[conteo.tipo_conteo] || conteo.tipo_conteo}
                                {conteo.sucursal_nombre && ` • ${conteo.sucursal_nombre}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {puedeIniciar && (
                            <Button onClick={() => onOpenModal('iniciar')}>
                                <Play className="h-4 w-4 mr-1" />
                                Iniciar Conteo
                            </Button>
                        )}

                        {puedeCompletar && (
                            <Button onClick={() => onOpenModal('completar')}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Completar
                            </Button>
                        )}

                        {puedeAplicarAjustes && (
                            <Button onClick={() => onOpenModal('aplicarAjustes')}>
                                <Save className="h-4 w-4 mr-1" />
                                Aplicar Ajustes
                            </Button>
                        )}

                        {puedeCancelar && (
                            <Button
                                variant="outline"
                                onClick={() => onOpenModal('cancelar')}
                                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30"
                            >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500 dark:text-gray-400">
                            Progreso: {conteo.resumen?.contados || 0} de {conteo.resumen?.total || 0} productos
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {porcentaje}%
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-600 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ConteoDetalleHeader);
