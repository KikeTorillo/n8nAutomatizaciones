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
import { Button, Drawer } from '@/components/ui';
import { useCrearCliente, useActualizarCliente } from '@/hooks/personas';
import { useToast, useUploadArchivo } from '@/hooks/utils';

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

  // Estado para imagen
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);

  // Estado para etiquetas (manejado fuera del form porque es un array de IDs)
  const [etiquetaIds, setEtiquetaIds] = useState([]);

  // Mutations
  const uploadMutation = useUploadArchivo();
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
      // Cargar foto existente
      if (cliente.foto_url) {
        setFotoUrl(cliente.foto_url);
        setFotoPreview(cliente.foto_url);
      } else {
        setFotoUrl(null);
        setFotoPreview(null);
      }
      setFotoFile(null);
      // Cargar etiquetas
      setEtiquetaIds(cliente.etiquetas?.map(e => e.id) || []);
    } else {
      reset(defaultValuesCreate);
      setFotoFile(null);
      setFotoPreview(null);
      setFotoUrl(null);
      setEtiquetaIds([]);
    }
    // Reset tab al abrir
    setActiveTab('basico');
  }, [esEdicion, cliente, reset, isOpen]);

  // Manejar exito de las mutaciones
  useEffect(() => {
    if (crearMutation.isSuccess) {
      showSuccess('Cliente creado correctamente');
      const nuevoCliente = crearMutation.data;
      reset();
      onClose();
      crearMutation.reset();
      // Navegar al detalle o ejecutar callback
      if (onSuccess) {
        onSuccess(nuevoCliente);
      } else if (nuevoCliente?.id) {
        navigate(`/clientes/${nuevoCliente.id}`);
      }
    }
  }, [crearMutation.isSuccess, crearMutation, showSuccess, reset, onClose, navigate, onSuccess]);

  useEffect(() => {
    if (actualizarMutation.isSuccess) {
      showSuccess('Cliente actualizado correctamente');
      onClose();
      actualizarMutation.reset();
      if (onSuccess) {
        onSuccess(actualizarMutation.data);
      }
    }
  }, [actualizarMutation.isSuccess, actualizarMutation, showSuccess, onClose, onSuccess]);

  // Manejar errores de las mutaciones
  useEffect(() => {
    if (crearMutation.isError) {
      const error = crearMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al crear cliente');
      crearMutation.reset();
    }
  }, [crearMutation.isError, crearMutation, showError]);

  useEffect(() => {
    if (actualizarMutation.isError) {
      const error = actualizarMutation.error;
      showError(error?.response?.data?.mensaje || 'Error al actualizar cliente');
      actualizarMutation.reset();
    }
  }, [actualizarMutation.isError, actualizarMutation, showError]);

  // Handler para seleccionar foto
  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('La imagen no debe superar 5MB');
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  // Handler para eliminar foto
  const handleEliminarFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    setFotoUrl(null);
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      let urlFotoFinal = fotoUrl;

      // Si hay un nuevo archivo de imagen, subirlo primero
      if (fotoFile) {
        const resultado = await uploadMutation.mutateAsync({
          file: fotoFile,
          folder: 'clientes',
          isPublic: true,
        });
        urlFotoFinal = resultado?.url || resultado;
      }

      // Convertir datos del formulario al formato de la API
      const dataToSubmit = formDataToApi(data, urlFotoFinal);

      // Agregar etiquetas si hay seleccionadas
      if (etiquetaIds.length > 0) {
        dataToSubmit.etiqueta_ids = etiquetaIds;
      }

      if (mode === 'create') {
        crearMutation.mutate(dataToSubmit);
      } else {
        actualizarMutation.mutate({ id: cliente.id, data: dataToSubmit });
      }
    } catch (error) {
      showError('Error al subir la imagen');
      console.error('Error subiendo imagen:', error);
    }
  };

  const isLoading = crearMutation.isPending || actualizarMutation.isPending || uploadMutation.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={esEdicion ? 'Modifica los datos del cliente' : 'Completa la informacion del cliente'}
      size="xl"
      noPadding
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
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
              fotoPreview={fotoPreview}
              uploadIsPending={uploadMutation.isPending}
              onFotoChange={handleFotoChange}
              onEliminarFoto={handleEliminarFoto}
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

        {/* Footer con botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 px-6 pb-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {uploadMutation.isPending
              ? 'Subiendo foto...'
              : esEdicion
                ? 'Guardar Cambios'
                : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
});

export default ClienteFormDrawer;
