/**
 * ====================================================================
 * CREAR SITIO MODAL - Website Editor
 * ====================================================================
 * Modal para crear un nuevo sitio web desde cero.
 * Permite configurar nombre, slug y descripción inicial.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { useState, useEffect, memo } from 'react';
import { Globe2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CrearSitioModal - Modal para crear sitio web
 *
 * @param {Object} props
 * @param {Function} props.onCrear - Callback al crear (recibe datos del form)
 * @param {Function} props.onCancelar - Callback al cancelar
 * @param {boolean} props.isLoading - Estado de carga durante creación
 */
function CrearSitioModal({ onCrear, onCancelar, isLoading }) {
  const [form, setForm] = useState({
    nombre_sitio: '',
    slug: '',
    descripcion: '',
  });
  const [slugManual, setSlugManual] = useState(false);

  // Auto-generar slug desde nombre
  useEffect(() => {
    if (!slugManual && form.nombre_sitio) {
      const slug = form.nombre_sitio
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.nombre_sitio, slugManual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre_sitio.trim() || !form.slug.trim()) {
      toast.error('Nombre y URL son requeridos');
      return;
    }
    onCrear(form);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Crear tu sitio web
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configura los datos básicos de tu sitio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del sitio *
            </label>
            <input
              type="text"
              value={form.nombre_sitio}
              onChange={(e) =>
                setForm({ ...form, nombre_sitio: e.target.value })
              }
              placeholder="Mi Negocio"
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL del sitio *
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 text-sm">
                nexo.com/sitio/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm({
                    ...form,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  });
                }}
                placeholder="mi-negocio"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Solo letras, números y guiones
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción de tu negocio..."
              rows={3}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancelar}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear sitio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(CrearSitioModal);
