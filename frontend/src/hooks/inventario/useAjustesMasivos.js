import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ajustesMasivosApi } from '@/services/api/endpoints';

/**
 * Hooks para gestión de Ajustes Masivos de Inventario (CSV)
 * Ciclo: pendiente → validado → aplicado | con_errores
 */

// ==================== CONSULTAS ====================

/**
 * Hook para listar ajustes masivos con filtros
 * @param {Object} params - Filtros opcionales
 * @param {string} params.estado - pendiente | validado | aplicado | con_errores
 * @param {string} params.fecha_desde - Fecha inicio (YYYY-MM-DD)
 * @param {string} params.fecha_hasta - Fecha fin (YYYY-MM-DD)
 * @param {string} params.folio - Búsqueda por folio
 * @param {number} params.limit - Límite de resultados
 * @param {number} params.offset - Offset para paginación
 */
export function useAjustesMasivos(params = {}) {
    return useQuery({
        queryKey: ['ajustes-masivos', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await ajustesMasivosApi.listar(sanitizedParams);
            return response.data.data || { ajustes: [], totales: {} };
        },
        staleTime: 1000 * 60 * 2, // 2 minutos
    });
}

/**
 * Hook para obtener un ajuste masivo por ID con todos sus items
 * @param {number} id - ID del ajuste masivo
 */
export function useAjusteMasivo(id) {
    return useQuery({
        queryKey: ['ajuste-masivo', id],
        queryFn: async () => {
            const response = await ajustesMasivosApi.obtenerPorId(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: 1000 * 30, // 30 segundos
    });
}

// ==================== MUTACIONES ====================

/**
 * Hook para crear un nuevo ajuste masivo desde items parseados del CSV
 */
export function useCrearAjusteMasivo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ archivo_nombre, items }) => {
            const response = await ajustesMasivosApi.crear({
                archivo_nombre,
                items: items.map((item, index) => ({
                    fila_numero: item.fila_numero || index + 1,
                    sku: item.sku?.trim() || undefined,
                    codigo_barras: item.codigo_barras?.trim() || undefined,
                    cantidad_ajuste: parseInt(item.cantidad_ajuste, 10),
                    motivo: item.motivo?.trim() || undefined,
                })),
            });
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ajustes-masivos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            const errorMessages = {
                400: 'Datos inválidos. Revisa el formato del archivo',
                403: 'No tienes permisos para crear ajustes masivos',
                413: 'El archivo es demasiado grande (máximo 500 filas)',
            };

            const statusCode = error.response?.status;
            throw new Error(errorMessages[statusCode] || 'Error al crear ajuste masivo');
        },
    });
}

/**
 * Hook para validar items de un ajuste masivo
 */
export function useValidarAjusteMasivo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await ajustesMasivosApi.validar(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries(['ajuste-masivo', id]);
            queryClient.invalidateQueries(['ajustes-masivos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al validar ajuste masivo');
        },
    });
}

/**
 * Hook para aplicar los ajustes de inventario
 */
export function useAplicarAjusteMasivo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await ajustesMasivosApi.aplicar(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries(['ajuste-masivo', id]);
            queryClient.invalidateQueries(['ajustes-masivos']);
            // Invalidar datos de inventario afectados
            queryClient.invalidateQueries(['productos']);
            queryClient.invalidateQueries(['movimientos']);
            queryClient.invalidateQueries(['kardex']);
            queryClient.invalidateQueries(['stock-critico']);
            queryClient.invalidateQueries(['valor-inventario']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al aplicar ajustes');
        },
    });
}

/**
 * Hook para cancelar un ajuste masivo
 */
export function useCancelarAjusteMasivo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await ajustesMasivosApi.cancelar(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries(['ajuste-masivo', id]);
            queryClient.invalidateQueries(['ajustes-masivos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al cancelar ajuste masivo');
        },
    });
}

/**
 * Hook para descargar la plantilla CSV
 */
export function useDescargarPlantillaAjustes() {
    return useMutation({
        mutationFn: async () => {
            const response = await ajustesMasivosApi.descargarPlantilla();

            // response.data ya es un Blob (por responseType: 'blob')
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_ajustes_masivos.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        },
        onError: (error) => {
            throw new Error('Error al descargar plantilla');
        },
    });
}

// ==================== CONSTANTES ====================

export const ESTADOS_AJUSTE_MASIVO = {
    PENDIENTE: 'pendiente',
    VALIDADO: 'validado',
    APLICADO: 'aplicado',
    CON_ERRORES: 'con_errores',
};

export const ESTADOS_AJUSTE_MASIVO_CONFIG = {
    [ESTADOS_AJUSTE_MASIVO.PENDIENTE]: {
        label: 'Pendiente',
        color: 'gray',
        badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
    [ESTADOS_AJUSTE_MASIVO.VALIDADO]: {
        label: 'Validado',
        color: 'primary',
        badgeClass: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    },
    [ESTADOS_AJUSTE_MASIVO.APLICADO]: {
        label: 'Aplicado',
        color: 'green',
        badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    [ESTADOS_AJUSTE_MASIVO.CON_ERRORES]: {
        label: 'Con Errores',
        color: 'yellow',
        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
};

export const ESTADOS_ITEM_AJUSTE = {
    PENDIENTE: 'pendiente',
    VALIDO: 'valido',
    ERROR: 'error',
    APLICADO: 'aplicado',
};

export const ESTADOS_ITEM_AJUSTE_CONFIG = {
    [ESTADOS_ITEM_AJUSTE.PENDIENTE]: {
        label: 'Pendiente',
        color: 'gray',
        badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
    [ESTADOS_ITEM_AJUSTE.VALIDO]: {
        label: 'Válido',
        color: 'primary',
        badgeClass: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    },
    [ESTADOS_ITEM_AJUSTE.ERROR]: {
        label: 'Error',
        color: 'red',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    [ESTADOS_ITEM_AJUSTE.APLICADO]: {
        label: 'Aplicado',
        color: 'green',
        badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
};

// ==================== UTILIDADES CSV ====================

/**
 * Parsea el contenido de un archivo CSV a array de objetos
 * @param {string} csvContent - Contenido del CSV
 * @returns {{ items: Array, errores: Array }}
 */
export function parsearCSVAjustes(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
        return { items: [], errores: [{ fila: 0, mensaje: 'El archivo está vacío o solo tiene encabezados' }] };
    }

    // Parsear encabezados
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['sku', 'codigo_barras', 'cantidad_ajuste'];
    const hasRequiredHeaders = requiredHeaders.some(h => headers.includes(h));

    if (!hasRequiredHeaders) {
        return {
            items: [],
            errores: [{ fila: 0, mensaje: 'Encabezados inválidos. Se requiere al menos: sku o codigo_barras, y cantidad_ajuste' }]
        };
    }

    const items = [];
    const errores = [];

    // Mapear índices de columnas
    const colIndex = {
        sku: headers.indexOf('sku'),
        codigo_barras: headers.indexOf('codigo_barras'),
        cantidad_ajuste: headers.indexOf('cantidad_ajuste'),
        motivo: headers.indexOf('motivo'),
    };

    // Parsear filas de datos
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const fila_numero = i + 1;

        const sku = colIndex.sku >= 0 ? values[colIndex.sku]?.trim() : '';
        const codigo_barras = colIndex.codigo_barras >= 0 ? values[colIndex.codigo_barras]?.trim() : '';
        const cantidad_str = colIndex.cantidad_ajuste >= 0 ? values[colIndex.cantidad_ajuste]?.trim() : '';
        const motivo = colIndex.motivo >= 0 ? values[colIndex.motivo]?.trim() : '';

        // Validaciones básicas
        if (!sku && !codigo_barras) {
            errores.push({ fila: fila_numero, mensaje: 'Se requiere SKU o código de barras' });
            continue;
        }

        const cantidad_ajuste = parseInt(cantidad_str.replace(/[+]/g, ''), 10);
        if (isNaN(cantidad_ajuste) || cantidad_ajuste === 0) {
            errores.push({ fila: fila_numero, mensaje: 'Cantidad inválida (debe ser número distinto de 0)' });
            continue;
        }

        items.push({
            fila_numero,
            sku: sku || undefined,
            codigo_barras: codigo_barras || undefined,
            cantidad_ajuste,
            motivo: motivo || undefined,
        });
    }

    return { items, errores };
}

/**
 * Parsea una línea CSV respetando comillas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}
