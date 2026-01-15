import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Building,
  Loader2,
  Search,
  DollarSign,
  Filter,
} from 'lucide-react';

import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import {
  usePuestos,
  useCrearPuesto,
  useActualizarPuesto,
  useEliminarPuesto,
} from '@/hooks/usePuestos';
import { useDepartamentos } from '@/hooks/useDepartamentos';

/**
 * Página de configuración de Puestos
 * CRUD completo con filtro por departamento
 */
function PuestosPage() {
  const toast = useToast();

  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartamento, setFilterDepartamento] = useState('');

  // Estado de modales centralizado con useModalManager
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Queries
  const { data: puestos = [], isLoading } = usePuestos();
  const { data: departamentos = [] } = useDepartamentos();

  // Mutations
  const crearMutation = useCrearPuesto();
  const actualizarMutation = useActualizarPuesto();
  const eliminarMutation = useEliminarPuesto();

  // Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      departamento_id: '',
      salario_minimo: '',
      salario_maximo: '',
      activo: true,
    },
  });

  // Filtrar puestos
  const puestosFiltrados = useMemo(() => {
    let filtered = puestos;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p => p.nombre?.toLowerCase().includes(term) || p.codigo?.toLowerCase().includes(term)
      );
    }

    if (filterDepartamento) {
      filtered = filtered.filter(p => p.departamento_id === parseInt(filterDepartamento));
    }

    return filtered;
  }, [puestos, searchTerm, filterDepartamento]);

  // Obtener nombre del departamento
  const getDepartamentoNombre = (departamentoId) => {
    const dep = departamentos.find(d => d.id === departamentoId);
    return dep?.nombre || 'Sin departamento';
  };

  // Abrir drawer para crear
  const handleNuevo = () => {
    reset({
      nombre: '',
      codigo: '',
      descripcion: '',
      departamento_id: '',
      salario_minimo: '',
      salario_maximo: '',
      activo: true,
    });
    openModal('form', null);
  };

  // Abrir drawer para editar
  const handleEditar = (puesto) => {
    reset({
      nombre: puesto.nombre || '',
      codigo: puesto.codigo || '',
      descripcion: puesto.descripcion || '',
      departamento_id: puesto.departamento_id?.toString() || '',
      salario_minimo: puesto.salario_minimo?.toString() || '',
      salario_maximo: puesto.salario_maximo?.toString() || '',
      activo: puesto.activo ?? true,
    });
    openModal('form', puesto);
  };

  // Confirmar eliminación
  const handleEliminar = (puesto) => {
    openModal('delete', puesto);
  };

  // Submit form
  const onSubmit = async (data) => {
    const editingPuesto = getModalData('form');
    try {
      const payload = {
        nombre: data.nombre.trim(),
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        departamento_id: data.departamento_id ? parseInt(data.departamento_id) : null,
        salario_minimo: data.salario_minimo ? parseFloat(data.salario_minimo) : null,
        salario_maximo: data.salario_maximo ? parseFloat(data.salario_maximo) : null,
        activo: data.activo,
      };

      if (editingPuesto) {
        await actualizarMutation.mutateAsync({
          id: editingPuesto.id,
          data: payload,
        });
        toast.success('Puesto actualizado');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Puesto creado');
      }

      closeModal('form');
      reset();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  // Confirmar delete
  const confirmarEliminar = async () => {
    const deleteConfirm = getModalData('delete');
    if (!deleteConfirm) return;
    try {
      await eliminarMutation.mutateAsync(deleteConfirm.id);
      toast.success('Puesto eliminado');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BackButton to="/configuracion" label="Configuración" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Puestos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Catálogo de puestos de trabajo
                </p>
              </div>
            </div>
            <Button onClick={handleNuevo} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterDepartamento}
              onChange={(e) => setFilterDepartamento(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 appearance-none"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {puestos.length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Puestos</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {puestos.filter(p => p.salario_minimo || p.salario_maximo).length}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Con rango salarial</p>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : puestosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || filterDepartamento ? 'No se encontraron puestos' : 'No hay puestos configurados'}
              </p>
              {!searchTerm && !filterDepartamento && (
                <Button onClick={handleNuevo} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer puesto
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {puestosFiltrados.map(puesto => (
                <div
                  key={puesto.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  {/* Icon */}
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {puesto.nombre}
                      </span>
                      {puesto.codigo && (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          {puesto.codigo}
                        </span>
                      )}
                      {!puesto.activo && (
                        <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {getDepartamentoNombre(puesto.departamento_id)}
                      </span>
                      {(puesto.salario_minimo || puesto.salario_maximo) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(puesto.salario_minimo)} - {formatCurrency(puesto.salario_maximo)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditar(puesto)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(puesto)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Drawer Form */}
      <Drawer
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        title={getModalData('form') ? 'Editar Puesto' : 'Nuevo Puesto'}
        subtitle={getModalData('form') ? 'Modifica los datos del puesto' : 'Crea un nuevo puesto de trabajo'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Gerente de Ventas"
            error={errors.nombre?.message}
            {...register('nombre', { required: 'El nombre es requerido' })}
          />

          <Input
            label="Código (Opcional)"
            placeholder="Ej: GER-VEN"
            {...register('codigo')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento
            </label>
            <select
              {...register('departamento_id')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona un departamento</option>
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              {...register('descripcion')}
              rows={3}
              placeholder="Responsabilidades y funciones del puesto..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salario Mínimo"
              type="number"
              placeholder="0.00"
              {...register('salario_minimo')}
            />
            <Input
              label="Salario Máximo"
              type="number"
              placeholder="0.00"
              {...register('salario_maximo')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              {...register('activo')}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
              Puesto activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => closeModal('form')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={crearMutation.isPending || actualizarMutation.isPending}
            >
              {getModalData('form') ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        title="Eliminar puesto"
        message={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={confirmarEliminar}
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

export default PuestosPage;
