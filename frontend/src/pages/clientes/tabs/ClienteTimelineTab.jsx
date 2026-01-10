/**
 * ====================================================================
 * CLIENTE TIMELINE TAB - HISTORIAL Y ACTIVIDADES
 * ====================================================================
 *
 * Fase 4C - Vista con Tabs (Ene 2026)
 * Tab de timeline unificado del cliente
 *
 * ====================================================================
 */

import ClienteTimeline from '@/components/clientes/ClienteTimeline';

export default function ClienteTimelineTab({ clienteId, usuarios = [] }) {
  return (
    <div className="space-y-6">
      <ClienteTimeline
        clienteId={clienteId}
        usuarios={usuarios}
        limit={30}
      />
    </div>
  );
}
