/**
 * ====================================================================
 * HabilidadDrawer - Drawer para asignar/editar habilidad de empleado
 * ====================================================================
 *
 * Migrado a React Hook Form + Zod - Enero 2026
 * Patron doble formulario: principal (asignar) + secundario (crear en catalogo)
 */
import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Drawer,
  Input,
  Textarea
} from '@/components/ui';
import { Loader2, Wrench, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/utils';
import {
  useAsignarHabilidad,
  useActualizarHabilidadEmpleado,
  useCatalogoHabilidades,
  useCrearHabilidadCatalogo,
  NIVELES_HABILIDAD,
  CATEGORIAS_HABILIDAD,
  getCategoriaConfig,
} from '@/hooks/personas';
import {
  habilidadEmpleadoSchema,
  nuevaHabilidadCatalogoSchema,
} from '@/schemas/profesionales.schemas';

// ====================================================================
// CONSTANTES
// ====================================================================

const DEFAULT_VALUES_MAIN = {
  habilidad_id: null,
  nivel: 'basico',
  anios_experiencia: 0,
  notas: '',
  certificaciones: '',
};

const DEFAULT_VALUES_CATALOGO = {
  nombre: '',
  categoria: 'tecnica',
  descripcion: '',
};

// ====================================================================
// COMPONENTE
// ====================================================================

export default function HabilidadDrawer({
  isOpen,
  onClose,
  profesionalId,
  habilidadEmpleado = null,
  onSuccess,
}) {
  const toast = useToast();
  const isEditing = !!habilidadEmpleado;

  // Estado UI
  const [busqueda, setBusqueda] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  // Queries y mutations
  const { data: catalogoData, isLoading: loadingCatalogo } = useCatalogoHabilidades({
    enabled: isOpen && !isEditing,
  });
  const asignarMutation = useAsignarHabilidad();
  const actualizarMutation = useActualizarHabilidadEmpleado();
  const crearCatalogoMutation = useCrearHabilidadCatalogo();

  const catalogo = catalogoData?.habilidades || [];
  const isLoading =
    asignarMutation.isPending ||
    actualizarMutation.isPending ||
    crearCatalogoMutation.isPending;

  // ============ FORMULARIO PRINCIPAL (asignar habilidad) ============
  const mainForm = useForm({
    resolver: zodResolver(habilidadEmpleadoSchema),
    defaultValues: DEFAULT_VALUES_MAIN,
  });

  // ============ FORMULARIO SECUNDARIO (crear en catalogo) ============
  const catalogoForm = useForm({
    resolver: zodResolver(nuevaHabilidadCatalogoSchema),
    defaultValues: DEFAULT_VALUES_CATALOGO,
  });

  // Observar habilidad_id para mostrar seleccionada
  const selectedHabilidadId = mainForm.watch('habilidad_id');
  const selectedHabilidad = catalogo.find((h) => h.id === selectedHabilidadId);

  // Filtrar catalogo por busqueda
  const catalogoFiltrado = useMemo(() => {
    if (!busqueda.trim()) return catalogo;
    const term = busqueda.toLowerCase();
    return catalogo.filter(
      (h) =>
        h.nombre.toLowerCase().includes(term) ||
        h.categoria?.toLowerCase().includes(term)
    );
  }, [catalogo, busqueda]);

  // Reset forms cuando cambia isOpen o habilidadEmpleado
  useEffect(() => {
    if (isOpen) {
      if (isEditing && habilidadEmpleado) {
        mainForm.reset({
          habilidad_id: habilidadEmpleado.habilidad_id,
          nivel: habilidadEmpleado.nivel || 'basico',
          anios_experiencia: habilidadEmpleado.anios_experiencia || 0,
          notas: habilidadEmpleado.notas || '',
          certificaciones: habilidadEmpleado.certificaciones || '',
        });
      } else {
        mainForm.reset(DEFAULT_VALUES_MAIN);
        catalogoForm.reset(DEFAULT_VALUES_CATALOGO);
        setBusqueda('');
        setShowNewForm(false);
      }
    }
  }, [isOpen, isEditing, habilidadEmpleado, mainForm, catalogoForm]);

  // Seleccionar habilidad del catalogo
  const handleSelectHabilidad = (hab) => {
    mainForm.setValue('habilidad_id', hab.id, { shouldValidate: true });
  };

  // Submit formulario principal
  const onSubmitMain = async (data) => {
    // Validar que haya habilidad seleccionada en create
    if (!isEditing && !data.habilidad_id) {
      mainForm.setError('habilidad_id', {
        type: 'manual',
        message: 'Selecciona una habilidad del catalogo',
      });
      return;
    }

    const dataToSend = {
      habilidad_id: data.habilidad_id,
      nivel: data.nivel,
      anios_experiencia: parseInt(data.anios_experiencia) || 0,
      notas: data.notas || null,
      certificaciones: data.certificaciones || null,
    };

    try {
      if (isEditing) {
        await actualizarMutation.mutateAsync({
          profesionalId,
          habilidadEmpleadoId: habilidadEmpleado.id,
          data: dataToSend,
        });
        toast.success('Habilidad actualizada');
      } else {
        await asignarMutation.mutateAsync({
          profesionalId,
          data: dataToSend,
        });
        toast.success('Habilidad asignada');
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar habilidad');
    }
  };

  // Crear nueva habilidad en catalogo
  const handleCrearNueva = async (data) => {
    try {
      const nuevaHabilidad = await crearCatalogoMutation.mutateAsync({
        nombre: data.nombre,
        categoria: data.categoria,
        descripcion: data.descripcion || null,
      });

      // Seleccionar la nueva habilidad
      mainForm.setValue('habilidad_id', nuevaHabilidad.id, { shouldValidate: true });
      setShowNewForm(false);
      catalogoForm.reset(DEFAULT_VALUES_CATALOGO);
      toast.success('Habilidad creada en catalogo');
    } catch (err) {
      toast.error(err.message || 'Error al crear habilidad');
    }
  };

  const handleClose = () => {
    mainForm.reset(DEFAULT_VALUES_MAIN);
    catalogoForm.reset(DEFAULT_VALUES_CATALOGO);
    setBusqueda('');
    setShowNewForm(false);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Habilidad' : 'Asignar Habilidad'}
      subtitle="Competencias y conocimientos del empleado"
    >
      <form onSubmit={mainForm.handleSubmit(onSubmitMain)} className="space-y-4">
        {/* Selector de habilidad (solo para crear) */}
        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Habilidad *
            </label>

            {/* Habilidad seleccionada */}
            {selectedHabilidad && (
              <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-500 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedHabilidad.nombre}
                    </span>
                    <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                      {getCategoriaConfig(selectedHabilidad.categoria).label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => mainForm.setValue('habilidad_id', null)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            )}

            {/* Busqueda y lista */}
            {!selectedHabilidad && !showNewForm && (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar habilidad..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {loadingCatalogo ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      {catalogoFiltrado.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">
                          No se encontraron habilidades
                        </div>
                      ) : (
                        catalogoFiltrado.map((hab) => {
                          const cat = getCategoriaConfig(hab.categoria);
                          return (
                            <button
                              key={hab.id}
                              type="button"
                              onClick={() => handleSelectHabilidad(hab)}
                              className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-center justify-between"
                            >
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {hab.nombre}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                {cat.label}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNewForm(true)}
                      className="mt-2 w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 py-2"
                    >
                      <Plus className="h-4 w-4" />
                      Crear nueva habilidad en catalogo
                    </button>
                  </>
                )}
              </>
            )}

            {/* Formulario nueva habilidad */}
            {!selectedHabilidad && showNewForm && (
              <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-3">
                <Input
                  label="Nombre de la habilidad"
                  placeholder="Ej: React, Liderazgo, Ingles..."
                  error={catalogoForm.formState.errors.nombre?.message}
                  {...catalogoForm.register('nombre')}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    {...catalogoForm.register('categoria')}
                  >
                    {CATEGORIAS_HABILIDAD.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowNewForm(false);
                      catalogoForm.reset(DEFAULT_VALUES_CATALOGO);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={catalogoForm.handleSubmit(handleCrearNueva)}
                    disabled={crearCatalogoMutation.isPending}
                  >
                    {crearCatalogoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Crear y Seleccionar'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mainForm.formState.errors.habilidad_id && (
              <p className="mt-1 text-sm text-red-500">
                {mainForm.formState.errors.habilidad_id.message}
              </p>
            )}
          </div>
        )}

        {/* Info de habilidad (solo para editar) */}
        {isEditing && habilidadEmpleado && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {habilidadEmpleado.habilidad?.nombre || 'Habilidad'}
            </span>
            {habilidadEmpleado.habilidad?.categoria && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                {getCategoriaConfig(habilidadEmpleado.habilidad.categoria).label}
              </span>
            )}
          </div>
        )}

        {/* Nivel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nivel de Dominio *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {NIVELES_HABILIDAD.map((nivel) => (
              <button
                key={nivel.value}
                type="button"
                onClick={() => mainForm.setValue('nivel', nivel.value)}
                className={`p-2 text-center rounded-lg border transition-colors ${
                  mainForm.watch('nivel') === nivel.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{nivel.label}</div>
                <div className="text-xs text-gray-500">{nivel.porcentaje}%</div>
              </button>
            ))}
          </div>
        </div>

        {/* Anos de experiencia */}
        <Input
          type="number"
          min="0"
          max="50"
          label="Anos de Experiencia"
          error={mainForm.formState.errors.anios_experiencia?.message}
          {...mainForm.register('anios_experiencia')}
        />

        {/* Certificaciones */}
        <Input
          label="Certificaciones relacionadas"
          placeholder="Ej: AWS Certified, SCRUM Master..."
          error={mainForm.formState.errors.certificaciones?.message}
          {...mainForm.register('certificaciones')}
        />

        {/* Notas */}
        <Textarea
          label="Notas adicionales"
          placeholder="Observaciones o contexto adicional..."
          rows={2}
          error={mainForm.formState.errors.notas?.message}
          {...mainForm.register('notas')}
        />

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading || (!isEditing && !selectedHabilidadId)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar' : 'Asignar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
