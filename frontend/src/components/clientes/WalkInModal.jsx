import { useState, useEffect } from 'react';
import { Search, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Button,
  Drawer,
  Input,
  Select
} from '@/components/ui';
import { useBuscarPorTelefono, useCrearWalkIn, useDisponibilidadInmediata } from '@/hooks/personas';
import { useServiciosDashboard } from '@/hooks/otros';
import { useProfesionales } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';

/**
 * Modal para atender clientes walk-in (sin cita previa)
 * Flujo optimizado para recepción rápida en 3 pasos
 */
function WalkInModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: Buscar, 2: Servicio, 3: Confirmar
  const [telefono, setTelefono] = useState('');
  const [buscarEnabled, setBuscarEnabled] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [profesionalId, setProfesionalId] = useState('');
  const [tiempoEspera, setTiempoEspera] = useState(0);

  // Queries
  const { data: servicios, isLoading: loadingServicios, refetch: refetchServicios } = useServiciosDashboard();
  const { data: profesionales, isLoading: loadingProfesionales, refetch: refetchProfesionales } = useProfesionales();

  // Refetch servicios y profesionales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      refetchServicios();
      refetchProfesionales();
    }
  }, [isOpen, refetchServicios, refetchProfesionales]);
  const { data: clienteBuscado, isLoading: buscandoCliente } = useBuscarPorTelefono(
    telefono,
    buscarEnabled
  );
  const { data: disponibilidad } = useDisponibilidadInmediata(
    servicioId,
    profesionalId
  );

  // Mutation
  const crearWalkInMutation = useCrearWalkIn();

  useEffect(() => {
    if (clienteBuscado?.encontrado) {
      setClienteSeleccionado(clienteBuscado.cliente);
      setNombreCliente(clienteBuscado.cliente.nombre);
    }
  }, [clienteBuscado]);

  useEffect(() => {
    if (disponibilidad?.profesionales_disponibles?.length > 0) {
      const primero = disponibilidad.profesionales_disponibles[0];
      setTiempoEspera(primero.tiempo_espera_minutos || 0);
    }
  }, [disponibilidad]);

  const handleBuscarCliente = () => {
    if (telefono.length >= 10) {
      setBuscarEnabled(true);
    }
  };

  const handleContinuarStep1 = () => {
    if (nombreCliente) {
      setStep(2);
    }
  };

  const handleCrearWalkIn = () => {
    const data = {
      servicio_id: parseInt(servicioId),
      profesional_id: profesionalId ? parseInt(profesionalId) : null,
      tiempo_espera_aceptado: tiempoEspera,
      notas_walk_in: `Cliente walk-in. Tiempo de espera aceptado: ${tiempoEspera} min`,
    };

    if (clienteSeleccionado) {
      data.cliente_id = clienteSeleccionado.id;
    } else {
      data.nombre_cliente = nombreCliente;
    }

    crearWalkInMutation.mutate(data, {
      onSuccess: (cita) => {
        onSuccess?.(cita);
        handleClose();
      },
      onError: (error) => {
        console.error('Error al crear walk-in:', error);
        toast.error(
          error.response?.data?.error ||
          'Error al crear la cita walk-in. Por favor intenta nuevamente.'
        );
      },
    });
  };

  const handleClose = () => {
    setStep(1);
    setTelefono('');
    setClienteSeleccionado(null);
    setNombreCliente('');
    setServicioId('');
    setProfesionalId('');
    setBuscarEnabled(false);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Atención Walk-in"
      subtitle="Registro rápido de cliente sin cita previa"
    >
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Paso {step} de 3</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`
                  h-2 flex-1 rounded-full transition-colors
                  ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}
                `}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Buscar/Crear Cliente */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono del Cliente
              </label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="5512345678"
                  maxLength={10}
                  className="flex-1"
                  disabled={buscandoCliente}
                />
                <Button
                  onClick={handleBuscarCliente}
                  disabled={telefono.length !== 10 || buscandoCliente}
                  isLoading={buscandoCliente}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {clienteBuscado?.encontrado && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900">
                      Cliente encontrado
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {clienteBuscado.cliente.nombre}
                    </p>
                    {clienteBuscado.cliente.email && (
                      <p className="text-sm text-green-600 mt-1">
                        {clienteBuscado.cliente.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {buscarEnabled && !clienteBuscado?.encontrado && !buscandoCliente && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Cliente no encontrado. Ingresa el nombre para crear un registro rápido.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo del Cliente *
              </label>
              <Input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Juan Pérez"
                disabled={!!clienteSeleccionado}
              />
              {clienteSeleccionado && (
                <p className="text-xs text-gray-500 mt-1">
                  Cliente existente - No se puede editar
                </p>
              )}
            </div>

            <Button
              onClick={handleContinuarStep1}
              disabled={!nombreCliente}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Seleccionar Servicio y Profesional */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                <p className="font-semibold text-primary-900">
                  {nombreCliente}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicio *
              </label>
              <Select
                value={servicioId}
                onChange={(e) => setServicioId(e.target.value)}
                disabled={loadingServicios}
              >
                <option value="">Selecciona un servicio</option>
                {servicios?.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre} - {servicio.duracion_minutos} min - $
                    {servicio.precio?.toLocaleString()}
                  </option>
                ))}
              </Select>
            </div>

            {servicioId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesional (opcional)
                </label>
                <Select
                  value={profesionalId}
                  onChange={(e) => setProfesionalId(e.target.value)}
                  disabled={loadingProfesionales}
                >
                  <option value="">Cualquier profesional disponible</option>
                  {profesionales?.map((profesional) => (
                    <option key={profesional.id} value={profesional.id}>
                      {profesional.nombre_completo}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {disponibilidad && servicioId && (
              <div className={`
                border rounded-lg p-4
                ${disponibilidad.hay_disponibilidad
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
                }
              `}>
                <div className="flex items-start gap-3">
                  <Clock className={`
                    w-5 h-5 flex-shrink-0 mt-0.5
                    ${disponibilidad.hay_disponibilidad ? 'text-green-600' : 'text-yellow-600'}
                  `} />
                  <div>
                    <p className={`
                      font-semibold
                      ${disponibilidad.hay_disponibilidad ? 'text-green-900' : 'text-yellow-900'}
                    `}>
                      {disponibilidad.hay_disponibilidad
                        ? 'Disponibilidad inmediata'
                        : 'Disponibilidad limitada'
                      }
                    </p>
                    {disponibilidad.hay_disponibilidad ? (
                      <>
                        <p className="text-sm text-green-700 mt-1">
                          Tiempo de espera estimado: {tiempoEspera} minutos
                        </p>
                        {disponibilidad.profesionales_disponibles?.length > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            Profesional: {disponibilidad.profesionales_disponibles[0].nombre}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-yellow-700 mt-1">
                        No hay disponibilidad inmediata. Se agregará a cola de espera.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!servicioId}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmar */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">
                Resumen de atención
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium text-gray-900">{nombreCliente}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{telefono || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Servicio</p>
                  <p className="font-medium text-gray-900">
                    {servicios?.find((s) => s.id === parseInt(servicioId))?.nombre}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Tiempo de espera</p>
                  <p className="font-medium text-gray-900">{tiempoEspera} min</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={crearWalkInMutation.isPending}
              >
                Atrás
              </Button>
              <Button
                onClick={handleCrearWalkIn}
                isLoading={crearWalkInMutation.isPending}
                disabled={crearWalkInMutation.isPending}
                className="flex-1"
              >
                Confirmar Atención
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default WalkInModal;
