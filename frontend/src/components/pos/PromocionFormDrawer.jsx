import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileText, Sparkles, Settings } from 'lucide-react';

import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import useSucursalStore from '@/store/sucursalStore';
import { useCrearPromocion, useActualizarPromocion } from '@/hooks/usePromociones';

import {
  PromocionFormGeneralTab,
  PromocionFormTipoTab,
  PromocionFormCondicionesTab,
  promocionCreateSchema,
  defaultValuesCreate,
  getDefaultValuesEdit,
  transformFormToPayload,
} from './promocion-form';

/**
 * Tabs del formulario
 */
const TABS = [
  { id: 'general', label: 'General', icon: FileText },
  { id: 'tipo', label: 'Tipo', icon: Sparkles },
  { id: 'condiciones', label: 'Condiciones', icon: Settings },
];

/**
 * Drawer para crear/editar promociones
 * Usa tabs para organizar el formulario en secciones
 */
export default function PromocionFormDrawer({ isOpen, onClose, promocion, onSuccess }) {
  const toast = useToast();
  const { sucursalActiva } = useSucursalStore();
  const [activeTab, setActiveTab] = useState('general');

  const crearMutation = useCrearPromocion();
  const actualizarMutation = useActualizarPromocion();

  const esEdicion = !!promocion;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(promocionCreateSchema),
    defaultValues: esEdicion ? getDefaultValuesEdit(promocion) : defaultValuesCreate,
  });

  // Reset cuando cambia la promoción
  useEffect(() => {
    if (esEdicion && promocion) {
      reset(getDefaultValuesEdit(promocion));
    } else {
      reset(defaultValuesCreate);
    }
    setActiveTab('general');
  }, [promocion, esEdicion, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = transformFormToPayload(data, sucursalActiva?.id);

      if (esEdicion) {
        await actualizarMutation.mutateAsync({
          id: promocion.id,
          data: payload
        });
        toast.success('Promoción actualizada');
      } else {
        await crearMutation.mutateAsync(payload);
        toast.success('Promoción creada');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al guardar');
    }
  };

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  // Verificar errores en cada tab para mostrar indicador
  const hasErrorsInTab = (tabId) => {
    const tabFields = {
      general: ['codigo', 'nombre', 'descripcion', 'prioridad'],
      tipo: ['tipo', 'valor_descuento', 'reglas'],
      condiciones: ['fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'dias_semana'],
    };
    return tabFields[tabId]?.some(field => {
      if (field === 'reglas') {
        return errors.reglas?.cantidad_requerida || errors.reglas?.cantidad_gratis;
      }
      return errors[field];
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Promoción' : 'Nueva Promoción'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const hasErrors = hasErrorsInTab(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {hasErrors && (
                  <span className="absolute top-2 right-1 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Contenido del tab */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'general' && (
            <PromocionFormGeneralTab
              register={register}
              errors={errors}
            />
          )}
          {activeTab === 'tipo' && (
            <PromocionFormTipoTab
              register={register}
              watch={watch}
              errors={errors}
            />
          )}
          {activeTab === 'condiciones' && (
            <PromocionFormCondicionesTab
              register={register}
              control={control}
              errors={errors}
            />
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {esEdicion ? 'Guardar cambios' : 'Crear promoción'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
