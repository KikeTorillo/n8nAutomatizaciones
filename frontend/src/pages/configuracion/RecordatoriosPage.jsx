import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Bell,
  ArrowLeft,
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
import AgendamientoNavTabs from '@/components/agendamiento/AgendamientoNavTabs';

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
 * Componente de tarjeta de estadística
 */
function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-2">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Variables disponibles:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {variables.map((v) => (
          <div key={v.variable} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
            <code className="bg-gray-200 px-2 py-0.5 rounded text-xs w-fit">{v.variable}</code>
            <span className="text-gray-500 text-xs sm:text-sm">{v.descripcion}</span>
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
        loading={isLoading}
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
  const navigate = useNavigate();

  // Queries
  const { data: config, isLoading: loadingConfig } = useConfiguracionRecordatorios();
  const { data: stats, isLoading: loadingStats } = useEstadisticasRecordatorios();

  // Mutations
  const actualizarMutation = useActualizarConfiguracion();
  const enviarPruebaMutation = useEnviarPrueba();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header con navegación */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Agendamiento</h1>
      </div>

      {/* Tabs de navegación */}
      <AgendamientoNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección - Mobile First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
              Recordatorios Automáticos
            </h2>
            <p className="text-gray-500 text-sm hidden sm:block">
              Configura los recordatorios de citas para tus clientes
            </p>
          </div>

          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty || actualizarMutation.isPending}
            loading={actualizarMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>

        <div className="space-y-6">

      {/* Estadísticas - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total enviados"
          value={stats?.total || 0}
          icon={Send}
          color="blue"
        />
        <StatCard
          title="Confirmados"
          value={stats?.confirmados || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Fallidos"
          value={stats?.fallidos || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Tasa de confirmación"
          value={`${stats?.tasa_confirmacion || 0}%`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Activación global */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${habilitado ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Bell className={`w-5 h-5 ${habilitado ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Recordatorios automáticos</h3>
                <p className="text-sm text-gray-500">
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {!habilitado && (
            <div className="mt-4 flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Los recordatorios están desactivados</span>
            </div>
          )}
        </div>

        {/* Configuración de tiempos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Tiempos de envío
          </h3>

          <div className="space-y-4">
            {/* Recordatorio 1 */}
            <div className={`p-4 rounded-lg border ${recordatorio1Activo ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recordatorio principal</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                    Recomendado
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('recordatorio_1_activo')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  {...register('recordatorio_1_horas', { valueAsNumber: true })}
                  disabled={!recordatorio1Activo}
                  className="w-20 px-3 py-2 border rounded-lg disabled:bg-gray-100"
                  min="1"
                  max="168"
                />
                <span className="text-gray-600">horas antes de la cita</span>
              </div>
              {errors.recordatorio_1_horas && (
                <p className="text-red-500 text-sm mt-1">{errors.recordatorio_1_horas.message}</p>
              )}
            </div>

            {/* Recordatorio 2 */}
            <div className={`p-4 rounded-lg border ${recordatorio2Activo ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recordatorio secundario</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Opcional
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('recordatorio_2_activo')}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  {...register('recordatorio_2_horas', { valueAsNumber: true })}
                  disabled={!recordatorio2Activo}
                  className="w-20 px-3 py-2 border rounded-lg disabled:bg-gray-100"
                  min="1"
                  max="24"
                />
                <span className="text-gray-600">horas antes de la cita</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ventana horaria */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Ventana horaria
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Define el horario en el que se pueden enviar recordatorios (para no molestar de noche)
          </p>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-gray-600">Desde</label>
              <input
                type="time"
                {...register('hora_inicio')}
                className="block w-full px-3 py-2 border rounded-lg mt-1"
              />
            </div>
            <span className="text-gray-400 mt-6">-</span>
            <div>
              <label className="text-sm text-gray-600">Hasta</label>
              <input
                type="time"
                {...register('hora_fin')}
                className="block w-full px-3 py-2 border rounded-lg mt-1"
              />
            </div>
          </div>
        </div>

        {/* Plantilla de mensaje */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            Plantilla del mensaje
          </h3>
          <textarea
            {...register('plantilla_mensaje')}
            rows={8}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Escribe el mensaje que recibirán tus clientes..."
          />
          {errors.plantilla_mensaje && (
            <p className="text-red-500 text-sm mt-1">{errors.plantilla_mensaje.message}</p>
          )}
          <VariablesDisponibles />
        </div>

        {/* Configuración avanzada */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-500" />
            Reintentos
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Reintentar hasta</span>
            <input
              type="number"
              {...register('max_reintentos', { valueAsNumber: true })}
              className="w-16 px-3 py-2 border rounded-lg text-center"
              min="1"
              max="5"
            />
            <span className="text-gray-600">veces si falla el envío</span>
          </div>
        </div>
      </form>

      {/* Prueba de envío */}
      {/* Test de envío */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5 text-gray-500" />
          Enviar mensaje de prueba
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Envía un mensaje de prueba para verificar que la configuración es correcta
        </p>
        <TestForm
          onEnviar={handleEnviarPrueba}
          isLoading={enviarPruebaMutation.isPending}
        />
      </div>

        </div>{/* Cierre space-y-6 */}
      </div>{/* Cierre max-w-7xl */}
    </div>
  );
}

export default RecordatoriosPage;
