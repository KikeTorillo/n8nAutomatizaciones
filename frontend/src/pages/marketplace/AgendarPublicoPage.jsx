import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { usePerfilPublico } from '@/hooks/otros';
import SelectorServiciosPublico from '@/components/marketplace/agendamiento/SelectorServiciosPublico';
import SelectorFechaHoraPublico from '@/components/marketplace/agendamiento/SelectorFechaHoraPublico';
import FormularioDatosCliente from '@/components/marketplace/agendamiento/FormularioDatosCliente';
import ConfirmacionCita from '@/components/marketplace/agendamiento/ConfirmacionCita';

/**
 * Página de agendamiento público
 * Ruta: /agendar/:slug
 * No requiere autenticación
 */
function AgendarPublicoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Estado del stepper
  const [pasoActual, setPasoActual] = useState(1);
  const [datosAgendamiento, setDatosAgendamiento] = useState({
    servicios: [], // [{ id, nombre, precio, duracion }]
    fecha: null,
    hora: null,
    cliente: {
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
    },
  });

  // Fetch del perfil público
  const { data: perfil, isLoading, error } = usePerfilPublico(slug);

  // Scroll to top al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pasoActual]);

  // Pasos del stepper
  const pasos = [
    { numero: 1, titulo: 'Servicios', completado: pasoActual > 1 },
    { numero: 2, titulo: 'Fecha y Hora', completado: pasoActual > 2 },
    { numero: 3, titulo: 'Tus Datos', completado: pasoActual > 3 },
    { numero: 4, titulo: 'Confirmar', completado: pasoActual > 4 },
  ];

  // Handlers de navegación
  const handleSiguiente = () => {
    if (pasoActual < 4) {
      setPasoActual(pasoActual + 1);
    }
  };

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const handleVolverPerfil = () => {
    navigate(`/${slug}`);
  };

  // Handlers de datos
  const handleSeleccionarServicios = (servicios) => {
    setDatosAgendamiento((prev) => ({ ...prev, servicios }));
  };

  const handleSeleccionarFechaHora = (fecha, hora) => {
    setDatosAgendamiento((prev) => ({ ...prev, fecha, hora }));
  };

  const handleGuardarDatosCliente = (cliente) => {
    setDatosAgendamiento((prev) => ({ ...prev, cliente }));
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Negocio no encontrado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            El negocio que buscas no existe o ha sido desactivado
          </p>
          <Button onClick={() => navigate('/marketplace')}>
            Volver al directorio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={handleVolverPerfil}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al perfil
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Agendar Cita
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{perfil.nombre_comercial}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {pasos.map((paso, index) => (
              <div key={paso.numero} className="flex items-center flex-1">
                {/* Círculo del paso */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                      ${
                        paso.completado
                          ? 'bg-green-600 text-white'
                          : paso.numero === pasoActual
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {paso.completado ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      paso.numero
                    )}
                  </div>
                  <span
                    className={`
                      text-xs mt-2 font-medium hidden sm:block
                      ${
                        paso.numero === pasoActual
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }
                    `}
                  >
                    {paso.titulo}
                  </span>
                </div>

                {/* Línea conectora */}
                {index < pasos.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-2 transition-colors
                      ${paso.completado ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Paso 1: Seleccionar servicios */}
          {pasoActual === 1 && (
            <SelectorServiciosPublico
              organizacionId={perfil.organizacion_id}
              serviciosSeleccionados={datosAgendamiento.servicios}
              onSeleccionar={handleSeleccionarServicios}
              onSiguiente={handleSiguiente}
            />
          )}

          {/* Paso 2: Seleccionar fecha y hora */}
          {pasoActual === 2 && (
            <SelectorFechaHoraPublico
              organizacionId={perfil.organizacion_id}
              serviciosIds={datosAgendamiento.servicios.map((s) => s.id)}
              fechaSeleccionada={datosAgendamiento.fecha}
              horaSeleccionada={datosAgendamiento.hora}
              onSeleccionar={handleSeleccionarFechaHora}
              onSiguiente={handleSiguiente}
              onAnterior={handleAnterior}
            />
          )}

          {/* Paso 3: Datos del cliente */}
          {pasoActual === 3 && (
            <FormularioDatosCliente
              datosCliente={datosAgendamiento.cliente}
              onGuardar={handleGuardarDatosCliente}
              onSiguiente={handleSiguiente}
              onAnterior={handleAnterior}
            />
          )}

          {/* Paso 4: Confirmación */}
          {pasoActual === 4 && (
            <ConfirmacionCita
              datosAgendamiento={datosAgendamiento}
              perfil={perfil}
              onAnterior={handleAnterior}
              onExito={() => navigate(`/${slug}?agendado=true`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AgendarPublicoPage;
