import { useState } from 'react';
import { Calendar, Clock, DollarSign, User, Mail, Phone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCrearCitaPublica } from '@/hooks/otros';
import { useToast } from '@/hooks/utils';

/**
 * Componente de confirmación y creación de cita (Paso 4)
 */
function ConfirmacionCita({
  datosAgendamiento,
  perfil,
  onAnterior,
  onExito,
}) {
  const { success, error: showError } = useToast();
  const crearCita = useCrearCitaPublica();
  const [citaCreada, setCitaCreada] = useState(false);

  const { servicios, fecha, hora, cliente } = datosAgendamiento;

  // Calcular totales
  const duracionTotal = servicios.reduce((sum, s) => sum + (s.duracion || 0), 0);
  const precioTotal = servicios.reduce((sum, s) => sum + (s.precio || 0), 0);

  // Formatear fecha para mostrar
  const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleConfirmar = async () => {
    try {
      const datos = {
        organizacion_id: perfil.organizacion_id,  // ✅ CRÍTICO: Requerido para agendamiento público
        cliente: {
          nombre: cliente.nombre,
          apellidos: cliente.apellidos || undefined,
          email: cliente.email,
          telefono: cliente.telefono,
        },
        servicios_ids: servicios.map((s) => s.id),
        fecha_cita: fecha,
        hora_inicio: hora,
        notas: `Cita agendada desde el marketplace por ${cliente.nombre}`,
      };

      await crearCita.mutateAsync(datos);

      setCitaCreada(true);
      success('¡Cita creada exitosamente!');

      // Redirigir después de 2 segundos
      setTimeout(() => {
        onExito();
      }, 2000);
    } catch (err) {
      showError(err.message || 'Error al crear la cita');
    }
  };

  // Vista de éxito
  if (citaCreada) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ¡Cita Creada!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Te enviaremos un correo de confirmación a <strong>{cliente.email}</strong>
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            El negocio se pondrá en contacto contigo pronto para confirmar la disponibilidad.
          </p>
        </div>
      </div>
    );
  }

  // Vista de confirmación
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Confirmar Cita
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Revisa los detalles antes de confirmar
        </p>
      </div>

      {/* Detalles de la cita */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        {/* Negocio */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Negocio</h3>
          <p className="text-gray-700 dark:text-gray-300">{perfil.nombre_comercial}</p>
          {perfil.ciudad && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{perfil.ciudad}</p>
          )}
        </div>

        {/* Servicios */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Servicios</h3>
          <ul className="space-y-2">
            {servicios.map((servicio) => (
              <li key={servicio.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{servicio.nombre}</span>
                <span className="text-gray-600 dark:text-gray-400">${servicio.precio?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between font-semibold">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 inline mr-1" />
                {duracionTotal} min
              </span>
            </div>
            <span className="text-primary-700 dark:text-primary-400 text-lg">
              <DollarSign className="w-5 h-5 inline" />
              {precioTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Fecha y Hora</h3>
          <div className="space-y-1">
            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="capitalize">{fechaFormateada}</span>
            </p>
            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {hora}
            </p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tus Datos</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              {cliente.nombre} {cliente.apellidos}
            </p>
            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {cliente.email}
            </p>
            <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {cliente.telefono}
            </p>
          </div>
        </div>
      </div>

      {/* Nota importante */}
      <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <p className="text-sm text-primary-800 dark:text-primary-300">
          <strong>Importante:</strong> Recibirás un correo de confirmación. El negocio puede contactarte para confirmar la disponibilidad.
        </p>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onAnterior}
          disabled={crearCita.isPending}
        >
          Anterior
        </Button>
        <Button
          onClick={handleConfirmar}
          isLoading={crearCita.isPending}
          size="lg"
        >
          Confirmar Cita
        </Button>
      </div>
    </div>
  );
}

export default ConfirmacionCita;
