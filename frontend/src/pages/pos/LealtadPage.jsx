import { useState } from 'react';
import { Award, Settings, BarChart3, Gift } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui';
import NivelLealtadDrawer from '@/components/pos/NivelLealtadDrawer';
import POSPageHeader from '@/components/pos/POSPageHeader';
import ConfiguracionLealtadTab from '@/components/pos/tabs/ConfiguracionLealtadTab';
import NivelesLealtadTab from '@/components/pos/tabs/NivelesLealtadTab';
import EstadisticasLealtadTab from '@/components/pos/tabs/EstadisticasLealtadTab';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import {
  useConfiguracionLealtad,
  useGuardarConfiguracionLealtad,
  useNivelesLealtad,
  useEliminarNivelLealtad,
  useCrearNivelesDefault,
  useEstadisticasLealtad,
  useClientesConPuntos
} from '@/hooks/useLealtad';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';

export default function LealtadPage() {
  const toast = useToast();
  const sucursalActiva = useSucursalStore(selectSucursalActiva);
  const [tabActivo, setTabActivo] = useState('configuracion');
  const [drawerKey, setDrawerKey] = useState(0);

  // Modal manager para form y delete
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Queries
  const { data: config, isLoading: loadingConfig } = useConfiguracionLealtad();
  const { data: niveles, isLoading: loadingNiveles } = useNivelesLealtad({ incluir_inactivos: true });
  const { data: estadisticas, isLoading: loadingStats } = useEstadisticasLealtad(sucursalActiva?.id);
  const { data: clientesData } = useClientesConPuntos({ limit: 10, ordenar_por: 'puntos_desc' });

  // Mutations
  const guardarConfigMutation = useGuardarConfiguracionLealtad();
  const eliminarNivelMutation = useEliminarNivelLealtad();
  const crearNivelesDefaultMutation = useCrearNivelesDefault();

  const tabs = [
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'niveles', label: 'Niveles', icon: Award },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ];

  // Handlers
  const handleNuevoNivel = () => {
    setDrawerKey(k => k + 1);
    openModal('form', null);
  };

  const handleEditarNivel = (nivel) => {
    setDrawerKey(k => k + 1);
    openModal('form', nivel);
  };

  const handleEliminarNivel = (nivel) => {
    openModal('delete', nivel);
  };

  const confirmarEliminar = async () => {
    const deleteData = getModalData('delete');
    if (!deleteData) return;
    try {
      await eliminarNivelMutation.mutateAsync(deleteData.id);
      toast.success('Nivel eliminado');
      closeModal('delete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleCrearNivelesDefault = async () => {
    try {
      await crearNivelesDefaultMutation.mutateAsync();
      toast.success('Niveles creados: Bronce, Plata, Oro, Platino');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear niveles');
    }
  };

  const handleDrawerSuccess = () => {
    closeModal('form');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <POSPageHeader
        backTo="/pos/venta"
        icon={Gift}
        iconColor="text-emerald-600 dark:text-emerald-400"
        title="Programa de Lealtad"
        subtitle="Configura puntos, niveles y recompensas para tus clientes"
        tabs={tabs}
        activeTab={tabActivo}
        onTabChange={setTabActivo}
      />

      {/* Contenido */}
      <div className="p-4 sm:p-6">
        {tabActivo === 'configuracion' && (
          <ConfiguracionLealtadTab
            config={config}
            isLoading={loadingConfig}
            onGuardar={guardarConfigMutation}
          />
        )}
        {tabActivo === 'niveles' && (
          <NivelesLealtadTab
            niveles={niveles || []}
            isLoading={loadingNiveles}
            onNuevo={handleNuevoNivel}
            onEditar={handleEditarNivel}
            onEliminar={handleEliminarNivel}
            onCrearDefault={handleCrearNivelesDefault}
            creandoDefault={crearNivelesDefaultMutation.isPending}
          />
        )}
        {tabActivo === 'estadisticas' && (
          <EstadisticasLealtadTab
            estadisticas={estadisticas}
            clientes={clientesData?.clientes || []}
            isLoading={loadingStats}
          />
        )}
      </div>

      {/* Drawer de nivel */}
      <NivelLealtadDrawer
        key={drawerKey}
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        nivel={getModalData('form')}
        onSuccess={handleDrawerSuccess}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarEliminar}
        title="Eliminar nivel"
        message={`¿Eliminar el nivel "${getModalData('delete')?.nombre}"? Los clientes en este nivel quedarán sin nivel asignado.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarNivelMutation.isPending}
      />
    </div>
  );
}
