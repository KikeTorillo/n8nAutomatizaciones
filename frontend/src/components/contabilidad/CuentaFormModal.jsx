import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';

// Opciones de tipo de cuenta (solo con valor)
const TIPO_OPTIONS = [
  { value: 'activo', label: 'Activo' },
  { value: 'pasivo', label: 'Pasivo' },
  { value: 'capital', label: 'Capital' },
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'orden', label: 'Orden' },
];

const NATURALEZA_OPTIONS = [
  { value: 'deudora', label: 'Deudora' },
  { value: 'acreedora', label: 'Acreedora' },
];

/**
 * Modal para crear/editar cuenta contable
 * @param {Object} props
 * @param {boolean} props.open - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.cuenta - Cuenta a editar (null para crear)
 * @param {Function} props.onSave - Callback al guardar
 * @param {boolean} props.isLoading - Si está guardando
 */
export default function CuentaFormModal({ open, onClose, cuenta, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    tipo: 'activo',
    naturaleza: 'deudora',
    cuenta_padre_id: null,
    codigo_sat: '',
    afectable: true,
    activo: true,
  });

  // Reset form cuando cambia la cuenta
  useEffect(() => {
    if (cuenta?.id) {
      // Editar cuenta existente
      setFormData({
        codigo: cuenta.codigo || '',
        nombre: cuenta.nombre || '',
        tipo: cuenta.tipo || 'activo',
        naturaleza: cuenta.naturaleza || 'deudora',
        cuenta_padre_id: cuenta.cuenta_padre_id || null,
        codigo_sat: cuenta.codigo_sat || '',
        afectable: cuenta.afectable ?? true,
        activo: cuenta.activo ?? true,
      });
    } else if (cuenta?.cuenta_padre_id) {
      // Nueva subcuenta
      setFormData({
        codigo: cuenta.cuenta_padre?.codigo ? `${cuenta.cuenta_padre.codigo}.` : '',
        nombre: '',
        tipo: cuenta.cuenta_padre?.tipo || 'activo',
        naturaleza: cuenta.cuenta_padre?.naturaleza || 'deudora',
        cuenta_padre_id: cuenta.cuenta_padre_id,
        codigo_sat: '',
        afectable: true,
        activo: true,
      });
    } else {
      // Nueva cuenta root
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'activo',
        naturaleza: 'deudora',
        cuenta_padre_id: null,
        codigo_sat: '',
        afectable: true,
        activo: true,
      });
    }
  }, [cuenta]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={cuenta?.id ? 'Editar Cuenta' : 'Nueva Cuenta'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Código *"
            placeholder="Ej: 1.1.01"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            required
          />
          <Input
            label="Código SAT"
            placeholder="Ej: 102"
            value={formData.codigo_sat}
            onChange={(e) => setFormData({ ...formData, codigo_sat: e.target.value })}
          />
        </div>

        <Input
          label="Nombre *"
          placeholder="Nombre de la cuenta"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo *"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            options={TIPO_OPTIONS}
            required
          />
          <Select
            label="Naturaleza *"
            value={formData.naturaleza}
            onChange={(e) => setFormData({ ...formData, naturaleza: e.target.value })}
            options={NATURALEZA_OPTIONS}
            required
          />
        </div>

        <div className="flex gap-6">
          <Checkbox
            label="Cuenta afectable"
            description="Permite registrar movimientos contables"
            checked={formData.afectable}
            onChange={(e) => setFormData({ ...formData, afectable: e.target.checked })}
          />
          <Checkbox
            label="Activa"
            checked={formData.activo}
            onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Guardando...' : cuenta?.id ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
