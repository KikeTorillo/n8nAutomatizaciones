-- ====================================================================
-- TEMPLATE: SCHEDULING SAAS - ENUMS DE DOMINIO
-- ====================================================================
--
-- Descripción: ENUMs ESPECÍFICOS para sistemas de agendamiento
-- Dependencias: sql/core/fundamentos/02-tipos-enums-core.sql
-- Orden: 01 (primero después de core)
--
-- ⚠️ IMPORTANTE: Estos ENUMs SON ESPECÍFICOS de agendamiento
-- NO incluir en el core universal del starter kit
--
-- Contenido:
-- - estado_cita ENUM (6 estados del ciclo de vida de citas)
-- - estado_franja ENUM (4 estados de disponibilidad horaria)
--
-- ❌ REMOVIDOS (usar tablas dinámicas):
-- - industria_tipo → tabla categorias_industria (core + seeds)
-- - tipo_profesional → tabla tipos_profesional (catálogos)
--
-- Fecha creación: 18 Noviembre 2025 (Extraído desde core)
-- ====================================================================

-- ====================================================================
-- 📅 ENUM ESTADO_CITA - CICLO DE VIDA DE CITAS
-- ====================================================================
-- Define los 6 estados posibles de una cita desde su creación
-- hasta su finalización. Usado para workflow y reportes.
--
-- 🔄 FLUJO TÍPICO:
-- pendiente → confirmada → en_curso → completada
--          ↓
--       cancelada / no_asistio
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_cita AS ENUM (
    'pendiente',          -- Cita creada, esperando confirmación
                          -- • Estado inicial al crear
                          -- • Cliente puede confirmar o cancelar
                          -- • Recordatorios automáticos activos

    'confirmada',         -- Cita confirmada por el cliente
                          -- • Cliente confirmó asistencia
                          -- • Bloquea el horario definitivamente
                          -- • Recordatorios pre-cita activos

    'en_curso',           -- Cita en progreso (cliente presente)
                          -- • Servicio iniciado
                          -- • Timer activo
                          -- • No se puede cancelar

    'completada',         -- Cita finalizada exitosamente
                          -- • Servicio completado
                          -- • Puede generar factura
                          -- • Dispara cálculo de comisiones
                          -- • Habilita sistema de reseñas

    'cancelada',          -- Cita cancelada (por cliente o negocio)
                          -- • Horario liberado
                          -- • Notificación enviada
                          -- • Se puede crear nueva cita

    'no_asistio'          -- Cliente no se presentó (no-show)
                          -- • Penalización opcional
                          -- • Horario liberado (tarde)
                          -- • Registro para estadísticas
);

COMMENT ON TYPE estado_cita IS 
'Estados del ciclo de vida de una cita en el sistema de agendamiento. 
Controla el flujo desde la creación hasta la finalización o cancelación. 
Usado en validaciones, notificaciones y reportes.';

-- ====================================================================
-- ⏰ ENUM ESTADO_FRANJA - DISPONIBILIDAD HORARIA
-- ====================================================================
-- Controla la disponibilidad de franjas horarias específicas.
-- Usado para el sistema de reservas y gestión de calendario.
--
-- 💡 NOTA: Complementa el sistema de bloqueos de horarios
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_franja AS ENUM (
    'disponible',         -- Franja libre para agendar
                          -- • Horario profesional activo
                          -- • Sin citas ni bloqueos
                          -- • Visible en calendario público

    'reservado_temporal', -- Reserva temporal (carrito de compras)
                          -- • Bloqueado por X minutos
                          -- • Permite completar checkout
                          -- • Se libera automáticamente si expira

    'ocupado',            -- Franja con cita confirmada
                          -- • Cita en estado confirmada/en_curso
                          -- • No se puede reservar
                          -- • Visible solo para el negocio

    'bloqueado'           -- Franja bloqueada (descanso, mantenimiento)
                          -- • Bloqueo manual del negocio
                          -- • No se puede reservar
                          -- • Puede tener motivo asociado
);

COMMENT ON TYPE estado_franja IS 
'Estados de disponibilidad de franjas horarias para el sistema de reservas. 
Controla qué slots están disponibles para nuevas citas y gestiona 
reservas temporales durante el proceso de checkout.';

-- ====================================================================
-- 📝 NOTAS DE MIGRACIÓN
-- ====================================================================
--
-- INDUSTRIA_TIPO (ELIMINADO):
-- ────────────────────────────────────────────────────────────────────
-- El ENUM industria_tipo fue reemplazado por la tabla dinámica
-- categorias_industria en el core. Para sistemas de agendamiento,
-- usar el script de seeds correspondiente:
--
-- Ver: templates/scheduling-saas/sql/seeds/categorias-agendamiento.sql
--
-- Categorías específicas de agendamiento:
-- - barberia, salon_belleza, estetica, spa
-- - podologia, consultorio_medico, academia
-- - taller_tecnico, centro_fitness, veterinaria
--
-- TIPO_PROFESIONAL (ELIMINADO):
-- ────────────────────────────────────────────────────────────────────
-- El ENUM tipo_profesional fue reemplazado por la tabla dinámica
-- tipos_profesional que ya existía en sql/catalogos/
--
-- Ver: templates/scheduling-saas/sql/02-catalogos.sql
--
-- Esta tabla permite:
-- - 33+ tipos predefinidos por industria
-- - Tipos custom definidos por cada organización
-- - Validación automática industria ↔ tipo profesional
--
-- ====================================================================
-- 🔄 RETROCOMPATIBILIDAD
-- ====================================================================
-- Si migras desde versión anterior con industria_tipo ENUM:
--
-- 1. Ejecutar: templates/scheduling-saas/sql/migrate-industrias.sql
-- 2. Migrar datos: UPDATE organizaciones SET categoria_industria_id = ...
-- 3. Eliminar columna: ALTER TABLE organizaciones DROP COLUMN tipo_industria
--
-- ====================================================================
