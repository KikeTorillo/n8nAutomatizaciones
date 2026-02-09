import React, { memo, useState } from 'react';
import {
  Edit,
  Trash2,
  Copy,
  QrCode,
  Mail,
  Phone,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * Obtiene las clases CSS del badge según el estado RSVP
 */
const getRSVPBadge = (estado) => {
  const badges = {
    pendiente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
    confirmado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
    rechazado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
  };
  return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
};

/**
 * Fila de tabla para un invitado - Componente memoizado
 * Evita re-renders innecesarios cuando cambian otros invitados
 */
const InvitadoTableRow = memo(function InvitadoTableRow({
  invitado,
  mostrarQR,
  eventoSlug,
  onEdit,
  onDelete,
  onCopyLink,
  onViewQR,
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleCopyLink = () => {
    const invitacionUrl = `${window.location.origin}/e/${eventoSlug}/${invitado.token}`;
    onCopyLink(invitacionUrl);
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
          {invitado.nombre}
        </p>
        {invitado.grupo_familiar && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {invitado.grupo_familiar}
          </p>
        )}
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {invitado.email && (
            <p className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {invitado.email}
            </p>
          )}
          {invitado.telefono && (
            <p className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {invitado.telefono}
            </p>
          )}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRSVPBadge(invitado.estado_rsvp)}`}>
          {invitado.estado_rsvp}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {invitado.num_asistentes || 0} / {invitado.max_acompanantes + 1}
        </span>
      </td>
      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
        {/* Desktop: botones visibles */}
        <div className="hidden sm:flex items-center justify-end gap-2">
          {mostrarQR && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewQR(invitado)}
              title="Ver codigo QR"
            >
              <QrCode className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            title="Copiar link de invitacion"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(invitado)}
            title="Editar invitado"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(invitado.id)}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            title="Eliminar invitado"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile: menu dropdown */}
        <div className="sm:hidden relative">
          <Button
            variant="outline"
            size="sm"
            className="px-2"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAbierto(!menuAbierto);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          {menuAbierto && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                {mostrarQR && (
                  <button
                    onClick={() => {
                      onViewQR(invitado);
                      setMenuAbierto(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" /> Ver QR
                  </button>
                )}
                <button
                  onClick={() => {
                    handleCopyLink();
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copiar link
                </button>
                <button
                  onClick={() => {
                    onEdit(invitado);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={() => {
                    onDelete(invitado.id);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Comparador personalizado para memo
  // Solo re-renderiza si cambian estas props específicas
  return (
    prevProps.invitado.id === nextProps.invitado.id &&
    prevProps.invitado.nombre === nextProps.invitado.nombre &&
    prevProps.invitado.email === nextProps.invitado.email &&
    prevProps.invitado.telefono === nextProps.invitado.telefono &&
    prevProps.invitado.estado_rsvp === nextProps.invitado.estado_rsvp &&
    prevProps.invitado.num_asistentes === nextProps.invitado.num_asistentes &&
    prevProps.invitado.max_acompanantes === nextProps.invitado.max_acompanantes &&
    prevProps.invitado.grupo_familiar === nextProps.invitado.grupo_familiar &&
    prevProps.mostrarQR === nextProps.mostrarQR &&
    prevProps.eventoSlug === nextProps.eventoSlug
  );
});

export default InvitadoTableRow;
