-- ====================================================================
-- 🔄 MÓDULO AUDITORÍA - TRIGGERS AUTOMÁTICOS
-- ====================================================================
--
-- PROPÓSITO:
-- Triggers que automatizan validaciones, enriquecimiento de metadata
-- y generación de códigos únicos en eventos del sistema.
--
-- COMPONENTES:
-- • 2 triggers automáticos (validación + generación de código)
--
-- CARACTERÍSTICAS:
-- ✅ Validación de coherencia organizacional
-- ✅ Enriquecimiento automático de metadata
-- ✅ Generación de códigos únicos para eventos críticos
-- ✅ Se ejecutan antes de INSERT/UPDATE
--
-- ORDEN DE EJECUCIÓN:
-- BEFORE INSERT:
--   1. trigger_validar_evento_coherencia (valida coherencia + enriquece)
--   2. trigger_generar_codigo_evento (genera código único)
--   3. INSERT ejecutado
--
-- BEFORE UPDATE:
--   1. trigger_validar_evento_coherencia (valida coherencia + enriquece)
--   2. UPDATE ejecutado
--
-- ORDEN DE CARGA: #9 (después de funciones)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER 1: VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
-- ====================================================================
-- Se ejecuta: BEFORE INSERT OR UPDATE
-- Función: validar_evento_coherencia()
-- Validaciones:
-- • Cita pertenece a la organización
-- • Cliente pertenece a la organización
-- • Profesional pertenece a la organización
-- • Usuario pertenece a la organización (excepto logins/super_admin)
-- Enriquecimiento:
-- • Agrega timestamp_unix, dia_semana, es_fin_semana al metadata
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_validar_evento_coherencia
    BEFORE INSERT OR UPDATE ON eventos_sistema
    FOR EACH ROW EXECUTE FUNCTION validar_evento_coherencia();

COMMENT ON TRIGGER trigger_validar_evento_coherencia ON eventos_sistema IS
'Valida coherencia organizacional de eventos y enriquece metadata automáticamente.
Función: validar_evento_coherencia()
Validaciones:
  - Cita pertenece a la organización
  - Cliente pertenece a la organización
  - Profesional pertenece a la organización
  - Usuario pertenece a la organización (excepto logins y super_admin)
Enriquecimiento automático de metadata:
  - timestamp_unix: UNIX timestamp del evento
  - dia_semana: Día de la semana (0-6)
  - es_fin_semana: Boolean si es sábado o domingo
  - validado_coherencia: true (flag de validación)
Se ejecuta BEFORE INSERT OR UPDATE.';

-- ====================================================================
-- TRIGGER 2: GENERACIÓN DE CÓDIGO ÚNICO
-- ====================================================================
-- Se ejecuta: BEFORE INSERT
-- Función: generar_codigo_evento()
-- Genera código único para:
-- • Eventos con gravedad error/critical
-- • Eventos importantes: pago_exitoso, pago_fallido, cita_creada, organizacion_creada
-- Formato: EVT_[ORG]_[TIPO]_[TIMESTAMP]_[RANDOM]
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_generar_codigo_evento
    BEFORE INSERT ON eventos_sistema
    FOR EACH ROW EXECUTE FUNCTION generar_codigo_evento();

COMMENT ON TRIGGER trigger_generar_codigo_evento ON eventos_sistema IS
'Genera código único para eventos críticos e importantes.
Función: generar_codigo_evento()
Aplica a:
  - Eventos con gravedad error/critical
  - Eventos: pago_exitoso, pago_fallido, cita_creada, organizacion_creada
Formato del código: EVT_[ORG]_[TIPO]_[TIMESTAMP]_[RANDOM]
Ejemplo: EVT_123_PAGO_EXI_20251117143052_042
El código se almacena en metadata.codigo_evento
Se ejecuta BEFORE INSERT.';

-- ====================================================================
-- 📊 RESUMEN DE TRIGGERS
-- ====================================================================
-- Total: 2 triggers automáticos
--
-- Por momento de ejecución:
-- • 2 BEFORE triggers (validación + generación)
-- • 0 AFTER triggers
--
-- Por operación:
-- • INSERT: 2 triggers (validación + generación)
-- • UPDATE: 1 trigger (validación)
-- • DELETE: 0 triggers
--
-- Orden de ejecución en INSERT:
-- 1. BEFORE: trigger_validar_evento_coherencia
--    - Valida coherencia organizacional
--    - Enriquece metadata con info temporal
-- 2. BEFORE: trigger_generar_codigo_evento
--    - Genera código único si aplica
--    - Agrega código a metadata
-- 3. INSERT ejecutado en la base de datos
--
-- Orden de ejecución en UPDATE:
-- 1. BEFORE: trigger_validar_evento_coherencia
--    - Valida coherencia organizacional
--    - Enriquece metadata con info temporal
-- 2. UPDATE ejecutado en la base de datos
--
-- Impacto en performance:
-- • Validación: ~1-2ms por evento (consultas simples)
-- • Generación código: ~0.5ms por evento crítico
-- • Total overhead: ~1.5-2.5ms por INSERT
-- • Acceptable para sistema de auditoría enterprise
--
-- Beneficios:
-- • Garantiza integridad referencial organizacional
-- • Enriquece metadata automáticamente
-- • Facilita tracking de eventos críticos
-- • Mejora debugging y troubleshooting
-- • Cumple requisitos de compliance
-- ====================================================================
