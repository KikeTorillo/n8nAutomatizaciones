/**
 * Constantes y utilidades para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */

import { queryKeys } from '@/hooks/config';

// ==================== QUERY KEYS ====================

export const numeroSerieQueryKeys = queryKeys.inventario.numerosSerie;

// ==================== ESTADOS ====================

export const ESTADOS_NUMERO_SERIE = {
    disponible: { label: 'Disponible', color: 'green' },
    reservado: { label: 'Reservado', color: 'yellow' },
    vendido: { label: 'Vendido', color: 'blue' },
    defectuoso: { label: 'Defectuoso', color: 'red' },
    devuelto: { label: 'Devuelto', color: 'purple' },
    transferido: { label: 'Transferido', color: 'gray' },
};

// ==================== ACCIONES ====================

export const ACCIONES_HISTORIAL = {
    entrada: { label: 'Entrada', icon: 'ArrowDownLeft' },
    venta: { label: 'Venta', icon: 'ShoppingCart' },
    devolucion_cliente: { label: 'Devolución Cliente', icon: 'RotateCcw' },
    devolucion_proveedor: { label: 'Devolución Proveedor', icon: 'Truck' },
    transferencia: { label: 'Transferencia', icon: 'ArrowLeftRight' },
    ajuste: { label: 'Ajuste', icon: 'Edit' },
    reserva: { label: 'Reserva', icon: 'Lock' },
    liberacion: { label: 'Liberación', icon: 'Unlock' },
    defectuoso: { label: 'Defectuoso', icon: 'AlertTriangle' },
    reparacion: { label: 'Reparación', icon: 'Wrench' },
    garantia: { label: 'Garantía', icon: 'Shield' },
};

// ==================== UTILIDADES ====================

/**
 * Formatea fecha de vencimiento con estado
 * @param {string|Date} fecha - Fecha de vencimiento
 * @returns {Object|string} - Objeto con text y status, o '-' si no hay fecha
 */
export function formatearFechaVencimiento(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const hoy = new Date();
    const diff = Math.ceil((date - hoy) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    if (diff < 0) return { text: `Vencido (${formatted})`, status: 'error' };
    if (diff <= 7) return { text: `${formatted} (${diff}d)`, status: 'error' };
    if (diff <= 30) return { text: `${formatted} (${diff}d)`, status: 'warning' };
    return { text: formatted, status: 'normal' };
}
