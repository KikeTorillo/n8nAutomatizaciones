import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useConfiguracionRecordatorios,
  useActualizarConfiguracion,
  useEstadisticasRecordatorios,
  useEnviarPrueba,
} from '@/hooks/useRecordatorios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { StatCardGrid } from '@/components/ui/StatCardGrid';
import {
  Bell,
  Save,
  Send,
  Clock,
  MessageSquare,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  TestTube,
} from 'lucide-react';
import AgendamientoPageLayout from '@/components/agendamiento/AgendamientoPageLayout';

/**
 * Schema de validación para configuración
 */
const configSchema = z.object({
  habilitado: z.boolean(),
  recordatorio_1_horas: z.number().min(1).max(168),
  recordatorio_1_activo: z.boolean(),
  recordatorio_2_horas: z.number().min(1).max(24),
  recordatorio_2_activo: z.boolean(),
  plantilla_mensaje: z.string().min(10).max(2000),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/),
  max_reintentos: z.number().min(1).max(5),
});

/**
 * Componente de variables disponibles
 */
function VariablesDisponibles() {
  const variables = [
    { variable: '{{cliente_nombre}}', descripcion: 'Nombre del cliente' },
    { variable: '{{negocio_nombre}}', descripcion: 'Nombre del negocio' },
    { variable: '{{fecha}}', descripcion: 'Fecha de la cita' },
    { variable: '{{hora}}', descripcion: 'Hora de la cita' },
    { variable: '{{servicios}}', descripcion: 'Lista de servicios' },
    { variable: '{{precio}}', descripcion: 'Precio total' },
    { variable: '{{profesional_nombre}}', descripcion: 'Nombre del profesional' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 mt-2">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variables disponibles:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {variables.map((v) => (
          <div key={v.variable} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs w-fit text-gray-800 dark:text-gray-200">{v.variable}</code>
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{v.descripcion}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Formulario de prueba de envío
 */
function TestForm({ onEnviar, isLoading }) {
  const [telefono, setTelefono] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (telefono.trim()) {
      onEnviar({ telefono: telefono.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <Input
        type="tel"
        placeholder="Ej: +521234567890"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        className="flex-1"
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={!telefono.trim() || isLoading}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        <TestTube className="w-4 h-4 mr-2" />
        Enviar prueba
      </Button>
    </form>
  );
}

/**
 * Página de Configuración de Recordatorios
 */
function RecordatoriosPage() {
  // Queries
  const { data: config, isLoading: loadingConfig } = useConfiguracionRecordatorios();
  const { data: stats, isLoading: loadingStats } = useEstadisticasRecordatorios();

  // Mutations
  const actualizarMutation = useActualizarConfiguracion();
  const enviarPruebaMutation = useEnviarPrueba();

  // Configuración de estadísticas
  const statsConfig = useMemo(() => [
    { key: 'enviados', icon: Send, label: 'Total enviados', value: stats?.total || 0, color: 'primary' },
    { key: 'confirmados', icon: CheckCircle, label: 'Confirmados', value: stats?.confirmados || 0, color: 'green' },
    { key: 'fallidos', icon: XCircle, label: 'Fallidos', value: stats?.fallidos || 0, color: 'red' },
    { key: 'tasa', icon: BarChart3, label: 'Tasa de confirmación', value: `${stats?.tasa_confirmacion || 0}%`, color: 'purple' },
  ], [stats]);

  // Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      habilitado: true,
      recordatorio_1_horas: 24,
      recordatorio_1_activo: true,
      recordatorio_2_horas: 2,
      recordatorio_2_activo: false,
      plantilla_mensaje: '',
      hora_inicio: '08:00',
      hora_fin: '21:00',
      max_reintentos: 3,
    },
  });

  // Actualizar form cuando cargue la config
  useEffect(() => {
    if (config) {
      reset({
        habilitado: config.habilitado ?? true,
        recordatorio_1_horas: config.recordatorio_1_horas ?? 24,
        recordatorio_1_activo: config.recordatorio_1_activo ?? true,
        recordatorio_2_horas: config.recordatorio_2_horas ?? 2,
        recordatorio_2_activo: config.recordatorio_2_activo ?? false,
        plantilla_mensaje: config.plantilla_mensaje ?? '',
        hora_inicio: config.hora_inicio?.substring(0, 5) ?? '08:00',
        hora_fin: config.hora_fin?.substring(0, 5) ?? '21:00',
        max_reintentos: config.max_reintentos ?? 3,
      });
    }
  }, [config, reset]);

  const habilitado = watch('habilitado');
  const recordatorio1Activo = watch('recordatorio_1_activo');
  const recordatorio2Activo = watch('recordatorio_2_activo');

  // Handlers
  const onSubmit = (data) => {
    actualizarMutation.mutate(data);
  };

  const handleEnviarPrueba = (data) => {
    enviarPruebaMutation.mutate(data);
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <AgendamientoPageLayout
      icon={Bell}
      title="Recordatorios Automáticos"
      subtitle="Configura los recordatorios de citas para tus clientes"
      actions={
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={!isDirty || actualizarMutation.isPending}
          isLoading={actualizarMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar cambios
        </Button>
      }
    >
      <div className="space-y-6">

      {/* Estadísticas */}
      <StatCardGrid stats={statsConfig} columns={4} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Activación global */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${habilitado ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Bell className={`w-5 h-5 ${habilitado ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Recordatorios automáticos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Envía recordatorios automáticos a los clientes antes de sus citas
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('habilitado')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {!habilitado && (
            <div className="mt-4 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Los recordatorios están desactivados</span>
            </div>
          )}
        </div>

        {/* Configuración de tiempos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Tiempos de envío
          </h3>

          <div className="space-y-4">
            {/* Recordatorio 1 */}
            <div className={`p-4 rounded-lg border ${recordatorio1Activo ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Recordatorio principal</span>
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('recordatorio_1_activo')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  {...register('recordatorio_1_horas', { valueAsNumber: true })}
                  disabled={recordatorio1Activo !== true}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  min="1"
                  max="168"
                />
                <span className="text-gray-600 dark:text-gray-400">horas antes de la cita</span>
              </div>
              {errors.recordatorio_1_horas && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.recordatorio_1_horas.message}</p>
              )}
            </div>

            {/* Recordatorio 2 */}
            <div className={`p-4 rounded-lg border ${recordatorio2Activo ? 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Recordatorio secundario</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    Opcional
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('recordatorio_2_activo')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  {...register('recordatorio_2_horas', { valueAsNumber: true })}
                  disabled={recordatorio2Activo !== true}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  min="1"
                  max="24"
                />
                <span className="text-gray-600 dark:text-gray-400">horas antes de la cita</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ventana horaria */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Ventana horaria
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Define el horario en el que se pueden enviar recordatorios (para no molestar de noche)
          </p>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Desde</label>
              <input
                type="time"
                {...register('hora_inicio')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <span className="text-gray-400 dark:text-gray-500 mt-6">-</span>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
              <input
                type="time"
                {...register('hora_fin')}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Plantilla de mensaje */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Plantilla del mensaje
          </h3>
          <textarea
            {...register('plantilla_mensaje')}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Escribe el mensaje que recibirán tus clientes..."
          />
          {errors.plantilla_mensaje && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.plantilla_mensaje.message}</p>
          )}
          <VariablesDisponibles />
        </div>

        {/* Configuración avanzada */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Reintentos
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Reintentar hasta</span>
            <input
              type="number"
              {...register('max_reintentos', { valueAsNumber: true })}
              className="w-16 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="1"
              max="5"
            />
            <span className="text-gray-600 dark:text-gray-400">veces si falla el envío</span>
          </div>
        </div>
      </form>

      {/* Prueba de envío */}
      {/* Test de envío */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          Enviar mensaje de prueba
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Envía un mensaje de prueba para verificar que la configuración es correcta
        </p>
        <TestForm
          onEnviar={handleEnviarPrueba}
          isLoading={enviarPruebaMutation.isPending}
        />
      </div>

      </div>{/* Cierre space-y-6 */}
    </AgendamientoPageLayout>
  );
}

export default RecordatoriosPage;
