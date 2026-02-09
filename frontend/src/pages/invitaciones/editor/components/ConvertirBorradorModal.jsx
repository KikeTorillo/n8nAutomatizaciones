/**
 * ConvertirBorradorModal — Modal para convertir borrador local a evento real.
 *
 * Si el usuario no está autenticado, redirige a login.
 * Si está autenticado, muestra formulario para crear el evento.
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import useAuthStore from '@/features/auth/store/authStore';
import { selectIsAuthenticated } from '@/features/auth/store/authStore';
import { useCrearEvento } from '@/hooks/otros/eventos-digitales';
import { eventosDigitalesApi } from '@/services/api/modules';
import { useToast } from '@/hooks/utils';
import { useBorradorStorage } from '../hooks/useBorradorStorage';

export default function ConvertirBorradorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const storage = useBorradorStorage();
  const crearEvento = useCrearEvento();

  const [nombre, setNombre] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // Si no está autenticado, redirigir a login
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onClose();
      navigate('/login?returnTo=/invitaciones/editor');
      return;
    }

    if (!nombre.trim() || !fechaEvento) return;

    setIsConverting(true);
    try {
      const borrador = storage.cargar();
      if (!borrador) {
        toast.error('No se encontr\u00f3 el borrador');
        return;
      }

      // 1. Crear evento en BD
      const payload = {
        nombre: nombre.trim(),
        tipo: borrador.tipoEvento,
        fecha_evento: fechaEvento,
        ...(horaEvento && { hora_evento: horaEvento }),
        ...(borrador.plantilla?.id && { plantilla_id: borrador.plantilla.id }),
      };

      const result = await crearEvento.mutateAsync(payload);
      const eventoId = result?.data?.id || result?.id;

      if (!eventoId) {
        toast.error('Error al crear el evento');
        return;
      }

      // 2. Guardar bloques editados del borrador (sobreescribe los de la plantilla)
      if (borrador.bloques?.length > 0) {
        await eventosDigitalesApi.saveBloques(eventoId, borrador.bloques);
      }

      // 3. Si el tema fue modificado, actualizar la plantilla del evento
      if (borrador.tema) {
        await eventosDigitalesApi.actualizarEvento(eventoId, { plantilla: borrador.tema });
      }

      // 4. Limpiar localStorage
      storage.limpiar();

      toast.success('Invitaci\u00f3n guardada exitosamente');
      navigate(`/eventos-digitales/${eventoId}/editor`, { replace: true });
    } catch {
      toast.error('Error al guardar la invitaci\u00f3n');
    } finally {
      setIsConverting(false);
    }
  }, [isAuthenticated, nombre, fechaEvento, horaEvento, storage, crearEvento, navigate, toast, onClose]);

  if (!isOpen) return null;

  // Si no está autenticado, mostrar modal de login
  if (!isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Inicia sesi\u00f3n para guardar">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Para guardar tu invitaci\u00f3n necesitas una cuenta. Tu borrador se conservar\u00e1 hasta que vuelvas.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onClose();
                navigate('/login?returnTo=/invitaciones/editor');
              }}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Iniciar sesi\u00f3n
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Guardar tu invitaci\u00f3n">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del evento *
          </label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Boda de Mar\u00eda y Juan"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha del evento *
          </label>
          <Input
            type="date"
            value={fechaEvento}
            onChange={(e) => setFechaEvento(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hora del evento (opcional)
          </label>
          <Input
            type="time"
            value={horaEvento}
            onChange={(e) => setHoraEvento(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isConverting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!nombre.trim() || !fechaEvento || isConverting}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar invitaci\u00f3n'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
