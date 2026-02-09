import { useState } from 'react';
import { DollarSign, Lock, FileText } from 'lucide-react';
import { Button, Input, Drawer } from '@/components/ui';
import { useAbrirSesionCaja } from '@/hooks/pos';
import { useToast } from '@/hooks/utils';

/**
 * Modal para abrir sesión de caja
 * Permite ingresar monto inicial y nota de apertura
 */
export default function AperturaCajaModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const [montoInicial, setMontoInicial] = useState('0');
  const [notaApertura, setNotaApertura] = useState('');

  const { success: toastSuccess, error: toastError } = useToast();
  const abrirSesionMutation = useAbrirSesionCaja();

  const handleAbrir = async () => {
    try {
      const sesion = await abrirSesionMutation.mutateAsync({
        monto_inicial: parseFloat(montoInicial) || 0,
        nota_apertura: notaApertura.trim() || undefined
      });

      toastSuccess(`Caja abierta con fondo inicial de $${parseFloat(montoInicial || 0).toFixed(2)}`);

      // Resetear formulario
      setMontoInicial('0');
      setNotaApertura('');

      onSuccess?.(sesion);
      onClose();
    } catch (error) {
      toastError(`Error al abrir caja: ${error.message}`);
    }
  };

  const handleMontoRapido = (monto) => {
    setMontoInicial(monto.toString());
  };

  const footerContent = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={abrirSesionMutation.isPending}
      >
        Cancelar
      </Button>
      <Button
        variant="success"
        size="lg"
        onClick={handleAbrir}
        isLoading={abrirSesionMutation.isPending}
      >
        <Lock className="h-5 w-5 mr-2" />
        Abrir Caja
      </Button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Abrir Caja"
      subtitle="Inicia tu sesión de caja para comenzar a vender"
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-900 dark:text-primary-300">
                Fondo de caja inicial
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-400">
                Ingresa el monto con el que inicias la caja
              </p>
            </div>
          </div>
        </div>

        {/* Monto inicial */}
        <div>
          <Input
            type="number"
            label="Monto inicial"
            prefix="$"
            size="lg"
            value={montoInicial}
            onChange={(e) => setMontoInicial(e.target.value)}
            step="0.01"
            min="0"
            autoFocus
          />

          {/* Botones de monto rápido */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleMontoRapido(0)}
            >
              $0
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleMontoRapido(500)}
            >
              $500
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleMontoRapido(1000)}
            >
              $1,000
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleMontoRapido(2000)}
            >
              $2,000
            </Button>
          </div>
        </div>

        {/* Nota de apertura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <FileText className="inline h-4 w-4 mr-1" />
            Nota de apertura (opcional)
          </label>
          <textarea
            value={notaApertura}
            onChange={(e) => setNotaApertura(e.target.value)}
            placeholder="Ej: Fondo recibido de gerencia"
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footerContent}
        </div>
      </div>
    </Drawer>
  );
}
