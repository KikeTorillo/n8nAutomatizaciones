/**
 * Modal para generar nueva liquidacion
 */

import { useState } from 'react';
import { Calculator, Calendar } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useGenerarLiquidacion, usePendienteLiquidar } from '@/hooks/almacen';
import { formatCurrency } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function LiquidacionFormModal({ isOpen, onClose, acuerdos = [] }) {
  const [acuerdoId, setAcuerdoId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [fechaHasta, setFechaHasta] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: pendientes } = usePendienteLiquidar();
  const generarMutation = useGenerarLiquidacion();

  // Obtener info del acuerdo seleccionado
  const acuerdoSeleccionado = acuerdos.find((a) => a.id === parseInt(acuerdoId));
  const pendienteInfo = pendientes?.find((p) => p.acuerdo_id === parseInt(acuerdoId));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!acuerdoId) return;

    generarMutation.mutate(
      {
        acuerdo_id: parseInt(acuerdoId),
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      },
      {
        onSuccess: () => {
          onClose();
          setAcuerdoId('');
        },
      }
    );
  };

  // Presets de fechas
  const handlePreset = (preset) => {
    const today = new Date();
    switch (preset) {
      case 'mes_actual':
        setFechaDesde(format(startOfMonth(today), 'yyyy-MM-dd'));
        setFechaHasta(format(today, 'yyyy-MM-dd'));
        break;
      case 'mes_anterior':
        const mesAnterior = subDays(startOfMonth(today), 1);
        setFechaDesde(format(startOfMonth(mesAnterior), 'yyyy-MM-dd'));
        setFechaHasta(format(endOfMonth(mesAnterior), 'yyyy-MM-dd'));
        break;
      case 'ultimos_30':
        setFechaDesde(format(subDays(today, 30), 'yyyy-MM-dd'));
        setFechaHasta(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Liquidacion" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleccionar acuerdo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Acuerdo de Consignacion <span className="text-red-500">*</span>
          </label>
          <select
            value={acuerdoId}
            onChange={(e) => setAcuerdoId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Seleccionar acuerdo...</option>
            {acuerdos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.folio} - {a.proveedor_nombre || a.proveedor_razon_social}
              </option>
            ))}
          </select>
        </div>

        {/* Info del acuerdo */}
        {acuerdoSeleccionado && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Proveedor:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {acuerdoSeleccionado.proveedor_nombre || acuerdoSeleccionado.proveedor_razon_social}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Comision:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {acuerdoSeleccionado.porcentaje_comision}%
                </p>
              </div>
            </div>
            {pendienteInfo && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">Ventas pendientes de liquidar:</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {pendienteInfo.total_unidades} unidades - {formatCurrency(parseFloat(pendienteInfo.subtotal_ventas || 0))}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rango de fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Periodo a Liquidar
          </label>

          {/* Presets */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handlePreset('mes_actual')}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Mes actual
            </button>
            <button
              type="button"
              onClick={() => handlePreset('mes_anterior')}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={() => handlePreset('ultimos_30')}
              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Ultimos 30 dias
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Desde
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Hasta
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Calculator className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5" />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Se calcularan todas las ventas del periodo seleccionado que no hayan sido liquidadas previamente.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!acuerdoId || generarMutation.isPending}
            isLoading={generarMutation.isPending}
            className="flex-1"
          >
            Generar Liquidacion
          </Button>
        </div>
      </form>
    </Modal>
  );
}
