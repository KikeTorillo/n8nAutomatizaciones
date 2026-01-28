/**
 * ====================================================================
 * TAB PREFERENCIAS - Cliente Form Drawer
 * ====================================================================
 *
 * Contiene: Profesional preferido, Lista de precios, Etiquetas
 *
 * Enero 2026
 */

import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Tag, DollarSign, UserCheck } from 'lucide-react';
import { FormGroup, Select } from '@/components/ui';
import { useProfesionales } from '@/hooks/personas';
import { listasPreciosApi } from '@/services/api/endpoints';
import EtiquetasSelector from '../EtiquetasSelector';

/**
 * Tab de preferencias del cliente
 */
const ClienteFormPreferenciasTab = memo(function ClienteFormPreferenciasTab({
  register,
  errors,
  etiquetaIds,
  onEtiquetasChange,
}) {
  // Cargar profesionales activos
  const { data: profesionalesData } = useProfesionales({ activo: true, limit: 100 });
  const profesionales = profesionalesData?.profesionales || [];

  // Cargar listas de precios
  const { data: listas = [] } = useQuery({
    queryKey: ['listas-precios-activas'],
    queryFn: async () => {
      const response = await listasPreciosApi.listar({ soloActivas: true });
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return (
    <div className="space-y-6">
      {/* Profesional preferido */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <UserCheck className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Profesional Preferido
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Asigna un profesional por defecto para las citas de este cliente.
        </p>

        <FormGroup error={errors.profesional_preferido?.message}>
          <Select
            {...register('profesional_preferido')}
            placeholder="Sin preferencia"
            options={profesionales.map((p) => ({
              value: p.id.toString(),
              label: p.nombre_completo || p.nombre,
            }))}
            hasError={!!errors.profesional_preferido}
          />
        </FormGroup>
      </div>

      {/* Lista de precios */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
          Lista de Precios
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aplica precios especiales a este cliente.
        </p>

        <FormGroup error={errors.lista_precios_id?.message}>
          <Select
            {...register('lista_precios_id')}
            placeholder="Lista de precios por defecto"
            options={listas.map((l) => ({
              value: l.id.toString(),
              label: `${l.nombre}${l.porcentaje_descuento > 0 ? ` (-${l.porcentaje_descuento}%)` : ''}`,
            }))}
            hasError={!!errors.lista_precios_id}
          />
        </FormGroup>
      </div>

      {/* Etiquetas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Tag className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
          Etiquetas
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organiza y segmenta a tus clientes con etiquetas personalizadas.
        </p>

        <EtiquetasSelector
          value={etiquetaIds}
          onChange={onEtiquetasChange}
          placeholder="Agregar etiquetas..."
          maxTags={10}
        />
      </div>
    </div>
  );
});

export default ClienteFormPreferenciasTab;
