/**
 * Pagina de Reglas de Reabastecimiento
 * CRUD de reglas para reorden automatico
 * Fecha: 29 Diciembre 2025
 */

import { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Edit2,
  Package,
  Truck,
  FolderTree,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  useReglasReorden,
  useCrearReglaReorden,
  useActualizarReglaReorden,
  useEliminarReglaReorden,
  useRutasOperacion,
} from '@/hooks/useReorden';
import { useProveedores } from '@/hooks/useProveedores';
import { useCategorias } from '@/hooks/useCategorias';
import { useProductos } from '@/hooks/useProductos';
import { Link } from 'react-router-dom';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useModalManager } from '@/hooks/useModalManager';

const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
  { value: 0, label: 'Domingo' },
];

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
];

const TIPOS_ALCANCE = [
  { value: 'producto', label: 'Producto especifico', icon: Package },
  { value: 'categoria', label: 'Categoria completa', icon: FolderTree },
  { value: 'proveedor', label: 'Proveedor', icon: Truck },
  { value: 'todos', label: 'Todos los productos', icon: Package },
];

export default function ReglasReordenPage() {
  const [filtroActivo, setFiltroActivo] = useState('todas');

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  const { data: reglas, isLoading } = useReglasReorden({
    activo: filtroActivo === 'todas' ? undefined : filtroActivo === 'activas'
  });
  const { data: rutas } = useRutasOperacion({ activo: true });
  const { data: proveedoresData } = useProveedores();
  const proveedores = proveedoresData?.proveedores || [];
  const { data: categorias } = useCategorias();
  const { data: productosData } = useProductos({ limit: 100, activo: true });
  const productos = productosData?.productos || [];

  const crearMutation = useCrearReglaReorden();
  const actualizarMutation = useActualizarReglaReorden();
  const eliminarMutation = useEliminarReglaReorden();

  const handleNueva = () => {
    openModal('form', null);
  };

  const handleEditar = (regla) => {
    openModal('form', regla);
  };

  const handleEliminar = (regla) => {
    openModal('delete', regla);
  };

  const confirmDelete = () => {
    const reglaAEliminar = getModalData('delete');
    if (reglaAEliminar) {
      eliminarMutation.mutate(reglaAEliminar.id, {
        onSuccess: () => closeModal('delete'),
      });
    }
  };

  const handleToggleActivo = (regla) => {
    actualizarMutation.mutate({
      id: regla.id,
      data: { activo: !regla.activo },
    });
  };

  const handleSubmit = (data) => {
    const editingRegla = getModalData('form');
    if (editingRegla) {
      actualizarMutation.mutate(
        { id: editingRegla.id, data },
        { onSuccess: () => closeModal('form') }
      );
    } else {
      crearMutation.mutate(data, { onSuccess: () => closeModal('form') });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/inventario/reorden"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Reglas de Reabastecimiento
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configura cuando y como reabastecer productos automaticamente
            </p>
          </div>
        </div>

        <button
          onClick={handleNueva}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Regla
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'activas', label: 'Activas' },
          { id: 'inactivas', label: 'Inactivas' },
        ].map((filtro) => (
          <button
            key={filtro.id}
            onClick={() => setFiltroActivo(filtro.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroActivo === filtro.id
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filtro.label}
          </button>
        ))}
      </div>

      {/* Lista de Reglas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Cargando reglas...
          </div>
        ) : reglas?.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay reglas configuradas</p>
            <p className="mt-1 text-sm">
              Crea una regla para automatizar el reabastecimiento de productos
            </p>
            <button
              onClick={handleNueva}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Regla
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {reglas?.map((regla) => (
              <ReglaCard
                key={regla.id}
                regla={regla}
                onEdit={() => handleEditar(regla)}
                onDelete={() => handleEliminar(regla)}
                onToggle={() => handleToggleActivo(regla)}
                isToggling={actualizarMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer para crear/editar */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Regla' : 'Nueva Regla de Reabastecimiento'}
      >
        <ReglaForm
          regla={getModalData('form')}
          rutas={rutas || []}
          proveedores={proveedores || []}
          categorias={categorias || []}
          productos={productos}
          onSubmit={handleSubmit}
          onCancel={() => closeModal('form')}
          isLoading={crearMutation.isPending || actualizarMutation.isPending}
        />
      </Drawer>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmDelete}
        title="Eliminar Regla"
        message={`¿Estas seguro de eliminar la regla "${getModalData('delete')?.nombre}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

// Componente de tarjeta de regla
function ReglaCard({ regla, onEdit, onDelete, onToggle, isToggling }) {
  const TipoIcon = TIPOS_ALCANCE.find((t) => t.value === regla.tipo_alcance)?.icon || Package;

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              regla.activo
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}
          >
            <TipoIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {regla.nombre}
              </h3>
              {regla.activo ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Activa
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Inactiva
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Alcance: {TIPOS_ALCANCE.find((t) => t.value === regla.tipo_alcance)?.label}
              </span>
              <span>Frecuencia: {FRECUENCIAS.find((f) => f.value === regla.frecuencia)?.label}</span>
              {regla.proveedor_nombre && <span>Proveedor: {regla.proveedor_nombre}</span>}
              {regla.categoria_nombre && <span>Categoria: {regla.categoria_nombre}</span>}
              {regla.producto_nombre && <span>Producto: {regla.producto_nombre}</span>}
            </div>

            {regla.dias_semana_aplicacion?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {regla.dias_semana_aplicacion.map((dia) => (
                  <span
                    key={dia}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                  >
                    {DIAS_SEMANA.find((d) => d.value === dia)?.label?.slice(0, 3)}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>
                Trigger: Stock &le; {regla.stock_minimo_trigger || 'min. producto'}
              </span>
              <span>
                Cantidad: {regla.cantidad_a_ordenar || 'hasta max'}
              </span>
              {regla.lead_time_dias && <span>Lead time: {regla.lead_time_dias} dias</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggle}
            disabled={isToggling}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={regla.activo ? 'Desactivar' : 'Activar'}
          >
            {regla.activo ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Editar"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Formulario de regla
function ReglaForm({ regla, rutas, proveedores, categorias, productos, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: regla?.nombre || '',
    tipo_alcance: regla?.tipo_alcance || 'producto',
    producto_id: regla?.producto_id || '',
    categoria_id: regla?.categoria_id || '',
    proveedor_id: regla?.proveedor_id || '',
    ruta_operacion_id: regla?.ruta_operacion_id || '',
    frecuencia: regla?.frecuencia || 'diario',
    dias_semana_aplicacion: regla?.dias_semana_aplicacion || [],
    stock_minimo_trigger: regla?.stock_minimo_trigger || '',
    cantidad_a_ordenar: regla?.cantidad_a_ordenar || '',
    lead_time_dias: regla?.lead_time_dias || '',
    prioridad: regla?.prioridad || 1,
    activo: regla?.activo ?? true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiaToggle = (dia) => {
    setFormData((prev) => ({
      ...prev,
      dias_semana_aplicacion: prev.dias_semana_aplicacion.includes(dia)
        ? prev.dias_semana_aplicacion.filter((d) => d !== dia)
        : [...prev.dias_semana_aplicacion, dia],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mapear campos del frontend a los nombres que espera el backend
    const data = {
      nombre: formData.nombre,
      // Backend requiere ruta_id, no ruta_operacion_id
      ruta_id: formData.ruta_operacion_id ? Number(formData.ruta_operacion_id) : undefined,
      // Backend requiere stock_minimo_trigger (required)
      stock_minimo_trigger: formData.stock_minimo_trigger ? Number(formData.stock_minimo_trigger) : 0,
      // Backend espera cantidad_fija, no cantidad_a_ordenar
      cantidad_fija: formData.cantidad_a_ordenar ? Number(formData.cantidad_a_ordenar) : undefined,
      // Backend espera dias_semana, no dias_semana_aplicacion
      dias_semana: formData.dias_semana_aplicacion?.length > 0 ? formData.dias_semana_aplicacion : undefined,
      // Campos de alcance (solo uno puede estar definido)
      producto_id: formData.tipo_alcance === 'producto' && formData.producto_id ? Number(formData.producto_id) : undefined,
      categoria_id: formData.tipo_alcance === 'categoria' && formData.categoria_id ? Number(formData.categoria_id) : undefined,
      // El backend no tiene proveedor_id, solo producto_id, categoria_id, sucursal_id
      activo: formData.activo,
      prioridad: formData.prioridad || 0,
    };

    // Eliminar campos undefined
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nombre de la regla *
        </label>
        <input
          type="text"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          placeholder="Ej: Reabastecer lacteos semanalmente"
        />
      </div>

      {/* Tipo de alcance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alcance de la regla
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIPOS_ALCANCE.map((tipo) => {
            const Icon = tipo.icon;
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => handleChange('tipo_alcance', tipo.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo_alcance === tipo.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tipo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector segun tipo */}
      {formData.tipo_alcance === 'producto' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Producto *
          </label>
          <select
            value={formData.producto_id}
            onChange={(e) => handleChange('producto_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Seleccionar producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku ? `[${p.sku}] ` : ''}{p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.tipo_alcance === 'categoria' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria *
          </label>
          <select
            value={formData.categoria_id}
            onChange={(e) => handleChange('categoria_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Seleccionar categoria...</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.tipo_alcance === 'proveedor' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Proveedor *
          </label>
          <select
            value={formData.proveedor_id}
            onChange={(e) => handleChange('proveedor_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Seleccionar proveedor...</option>
            {proveedores?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ruta de operacion */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ruta de Operacion *
        </label>
        <select
          value={formData.ruta_operacion_id}
          onChange={(e) => handleChange('ruta_operacion_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          required
        >
          <option value="">Seleccionar ruta...</option>
          {rutas?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} ({r.tipo})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Define como se reabastece el producto (compra, produccion, etc.)
        </p>
      </div>

      {/* Frecuencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Frecuencia de evaluacion
        </label>
        <select
          value={formData.frecuencia}
          onChange={(e) => handleChange('frecuencia', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
        >
          {FRECUENCIAS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dias de la semana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dias de aplicacion (opcional)
        </label>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia) => (
            <button
              key={dia.value}
              type="button"
              onClick={() => handleDiaToggle(dia.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                formData.dias_semana_aplicacion.includes(dia.value)
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {dia.label.slice(0, 3)}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Si no se selecciona ninguno, la regla aplica todos los dias
        </p>
      </div>

      {/* Parametros de stock */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Stock trigger *
          </label>
          <input
            type="number"
            value={formData.stock_minimo_trigger}
            onChange={(e) => handleChange('stock_minimo_trigger', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            min="0"
            required
            placeholder="Ej: 5"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Genera OC cuando stock &le; este valor
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cantidad a ordenar
          </label>
          <input
            type="number"
            value={formData.cantidad_a_ordenar}
            onChange={(e) => handleChange('cantidad_a_ordenar', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            min="1"
            placeholder="Hasta stock max."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Cantidad fija o dejar vacio para calcular
          </p>
        </div>
      </div>

      {/* Lead time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lead time (dias)
        </label>
        <input
          type="number"
          value={formData.lead_time_dias}
          onChange={(e) => handleChange('lead_time_dias', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          min="0"
          placeholder="Dias de anticipacion"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Considera stock proyectado si se especifica
        </p>
      </div>

      {/* Prioridad y estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            checked={formData.activo}
            onChange={(e) => handleChange('activo', e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
            Regla activa
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Prioridad:</label>
          <select
            value={formData.prioridad}
            onChange={(e) => handleChange('prioridad', Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          {regla ? 'Guardar Cambios' : 'Crear Regla'}
        </button>
      </div>
    </form>
  );
}
