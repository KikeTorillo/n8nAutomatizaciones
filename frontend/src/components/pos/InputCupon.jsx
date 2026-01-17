import { useState, useCallback } from 'react';
import { Tag, Check, X, Loader2, Percent, DollarSign, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useValidarCupon } from '@/hooks/pos';

/**
 * Componente para ingresar y validar cupones de descuento en POS
 *
 * Props:
 * - subtotal: number - Subtotal de la venta para calcular descuento
 * - clienteId: number|null - ID del cliente (para validaciones por cliente)
 * - productosIds: number[]|null - IDs de productos (para validaciones por producto)
 * - onCuponAplicado: (cuponData) => void - Callback cuando se aplica un cupón válido
 * - onCuponRemovido: () => void - Callback cuando se quita el cupón
 * - cuponActivo: object|null - Cupón actualmente aplicado
 * - disabled: boolean - Deshabilitar input
 */
export default function InputCupon({
  subtotal = 0,
  clienteId = null,
  productosIds = null,
  onCuponAplicado,
  onCuponRemovido,
  cuponActivo = null,
  disabled = false
}) {
  const [codigoCupon, setCodigoCupon] = useState('');
  const [error, setError] = useState(null);
  const [validando, setValidando] = useState(false);

  const validarCuponMutation = useValidarCupon();

  // Validar y aplicar cupón
  const handleValidarCupon = useCallback(async () => {
    if (!codigoCupon.trim()) {
      setError('Ingresa un código de cupón');
      return;
    }

    if (subtotal <= 0) {
      setError('Agrega productos al carrito primero');
      return;
    }

    setError(null);
    setValidando(true);

    try {
      const resultado = await validarCuponMutation.mutateAsync({
        codigo: codigoCupon.trim(),
        subtotal,
        clienteId,
        productosIds
      });

      if (resultado.valido) {
        // Cupón válido - notificar al padre
        onCuponAplicado?.({
          id: resultado.cupon.id,
          codigo: resultado.cupon.codigo,
          nombre: resultado.cupon.nombre,
          tipo_descuento: resultado.cupon.tipo_descuento,
          valor: resultado.cupon.valor,
          descuento_calculado: resultado.descuento_calculado,
          subtotal_con_descuento: resultado.subtotal_con_descuento
        });
        setCodigoCupon('');
        setError(null);
      } else {
        // Cupón inválido
        setError(resultado.mensaje || 'Cupón no válido');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al validar cupón');
    } finally {
      setValidando(false);
    }
  }, [codigoCupon, subtotal, clienteId, productosIds, validarCuponMutation, onCuponAplicado]);

  // Manejar Enter para validar
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !disabled && !cuponActivo) {
      e.preventDefault();
      handleValidarCupon();
    }
  }, [disabled, cuponActivo, handleValidarCupon]);

  // Quitar cupón
  const handleQuitarCupon = useCallback(() => {
    onCuponRemovido?.();
    setCodigoCupon('');
    setError(null);
  }, [onCuponRemovido]);

  // Si hay cupón activo, mostrar resumen
  if (cuponActivo) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-full">
              {cuponActivo.tipo_descuento === 'porcentaje' ? (
                <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {cuponActivo.codigo}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {cuponActivo.tipo_descuento === 'porcentaje'
                  ? `${cuponActivo.valor}% de descuento`
                  : `$${cuponActivo.valor} de descuento`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              -${cuponActivo.descuento_calculado?.toFixed(2) || '0.00'}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleQuitarCupon}
                className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                title="Quitar cupón"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Input para ingresar código
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={codigoCupon}
            onChange={(e) => {
              setCodigoCupon(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Código de cupón"
            disabled={disabled || validando}
            className="uppercase"
            prefix={<Tag className="h-4 w-4 text-gray-400" />}
            error={error}
          />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleValidarCupon}
          disabled={disabled || validando || !codigoCupon.trim()}
          className="px-3"
        >
          {validando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
