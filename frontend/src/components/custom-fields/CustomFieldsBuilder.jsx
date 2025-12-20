import { useState, useMemo } from 'react';
import {
  useCustomFieldsDefiniciones,
  useCrearCustomFieldDefinicion,
  useActualizarCustomFieldDefinicion,
  useEliminarCustomFieldDefinicion,
  useReordenarCustomFieldDefiniciones,
  CUSTOM_FIELD_TIPOS_DATO,
  CUSTOM_FIELD_ENTIDAD_TIPOS,
  CUSTOM_FIELD_ANCHOS,
} from '@/hooks/useCustomFields';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Search,
  AlertCircle,
} from 'lucide-react';

/**
 * Constructor de campos personalizados
 * Permite a admins crear, editar y ordenar campos personalizados por tipo de entidad
 *
 * @param {string} entidadTipo - Tipo de entidad seleccionado (opcional, para filtrar)
 */
function CustomFieldsBuilder({ entidadTipo: initialEntidadTipo = null }) {
  const { showToast } = useToast();

  // Estado
  const [entidadTipo, setEntidadTipo] = useState(initialEntidadTipo || 'cliente');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Formulario
  const [formData, setFormData] = useState(getFormDataInicial());

  // Queries y mutations
  const { data: definiciones = [], isLoading, refetch } = useCustomFieldsDefiniciones({
    entidad_tipo: entidadTipo,
  });

  const crearMutation = useCrearCustomFieldDefinicion();
  const actualizarMutation = useActualizarCustomFieldDefinicion();
  const eliminarMutation = useEliminarCustomFieldDefinicion();
  const reordenarMutation = useReordenarCustomFieldDefiniciones();

  // Filtrar por busqueda
  const definicionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return definiciones;
    const termino = busqueda.toLowerCase();
    return definiciones.filter(d =>
      d.nombre.toLowerCase().includes(termino) ||
      d.nombre_clave?.toLowerCase().includes(termino) ||
      d.seccion?.toLowerCase().includes(termino)
    );
  }, [definiciones, busqueda]);

  // Agrupar por seccion
  const definicionesPorSeccion = useMemo(() => {
    const grupos = {};
    definicionesFiltradas.forEach(d => {
      const sec = d.seccion || 'Sin seccion';
      if (!grupos[sec]) grupos[sec] = [];
      grupos[sec].push(d);
    });
    return grupos;
  }, [definicionesFiltradas]);

  // Handlers
  function getFormDataInicial() {
    return {
      nombre: '',
      nombre_clave: '',
      descripcion: '',
      tipo_dato: 'texto',
      opciones: [],
      requerido: false,
      placeholder: '',
      tooltip: '',
      seccion: '',
      orden: 0,
      ancho_columnas: 12,
      icono: '',
      visible_en_formulario: true,
      visible_en_listado: false,
      buscable: false,
      longitud_minima: null,
      longitud_maxima: null,
      valor_minimo: null,
      valor_maximo: null,
      patron_regex: '',
      mensaje_error: '',
    };
  }

  function handleNuevo() {
    setEditando(null);
    setFormData({
      ...getFormDataInicial(),
      entidad_tipo: entidadTipo,
      orden: definiciones.length,
    });
    setDrawerOpen(true);
  }

  function handleEditar(definicion) {
    setEditando(definicion);
    setFormData({
      ...definicion,
      opciones: definicion.opciones || [],
    });
    setDrawerOpen(true);
  }

  function handleCerrarDrawer() {
    setDrawerOpen(false);
    setEditando(null);
    setFormData(getFormDataInicial());
  }

  async function handleGuardar() {
    try {
      const data = {
        ...formData,
        entidad_tipo: entidadTipo,
        // Limpiar campos no aplicables segun tipo
        opciones: ['select', 'multiselect'].includes(formData.tipo_dato) ? formData.opciones : undefined,
        longitud_minima: ['texto', 'texto_largo'].includes(formData.tipo_dato) ? formData.longitud_minima : undefined,
        longitud_maxima: ['texto', 'texto_largo'].includes(formData.tipo_dato) ? formData.longitud_maxima : undefined,
        valor_minimo: formData.tipo_dato === 'numero' ? formData.valor_minimo : undefined,
        valor_maximo: formData.tipo_dato === 'numero' ? formData.valor_maximo : undefined,
      };

      if (editando) {
        await actualizarMutation.mutateAsync({ id: editando.id, data });
        showToast('Campo actualizado correctamente', 'success');
      } else {
        await crearMutation.mutateAsync(data);
        showToast('Campo creado correctamente', 'success');
      }

      handleCerrarDrawer();
      refetch();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleEliminar() {
    if (!confirmDelete) return;

    try {
      await eliminarMutation.mutateAsync(confirmDelete.id);
      showToast('Campo eliminado correctamente', 'success');
      setConfirmDelete(null);
      refetch();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleMover(definicion, direccion) {
    const index = definiciones.findIndex(d => d.id === definicion.id);
    const nuevoIndex = direccion === 'up' ? index - 1 : index + 1;

    if (nuevoIndex < 0 || nuevoIndex >= definiciones.length) return;

    const nuevoOrden = definiciones.map((d, i) => {
      if (i === index) return { id: d.id, orden: nuevoIndex };
      if (i === nuevoIndex) return { id: d.id, orden: index };
      return { id: d.id, orden: i };
    });

    try {
      await reordenarMutation.mutateAsync({
        entidadTipo,
        orden: nuevoOrden,
      });
      refetch();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  // Renderizar campo de opciones para select/multiselect
  function renderOpcionesEditor() {
    if (!['select', 'multiselect'].includes(formData.tipo_dato)) return null;

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Opciones
        </label>
        {formData.opciones.map((opcion, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={opcion.value}
              onChange={(e) => {
                const nuevas = [...formData.opciones];
                nuevas[index] = { ...nuevas[index], value: e.target.value };
                setFormData({ ...formData, opciones: nuevas });
              }}
              placeholder="Valor"
              className="flex-1"
            />
            <Input
              value={opcion.label}
              onChange={(e) => {
                const nuevas = [...formData.opciones];
                nuevas[index] = { ...nuevas[index], label: e.target.value };
                setFormData({ ...formData, opciones: nuevas });
              }}
              placeholder="Etiqueta"
              className="flex-1"
            />
            <Input
              type="color"
              value={opcion.color || '#753572'}
              onChange={(e) => {
                const nuevas = [...formData.opciones];
                nuevas[index] = { ...nuevas[index], color: e.target.value };
                setFormData({ ...formData, opciones: nuevas });
              }}
              className="w-12 h-10 p-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const nuevas = formData.opciones.filter((_, i) => i !== index);
                setFormData({ ...formData, opciones: nuevas });
              }}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormData({
              ...formData,
              opciones: [...formData.opciones, { value: '', label: '', color: '#753572' }],
            });
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Agregar opcion
        </Button>
      </div>
    );
  }

  // Renderizar tarjeta de definicion
  function renderDefinicionCard(definicion, index) {
    const tipoDato = CUSTOM_FIELD_TIPOS_DATO.find(t => t.value === definicion.tipo_dato);

    return (
      <div
        key={definicion.id}
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
      >
        {/* Grip para drag */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => handleMover(definicion, 'up')}
            disabled={index === 0}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMover(definicion, 'down')}
            disabled={index === definiciones.length - 1}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {definicion.nombre}
            </span>
            {definicion.requerido && (
              <span className="text-xs text-red-500">*</span>
            )}
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {tipoDato?.label || definicion.tipo_dato}
            </span>
            {!definicion.activo && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                Inactivo
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">{definicion.nombre_clave}</span>
            {definicion.seccion && (
              <span>Seccion: {definicion.seccion}</span>
            )}
            <span className="flex items-center gap-1">
              {definicion.visible_en_formulario ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              Formulario
            </span>
            <span className="flex items-center gap-1">
              {definicion.visible_en_listado ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              Listado
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditar(definicion)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(definicion)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Campos Personalizados
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define campos adicionales para tus entidades
          </p>
        </div>

        <Button onClick={handleNuevo}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo campo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-48">
          <Select
            value={entidadTipo}
            onChange={(e) => setEntidadTipo(e.target.value)}
          >
            {CUSTOM_FIELD_ENTIDAD_TIPOS.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1">
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar campos..."
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Lista de definiciones */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : definicionesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            {busqueda
              ? 'No se encontraron campos con ese criterio'
              : 'No hay campos personalizados definidos para esta entidad'}
          </p>
          {!busqueda && (
            <Button variant="outline" className="mt-4" onClick={handleNuevo}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer campo
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(definicionesPorSeccion).map(([seccion, campos]) => (
            <div key={seccion}>
              {Object.keys(definicionesPorSeccion).length > 1 && (
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {seccion}
                </h4>
              )}
              <div className="space-y-2">
                {campos.map((def, index) => renderDefinicionCard(def, definiciones.findIndex(d => d.id === def.id)))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer de edicion */}
      <Drawer
        isOpen={drawerOpen}
        onClose={handleCerrarDrawer}
        title={editando ? 'Editar campo' : 'Nuevo campo'}
        subtitle={`Para entidad: ${CUSTOM_FIELD_ENTIDAD_TIPOS.find(t => t.value === entidadTipo)?.label}`}
      >
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Numero de documento"
            />
          </div>

          {/* Nombre clave */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre clave
            </label>
            <Input
              value={formData.nombre_clave}
              onChange={(e) => setFormData({ ...formData, nombre_clave: e.target.value })}
              placeholder="Se genera automaticamente"
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Identificador unico para la API. Si se deja vacio, se genera del nombre.
            </p>
          </div>

          {/* Tipo de dato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de dato <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.tipo_dato}
              onChange={(e) => setFormData({ ...formData, tipo_dato: e.target.value, opciones: [] })}
              disabled={!!editando} // No permitir cambiar tipo en edicion
            >
              {CUSTOM_FIELD_TIPOS_DATO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </Select>
            {editando && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                El tipo de dato no se puede cambiar despues de crear el campo
              </p>
            )}
          </div>

          {/* Opciones para select/multiselect */}
          {renderOpcionesEditor()}

          {/* Descripcion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion
            </label>
            <Textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripcion del campo"
              rows={2}
            />
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placeholder
            </label>
            <Input
              value={formData.placeholder}
              onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              placeholder="Texto de ayuda dentro del campo"
            />
          </div>

          {/* Seccion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Seccion
            </label>
            <Input
              value={formData.seccion}
              onChange={(e) => setFormData({ ...formData, seccion: e.target.value })}
              placeholder="Ej: Datos fiscales"
            />
            <p className="text-xs text-gray-500 mt-1">
              Agrupa campos en el formulario
            </p>
          </div>

          {/* Ancho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ancho en formulario
            </label>
            <Select
              value={formData.ancho_columnas}
              onChange={(e) => setFormData({ ...formData, ancho_columnas: parseInt(e.target.value) })}
            >
              {CUSTOM_FIELD_ANCHOS.map(ancho => (
                <option key={ancho.value} value={ancho.value}>
                  {ancho.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Validaciones para texto */}
          {['texto', 'texto_largo'].includes(formData.tipo_dato) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitud minima
                </label>
                <Input
                  type="number"
                  value={formData.longitud_minima || ''}
                  onChange={(e) => setFormData({ ...formData, longitud_minima: e.target.value ? parseInt(e.target.value) : null })}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Longitud maxima
                </label>
                <Input
                  type="number"
                  value={formData.longitud_maxima || ''}
                  onChange={(e) => setFormData({ ...formData, longitud_maxima: e.target.value ? parseInt(e.target.value) : null })}
                  min={1}
                />
              </div>
            </div>
          )}

          {/* Validaciones para numero */}
          {formData.tipo_dato === 'numero' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor minimo
                </label>
                <Input
                  type="number"
                  value={formData.valor_minimo ?? ''}
                  onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valor maximo
                </label>
                <Input
                  type="number"
                  value={formData.valor_maximo ?? ''}
                  onChange={(e) => setFormData({ ...formData, valor_maximo: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.requerido}
                onChange={(e) => setFormData({ ...formData, requerido: e.target.checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Campo requerido</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.visible_en_formulario}
                onChange={(e) => setFormData({ ...formData, visible_en_formulario: e.target.checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Visible en formulario</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.visible_en_listado}
                onChange={(e) => setFormData({ ...formData, visible_en_listado: e.target.checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Visible en listado</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.buscable}
                onChange={(e) => setFormData({ ...formData, buscable: e.target.checked })}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Incluir en busquedas</span>
            </div>
            {editando && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.activo !== false}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Campo activo</span>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCerrarDrawer}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleGuardar}
              disabled={!formData.nombre || crearMutation.isPending || actualizarMutation.isPending}
            >
              {crearMutation.isPending || actualizarMutation.isPending ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Confirmar eliminacion */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleEliminar}
        title="Eliminar campo"
        message={`¿Estas seguro de eliminar el campo "${confirmDelete?.nombre}"? Esta accion no se puede deshacer y se perderan todos los valores guardados.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={eliminarMutation.isPending}
      />
    </div>
  );
}

export default CustomFieldsBuilder;
