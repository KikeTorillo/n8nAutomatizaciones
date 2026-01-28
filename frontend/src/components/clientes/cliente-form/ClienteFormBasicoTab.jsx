/**
 * ====================================================================
 * TAB BASICO - Cliente Form Drawer
 * ====================================================================
 *
 * Contiene: Foto, Tipo cliente, Datos basicos, Campos empresa
 *
 * Enero 2026
 */

import { memo } from 'react';
import { Controller } from 'react-hook-form';
import { User, Building2, ImageIcon, X, Loader2 } from 'lucide-react';
import { FormGroup, Input, Select } from '@/components/ui';

/**
 * Tab de informacion basica del cliente
 */
const ClienteFormBasicoTab = memo(function ClienteFormBasicoTab({
  register,
  control,
  errors,
  tipoCliente,
  fotoPreview,
  uploadIsPending,
  onFotoChange,
  onEliminarFoto,
}) {
  return (
    <div className="space-y-6">
      {/* Foto del cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <ImageIcon className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Foto del Cliente
        </h3>

        <div className="flex items-start space-x-4">
          {/* Preview de imagen */}
          <div className="flex-shrink-0">
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-full border-2 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={onEliminarFoto}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Input de archivo */}
          <div className="flex-1">
            <label className="block">
              <span className="sr-only">Seleccionar foto</span>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFotoChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 dark:file:bg-primary-900/40 file:text-primary-700 dark:file:text-primary-300
                    hover:file:bg-primary-100 dark:hover:file:bg-primary-900/60
                    cursor-pointer"
                  disabled={uploadIsPending}
                />
                {uploadIsPending && (
                  <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-5 w-5 text-primary-600 dark:text-primary-400 animate-spin" />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Subiendo...</span>
                  </div>
                )}
              </div>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG o WEBP. Maximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Tipo de cliente */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <User className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Tipo de Cliente
        </h3>

        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => field.onChange('persona')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  field.value === 'persona'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">Persona</span>
              </button>
              <button
                type="button"
                onClick={() => field.onChange('empresa')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  field.value === 'empresa'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Building2 className="h-5 w-5" />
                <span className="font-medium">Empresa</span>
              </button>
            </div>
          )}
        />
      </div>

      {/* Campos empresa (solo si tipo = empresa) */}
      {tipoCliente === 'empresa' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Datos Fiscales
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Razon Social" error={errors.razon_social?.message}>
              <Input
                {...register('razon_social')}
                placeholder="Nombre legal de la empresa"
                hasError={!!errors.razon_social}
              />
            </FormGroup>

            <FormGroup label="RFC" error={errors.rfc?.message}>
              <Input
                {...register('rfc')}
                placeholder="XAXX010101000"
                hasError={!!errors.rfc}
                className="uppercase"
              />
            </FormGroup>
          </div>
        </div>
      )}

      {/* Informacion basica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Informacion de Contacto
        </h3>

        <FormGroup label="Nombre completo" error={errors.nombre_completo?.message} required>
          <Input
            {...register('nombre_completo')}
            placeholder={tipoCliente === 'empresa' ? 'Nombre del contacto principal' : 'Nombre y apellidos'}
            hasError={!!errors.nombre_completo}
          />
        </FormGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Telefono" error={errors.telefono?.message} required>
            <Input
              {...register('telefono')}
              placeholder="10 digitos"
              maxLength={10}
              hasError={!!errors.telefono}
            />
          </FormGroup>

          <FormGroup label="Email" error={errors.email?.message}>
            <Input
              {...register('email')}
              type="email"
              placeholder="correo@ejemplo.com"
              hasError={!!errors.email}
            />
          </FormGroup>
        </div>

        {tipoCliente === 'persona' && (
          <FormGroup label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
            <Input
              {...register('fecha_nacimiento')}
              type="date"
              hasError={!!errors.fecha_nacimiento}
            />
          </FormGroup>
        )}
      </div>
    </div>
  );
});

export default ClienteFormBasicoTab;
