import { Package, ImageIcon, X, Loader2 } from 'lucide-react';
import { FormGroup, Input, Select, Textarea } from '@/components/ui';

/**
 * Tab General del formulario de producto
 * Contiene: Información básica + Imagen
 */
function ProductoFormGeneralTab({
  register,
  errors,
  categorias,
  proveedores,
  imagenPreview,
  uploadIsPending,
  onImagenChange,
  onEliminarImagen,
}) {
  return (
    <>
      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Package className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Información Básica
        </h3>

        <FormGroup label="Nombre del Producto" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            placeholder="Ej: Champú Premium 500ml"
            hasError={!!errors.nombre}
          />
        </FormGroup>

        <FormGroup label="Descripción" error={errors.descripcion?.message}>
          <Textarea
            {...register('descripcion')}
            rows={3}
            placeholder="Descripción detallada del producto"
            hasError={!!errors.descripcion}
          />
        </FormGroup>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="SKU" error={errors.sku?.message}>
            <Input
              {...register('sku')}
              placeholder="Ej: CHAMP-500"
              hasError={!!errors.sku}
            />
          </FormGroup>

          <FormGroup label="Código de Barras" error={errors.codigo_barras?.message}>
            <Input
              {...register('codigo_barras')}
              placeholder="EAN8 o EAN13 (8-13 dígitos)"
              hasError={!!errors.codigo_barras}
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Categoría" error={errors.categoria_id?.message}>
            <Select
              {...register('categoria_id')}
              placeholder="Sin categoría"
              options={categorias.map((categoria) => ({
                value: categoria.id.toString(),
                label: categoria.nombre,
              }))}
              hasError={!!errors.categoria_id}
            />
          </FormGroup>

          <FormGroup label="Proveedor" error={errors.proveedor_id?.message}>
            <Select
              {...register('proveedor_id')}
              placeholder="Sin proveedor"
              options={proveedores.map((proveedor) => ({
                value: proveedor.id.toString(),
                label: proveedor.nombre,
              }))}
              hasError={!!errors.proveedor_id}
            />
          </FormGroup>
        </div>
      </div>

      {/* Imagen del Producto */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <ImageIcon className="h-5 w-5 mr-2 text-pink-600 dark:text-pink-400" />
          Imagen del Producto
        </h3>

        <div className="flex items-start space-x-4">
          {/* Preview de imagen */}
          <div className="flex-shrink-0">
            {imagenPreview ? (
              <div className="relative">
                <img
                  src={imagenPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={onEliminarImagen}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Input de archivo */}
          <div className="flex-1">
            <label className="block">
              <span className="sr-only">Seleccionar imagen</span>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImagenChange}
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
              PNG, JPG o WEBP. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductoFormGeneralTab;
