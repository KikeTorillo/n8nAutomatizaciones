import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Save,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  useNotificacionesPreferencias,
  useNotificacionesTipos,
  useActualizarNotificacionesPreferencias,
  NOTIFICACION_CATEGORIAS,
} from '@/hooks/sistema';
import { useToast } from '@/hooks/utils';
import { Button } from '@/components/ui';

/**
 * NotificacionesPreferencias - Configuracion de preferencias de notificacion
 */
function NotificacionesPreferencias() {
  const toast = useToast();
  const [preferenciasLocales, setPreferenciasLocales] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { data: preferenciasData = {}, isLoading: loadingPrefs } = useNotificacionesPreferencias();
  const { data: tiposData = {}, isLoading: loadingTipos } = useNotificacionesTipos();

  // Mutation
  const actualizarPrefs = useActualizarNotificacionesPreferencias();

  // Cargar preferencias iniciales
  useEffect(() => {
    if (Object.keys(preferenciasData).length > 0) {
      // Convertir estructura de preferencias a objeto plano por tipo
      const prefs = {};
      Object.values(preferenciasData).flat().forEach(pref => {
        prefs[pref.tipo] = {
          in_app: pref.in_app,
          email: pref.email,
          push: pref.push || false,
          whatsapp: pref.whatsapp || false,
        };
      });
      setPreferenciasLocales(prefs);
    }
  }, [preferenciasData]);

  const handleToggle = (tipo, canal) => {
    setPreferenciasLocales(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [canal]: !prev[tipo]?.[canal],
      },
    }));
    setHasChanges(true);
  };

  const handleToggleCategoria = (categoria, canal) => {
    const tipos = tiposData[categoria] || [];
    const todosActivos = tipos.every(t => preferenciasLocales[t.tipo]?.[canal]);

    setPreferenciasLocales(prev => {
      const newPrefs = { ...prev };
      tipos.forEach(t => {
        newPrefs[t.tipo] = {
          ...newPrefs[t.tipo],
          [canal]: !todosActivos,
        };
      });
      return newPrefs;
    });
    setHasChanges(true);
  };

  const handleGuardar = async () => {
    // Convertir a formato esperado por la API
    const preferencias = Object.entries(preferenciasLocales).map(([tipo, canales]) => ({
      tipo,
      in_app: canales.in_app ?? true,
      email: canales.email ?? false,
      push: canales.push ?? false,
      whatsapp: canales.whatsapp ?? false,
    }));

    try {
      await actualizarPrefs.mutateAsync(preferencias);
      toast.success('Preferencias actualizadas correctamente');
      setHasChanges(false);
    } catch (error) {
      toast.error(error.message || 'Error al guardar preferencias');
    }
  };

  const isLoading = loadingPrefs || loadingTipos;

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">Cargando preferencias...</p>
      </div>
    );
  }

  const categoriasConTipos = NOTIFICACION_CATEGORIAS.filter(cat => tiposData[cat.value]?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Preferencias de Notificaciones
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura como y cuando quieres recibir notificaciones
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleGuardar}
            isLoading={actualizarPrefs.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        )}
      </div>

      {/* Leyenda de canales */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Bell className="w-4 h-4" />
          <span>En la app</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Mail className="w-4 h-4" />
          <span>Email</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Smartphone className="w-4 h-4" />
          <span>Push (proximamente)</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp (proximamente)</span>
        </div>
      </div>

      {/* Lista por categoria */}
      <div className="space-y-6">
        {categoriasConTipos.map(categoria => {
          const tipos = tiposData[categoria.value] || [];
          const todosInApp = tipos.every(t => preferenciasLocales[t.tipo]?.in_app !== false);
          const todosEmail = tipos.every(t => preferenciasLocales[t.tipo]?.email === true);

          return (
            <div
              key={categoria.value}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header de categoria */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {categoria.label}
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={todosInApp}
                        onChange={() => handleToggleCategoria(categoria.value, 'in_app')}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <Bell className="w-4 h-4 text-gray-500" />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={todosEmail}
                        onChange={() => handleToggleCategoria(categoria.value, 'email')}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <Mail className="w-4 h-4 text-gray-500" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Tipos de notificacion */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tipos.map(tipo => {
                  const prefs = preferenciasLocales[tipo.tipo] || {
                    in_app: tipo.default_in_app,
                    email: tipo.default_email,
                    push: tipo.default_push,
                    whatsapp: false,
                  };

                  return (
                    <div
                      key={tipo.tipo}
                      className="px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tipo.nombre}
                        </p>
                        {tipo.descripcion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {tipo.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {/* In-app */}
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs.in_app !== false}
                            onChange={() => handleToggle(tipo.tipo, 'in_app')}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </label>
                        {/* Email */}
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={prefs.email === true}
                            onChange={() => handleToggle(tipo.tipo, 'email')}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje de exito */}
      {actualizarPrefs.isSuccess && !hasChanges && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>Preferencias guardadas correctamente</span>
        </div>
      )}
    </div>
  );
}

export default NotificacionesPreferencias;
