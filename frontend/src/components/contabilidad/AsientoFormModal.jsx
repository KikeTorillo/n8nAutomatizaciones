import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useCuentasAfectables } from '@/hooks/useContabilidad';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

// Opciones de tipo de asiento
const TIPO_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'venta_pos', label: 'Venta POS' },
  { value: 'compra', label: 'Compra' },
  { value: 'nomina', label: 'Nomina' },
  { value: 'depreciacion', label: 'Depreciacion' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'cierre', label: 'Cierre' },
];

/**
 * Modal para crear/editar asiento contable
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.asiento - Asiento a editar (null para nuevo)
 * @param {Function} props.onSave - Callback al guardar
 * @param {boolean} props.isLoading - Estado de carga
 */
export default function AsientoFormModal({ isOpen, onClose, asiento, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    concepto: '',
    tipo: 'manual',
    notas: '',
    estado: 'borrador',
    movimientos: [
      { cuenta_id: '', concepto: '', debe: '', haber: '' },
      { cuenta_id: '', concepto: '', debe: '', haber: '' },
    ],
  });

  // Query cuentas afectables
  const { data: cuentas } = useCuentasAfectables();

  // Resetear form cuando cambia el asiento
  useEffect(() => {
    if (asiento?.id) {
      setFormData({
        fecha: asiento.fecha,
        concepto: asiento.concepto || '',
        tipo: asiento.tipo || 'manual',
        notas: asiento.notas || '',
        estado: asiento.estado || 'borrador',
        movimientos:
          asiento.movimientos?.map((m) => ({
            cuenta_id: m.cuenta_id,
            concepto: m.concepto || '',
            debe: m.debe || '',
            haber: m.haber || '',
          })) || [],
      });
    } else {
      setFormData({
        fecha: format(new Date(), 'yyyy-MM-dd'),
        concepto: '',
        tipo: 'manual',
        notas: '',
        estado: 'borrador',
        movimientos: [
          { cuenta_id: '', concepto: '', debe: '', haber: '' },
          { cuenta_id: '', concepto: '', debe: '', haber: '' },
        ],
      });
    }
  }, [asiento, isOpen]);

  // Agregar movimiento
  const addMovimiento = () => {
    setFormData({
      ...formData,
      movimientos: [...formData.movimientos, { cuenta_id: '', concepto: '', debe: '', haber: '' }],
    });
  };

  // Eliminar movimiento
  const removeMovimiento = (index) => {
    if (formData.movimientos.length <= 2) return;
    setFormData({
      ...formData,
      movimientos: formData.movimientos.filter((_, i) => i !== index),
    });
  };

  // Actualizar movimiento
  const updateMovimiento = (index, field, value) => {
    const newMovimientos = [...formData.movimientos];
    newMovimientos[index] = { ...newMovimientos[index], [field]: value };
    setFormData({ ...formData, movimientos: newMovimientos });
  };

  // Calcular totales
  const totalDebe = formData.movimientos.reduce(
    (sum, m) => sum + (parseFloat(m.debe) || 0),
    0
  );
  const totalHaber = formData.movimientos.reduce(
    (sum, m) => sum + (parseFloat(m.haber) || 0),
    0
  );
  const cuadra = Math.abs(totalDebe - totalHaber) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      movimientos: formData.movimientos
        .filter((m) => m.cuenta_id && (m.debe || m.haber))
        .map((m) => ({
          ...m,
          debe: parseFloat(m.debe) || 0,
          haber: parseFloat(m.haber) || 0,
        })),
    };
    onSave(dataToSave);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asiento?.id ? 'Editar Asiento' : 'Nuevo Asiento'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos generales */}
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="date"
            label="Fecha *"
            value={formData.fecha}
            onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            options={TIPO_OPTIONS}
          />
          <Select
            label="Estado"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            options={[
              { value: 'borrador', label: 'Borrador' },
              { value: 'publicado', label: 'Publicado' },
            ]}
          />
        </div>

        <Input
          label="Concepto *"
          placeholder="Descripcion del asiento"
          value={formData.concepto}
          onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
          required
        />

        {/* Movimientos */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Movimientos</label>
            <Button type="button" variant="ghost" size="sm" onClick={addMovimiento}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar linea
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cuenta
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Concepto
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    Debe
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">
                    Haber
                  </th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {formData.movimientos.map((mov, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2">
                      <select
                        value={mov.cuenta_id}
                        onChange={(e) => updateMovimiento(index, 'cuenta_id', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar cuenta</option>
                        {cuentas?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.codigo} - {c.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={mov.concepto}
                        onChange={(e) => updateMovimiento(index, 'concepto', e.target.value)}
                        placeholder="Concepto especifico"
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mov.debe}
                        onChange={(e) => updateMovimiento(index, 'debe', e.target.value)}
                        disabled={!!mov.haber}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={mov.haber}
                        onChange={(e) => updateMovimiento(index, 'haber', e.target.value)}
                        disabled={!!mov.debe}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {formData.movimientos.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMovimiento(index)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    Totales:
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalDebe)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalHaber)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Indicador de cuadre */}
          <div className={`mt-2 px-3 py-2 rounded-lg flex items-center gap-2 ${
            cuadra ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}>
            {cuadra ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">El asiento cuadra correctamente</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Diferencia: {formatCurrency(Math.abs(totalDebe - totalHaber))}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Notas */}
        <Textarea
          label="Notas"
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={2}
          placeholder="Notas adicionales (opcional)"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || (formData.estado === 'publicado' && !cuadra)}
          >
            {isLoading ? 'Guardando...' : asiento?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
