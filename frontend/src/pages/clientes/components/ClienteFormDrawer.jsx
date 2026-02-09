/**
 * ====================================================================
 * CLIENTE FORM DRAWER
 * ====================================================================
 *
 * Drawer con tabs para crear/editar clientes
 * Sigue patron de ProductoFormDrawer
 *
 * Enero 2026
 */

import { useEffect, useState, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Heart, Settings } from 'lucide-react';
import { Button, FormDrawer } from '@/components/ui';
import { useCrearCliente, useActualizarCliente } from '@/hooks/personas';
import { useToast, useImageUpload } from '@/hooks/utils';

// Importar schemas y tabs
import {
  clienteSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
  formDataToApi,
  ClienteFormBasicoTab,
  ClienteFormDireccionTab,
  ClienteFormPreferenciasTab,
  ClienteFormConfigTab,
} from './cliente-form';

/**
 * Drawer para crear/editar clientes con navegacion por tabs
 */
const ClienteFormDrawer = memo(function ClienteFormDrawer({
  isOpen,
  onClose,
  mode = 'create',
  cliente = null,
  onSuccess,
}) {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && cliente;

  // Estado para tabs
  const [activeTab, setActiveTab] = useState('basico');

  // Imagen del cliente (refactorizado Feb 2026)
  const imagen = useImageUpload({ folder: 'clientes' });

  // Estado para etiquetas (manejado fuera del form porque es un array de IDs)
  const [etiquetaIds, setEtiquetaIds] = useState([]);

  // Mutations
  const crearMutation = useCrearCliente();
  const actualizarMutation = useActualizarCliente();

  // Form
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(clienteSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
    defaultValues: esEdicion ? getDefaultValuesEdit(cliente) : defaultValuesCreate,
  });

  // Watch campos dinamicos
  const tipoCliente = watch('tipo');

  // Configuracion de tabs
  const tabs = [
    { id: 'basico', label: 'Basico', icon: User },
    { id: 'direccion', label: 'Direccion', icon: MapPin },
    { id: 'preferencias', label: 'Preferencias', icon: Heart },
    { id: 'config', label: 'Configuracion', icon: Settings },
  ];

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && cliente) {
      reset(getDefaultValuesEdit(cliente));
      imagen.loadFromUrl(cliente.foto_url || null);
      setEtiquetaIds(cliente.etiquetas?.map(e => e.id) || []);
    } else {
      reset(defaultValuesCreate);
      imagen.reset();
      setEtiquetaIds([]);
    }
    setActiveTab('basico');
  }, [esEdicion, cliente, reset, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submit handler (refactorizado Feb 2026 — mutateAsync + try/catch, sin useEffect)
  const onSubmit = async (data) => {
    try {
      const urlFotoFinal = await imagen.upload();

      const dataToSubmit = formDataToApi(data, urlFotoFinal);

      if (etiquetaIds.length > 0) {
        dataToSubmit.etiqueta_ids = etiquetaIds;
      }

      let result;
      if (mode === 'create') {
        result = await crearMutation.mutateAsync(dataToSubmit);
        showSuccess('Cliente creado correctamente');
      } else {
        result = await actualizarMutation.mutateAsync({ id: cliente.id, data: dataToSubmit });
        showSuccess('Cliente actualizado correctamente');
      }

      onClose();

      if (onSuccess) {
        onSuccess(result);
      } else if (mode === 'create' && result?.id) {
        navigate(`/clientes/${result.id}`);
      }
    } catch (error) {
      showError(error?.response?.data?.mensaje || `Error al ${esEdicion ? 'actualizar' : 'crear'} cliente`);
    }
  };

  const isLoading = crearMutation.isPending || actualizarMutation.isPending || imagen.isPending;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      entityName="Cliente"
      mode={esEdicion ? 'edit' : 'create'}
      subtitle={esEdicion ? 'Modifica los datos del cliente' : 'Completa la informacion del cliente'}
      size="xl"
      noPadding
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isLoading}
      hideFooter
      footer={
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 pb-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {imagen.isPending
              ? 'Subiendo foto...'
              : esEdicion
                ? 'Guardar Cambios'
                : 'Crear Cliente'}
          </Button>
        </div>
      }
    >
        {/* Tabs de navegacion - sticky */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-hide" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido del tab activo */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'basico' && (
            <ClienteFormBasicoTab
              register={register}
              control={control}
              errors={errors}
              tipoCliente={tipoCliente}
              fotoPreview={imagen.preview}
              uploadIsPending={imagen.isPending}
              onFotoChange={imagen.handleChange}
              onEliminarFoto={imagen.handleEliminar}
            />
          )}

          {activeTab === 'direccion' && (
            <ClienteFormDireccionTab
              register={register}
              errors={errors}
            />
          )}

          {activeTab === 'preferencias' && (
            <ClienteFormPreferenciasTab
              register={register}
              errors={errors}
              etiquetaIds={etiquetaIds}
              onEtiquetasChange={setEtiquetaIds}
            />
          )}

          {activeTab === 'config' && (
            <ClienteFormConfigTab
              control={control}
              register={register}
              errors={errors}
            />
          )}
        </div>

    </FormDrawer>
  );
});

export default ClienteFormDrawer;
