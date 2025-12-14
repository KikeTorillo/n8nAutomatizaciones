import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe2,
  Plus,
  Eye,
  Save,
  Settings,
  Loader2,
  FileText,
  Palette,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import useWebsiteEditor, { useWebsiteBloques } from '@/hooks/useWebsite';
import Button from '@/components/ui/Button';

// Componentes del editor
import PageManager from './components/PageManager';
import BlockPalette from './components/BlockPalette';
import BlockEditor from './components/BlockEditor';
import ThemeEditor from './components/ThemeEditor';
import PreviewPanel from './components/PreviewPanel';

/**
 * WebsiteEditorPage - Editor visual del sitio web
 * Permite crear y editar páginas con bloques arrastrables
 */
function WebsiteEditorPage() {
  const navigate = useNavigate();

  // Estado del editor
  const [paginaActiva, setPaginaActiva] = useState(null);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [panelActivo, setPanelActivo] = useState('bloques'); // 'bloques' | 'paginas' | 'tema' | 'preview'
  const [mostrarCrearSitio, setMostrarCrearSitio] = useState(false);

  // Hook del editor
  const {
    config,
    paginas,
    tiposBloques,
    isLoading,
    tieneSitio,
    estaPublicado,
    crearConfig,
    actualizarConfig,
    publicarSitio,
    crearPagina,
    actualizarPagina,
    eliminarPagina,
    crearBloque,
    actualizarBloque,
    reordenarBloques,
    duplicarBloque,
    eliminarBloque,
  } = useWebsiteEditor();

  // Bloques de la página activa
  const { data: bloquesData, isLoading: bloquesLoading } = useWebsiteBloques(paginaActiva?.id);
  const bloques = bloquesData || [];

  // Seleccionar primera página al cargar
  useEffect(() => {
    if (paginas.length > 0 && !paginaActiva) {
      const paginaInicio = paginas.find(p => p.es_inicio) || paginas[0];
      setPaginaActiva(paginaInicio);
    }
  }, [paginas, paginaActiva]);

  // Handlers
  const handleCrearSitio = async (datosIniciales) => {
    try {
      await crearConfig.mutateAsync(datosIniciales);
      toast.success('Sitio web creado exitosamente');
      setMostrarCrearSitio(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear sitio');
    }
  };

  const handlePublicar = async () => {
    try {
      await publicarSitio.mutateAsync({
        id: config.id,
        publicar: !estaPublicado
      });
      toast.success(estaPublicado ? 'Sitio despublicado' : 'Sitio publicado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al publicar');
    }
  };

  const handleAgregarBloque = async (tipo) => {
    if (!paginaActiva) {
      toast.error('Selecciona una página primero');
      return;
    }

    try {
      await crearBloque.mutateAsync({
        pagina_id: paginaActiva.id,
        tipo: tipo,
        orden: bloques.length,
      });
      toast.success('Bloque agregado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar bloque');
    }
  };

  const handleActualizarBloque = async (bloqueId, contenido) => {
    try {
      await actualizarBloque.mutateAsync({
        id: bloqueId,
        data: { contenido }
      });
      toast.success('Bloque actualizado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    }
  };

  const handleEliminarBloque = async (bloqueId) => {
    try {
      await eliminarBloque.mutateAsync({
        id: bloqueId,
        paginaId: paginaActiva.id
      });
      setBloqueSeleccionado(null);
      toast.success('Bloque eliminado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando editor...</p>
        </div>
      </div>
    );
  }

  // No tiene sitio creado
  if (!tieneSitio && !mostrarCrearSitio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Inicio
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mi Sitio Web</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea tu página web pública</p>
        </div>

        {/* Empty state */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe2 className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Crea tu sitio web
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Diseña una página web profesional para tu negocio con nuestro editor visual.
              Arrastra y suelta bloques para crear tu sitio en minutos.
            </p>
            <button
              onClick={() => setMostrarCrearSitio(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Crear mi sitio web
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary-700 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">11 tipos de bloques</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hero, servicios, equipo, contacto y más</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Palette className="w-6 h-6 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Personalizable</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Colores, fuentes y estilos a tu gusto</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Globe2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">SEO optimizado</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Meta tags y Open Graph incluidos</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal crear sitio
  if (mostrarCrearSitio) {
    return (
      <CrearSitioModal
        onCrear={handleCrearSitio}
        onCancelar={() => setMostrarCrearSitio(false)}
        isLoading={crearConfig.isPending}
      />
    );
  }

  // Editor principal
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header del editor */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">{config?.nombre_sitio || 'Mi Sitio'}</span>
          </div>
          {/* Status badge */}
          <span className={`px-2 py-1 text-xs rounded-full ${
            estaPublicado
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          }`}>
            {estaPublicado ? 'Publicado' : 'Borrador'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview */}
          <button
            onClick={() => setPanelActivo('preview')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              panelActivo === 'preview'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vista previa</span>
          </button>

          {/* Ver sitio publicado */}
          {estaPublicado && config?.slug && (
            <a
              href={`/sitio/${config.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ver sitio</span>
            </a>
          )}

          {/* Publicar */}
          <button
            onClick={handlePublicar}
            disabled={publicarSitio.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              estaPublicado
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {publicarSitio.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : estaPublicado ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {estaPublicado ? 'Despublicar' : 'Publicar'}
            </span>
          </button>
        </div>
      </header>

      {/* Cuerpo del editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel izquierdo - Navegación */}
        <aside className="w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setPanelActivo('bloques')}
            className={`p-3 rounded-lg transition-colors ${
              panelActivo === 'bloques'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Bloques"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPanelActivo('paginas')}
            className={`p-3 rounded-lg transition-colors ${
              panelActivo === 'paginas'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Páginas"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => setPanelActivo('tema')}
            className={`p-3 rounded-lg transition-colors ${
              panelActivo === 'tema'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="Tema"
          >
            <Palette className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => navigate('/configuracion')}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
        </aside>

        {/* Panel secundario - Contenido según panelActivo */}
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
          {panelActivo === 'bloques' && (
            <BlockPalette
              tiposBloques={tiposBloques}
              onAgregarBloque={handleAgregarBloque}
              disabled={!paginaActiva}
            />
          )}
          {panelActivo === 'paginas' && (
            <PageManager
              paginas={paginas}
              paginaActiva={paginaActiva}
              onSeleccionar={setPaginaActiva}
              onCrear={crearPagina.mutateAsync}
              onActualizar={actualizarPagina.mutateAsync}
              onEliminar={eliminarPagina.mutateAsync}
            />
          )}
          {panelActivo === 'tema' && (
            <ThemeEditor
              config={config}
              onActualizar={(tema) => actualizarConfig.mutateAsync({
                id: config.id,
                data: { tema }
              })}
            />
          )}
          {panelActivo === 'preview' && (
            <PreviewPanel
              config={config}
              pagina={paginaActiva}
              bloques={bloques}
            />
          )}
        </aside>

        {/* Area principal - Editor de bloques */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <BlockEditor
            pagina={paginaActiva}
            bloques={bloques}
            bloqueSeleccionado={bloqueSeleccionado}
            onSeleccionar={setBloqueSeleccionado}
            onActualizar={handleActualizarBloque}
            onEliminar={handleEliminarBloque}
            onDuplicar={(id) => duplicarBloque.mutateAsync(id)}
            onReordenar={(ordenamiento) => reordenarBloques.mutateAsync({
              paginaId: paginaActiva.id,
              ordenamiento
            })}
            isLoading={bloquesLoading}
            tema={config?.tema}
          />
        </main>
      </div>
    </div>
  );
}

/**
 * Modal para crear sitio inicial
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
      setForm(prev => ({ ...prev, slug }));
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crear tu sitio web</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Configura los datos básicos de tu sitio</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del sitio *
            </label>
            <input
              type="text"
              value={form.nombre_sitio}
              onChange={(e) => setForm({ ...form, nombre_sitio: e.target.value })}
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
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                }}
                placeholder="mi-negocio"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Solo letras, números y guiones</p>
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

export default WebsiteEditorPage;
