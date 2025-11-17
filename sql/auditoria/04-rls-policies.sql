-- ====================================================================
-- 🛡️ MÓDULO AUDITORÍA - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- PROPÓSITO:
-- Implementación de seguridad a nivel de fila para aislamiento
-- automático entre organizaciones en el sistema de auditoría.
--
-- COMPONENTES:
-- • 1 política RLS unificada para todos los tipos de acceso
--
-- CARACTERÍSTICAS:
-- ✅ Aislamiento multi-tenant por organizacion_id
-- ✅ Acceso total para super_admin
-- ✅ Usuarios ven eventos de su organización
-- ✅ Usuarios ven sus propios eventos personales
-- ✅ Bypass para funciones de sistema
--
-- SEGURIDAD:
-- • Cada organización solo accede a sus propios eventos
-- • Super admin tiene visibilidad global
-- • Usuarios pueden ver eventos donde son el actor
-- • Funciones del sistema pueden operar sin restricciones
--
-- ORDEN DE CARGA: #9 (después de índices)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN LA TABLA
-- ====================================================================

ALTER TABLE eventos_sistema ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICA: ACCESO MULTI-TENANT A EVENTOS
-- ====================================================================
-- Política unificada que controla SELECT, INSERT, UPDATE, DELETE
-- con múltiples criterios de acceso
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY eventos_sistema_tenant_access ON eventos_sistema
    FOR ALL                                   -- SELECT, INSERT, UPDATE, DELETE
    TO saas_app                              -- Usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: SUPER ADMIN - ACCESO TOTAL AL SISTEMA              │
        -- └─────────────────────────────────────────────────────────────┘
        current_setting('app.current_user_role', true) = 'super_admin'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: BYPASS PARA FUNCIONES DE SISTEMA                   │
        -- └─────────────────────────────────────────────────────────────┘
        OR current_setting('app.bypass_rls', true) = 'true'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: AISLAMIENTO POR ORGANIZACIÓN (MULTI-TENANT)        │
        -- └─────────────────────────────────────────────────────────────┘
        OR organizacion_id::TEXT = current_setting('app.current_tenant_id', true)

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 4: USUARIO VE SUS PROPIOS EVENTOS                     │
        -- └─────────────────────────────────────────────────────────────┘
        OR (usuario_id IS NOT NULL AND
            usuario_id::TEXT = current_setting('app.current_user_id', true))
    );

COMMENT ON POLICY eventos_sistema_tenant_access ON eventos_sistema IS
'Acceso a eventos del sistema con múltiples criterios:
- Super admin: Acceso global a todos los eventos
- Usuario de organización: Eventos de su organización
- Usuario específico: Eventos donde es el actor (usuario_id)
- Bypass: Funciones de logging y auditoría

Crítico para: Auditoría, seguridad, debugging, compliance.';

-- ====================================================================
-- 📊 RESUMEN DE POLÍTICAS RLS
-- ====================================================================
-- Total: 1 política unificada
--
-- Cobertura:
-- • SELECT: ✅ Todos los casos de acceso
-- • INSERT: ✅ Validación organizacional
-- • UPDATE: ✅ Mismas reglas que SELECT
-- • DELETE: ✅ Restringido por organización
--
-- Criterios de acceso (4 casos):
-- 1. Super admin → Todo el sistema
-- 2. Bypass RLS → Funciones automáticas
-- 3. Organización → Eventos de la org
-- 4. Usuario personal → Eventos propios
--
-- Contexto requerido:
-- • app.current_tenant_id: ID de la organización
-- • app.current_user_role: Rol del usuario
-- • app.current_user_id: ID del usuario
-- • app.bypass_rls: Flag de bypass (opcional)
--
-- Configuración:
-- SET LOCAL app.current_tenant_id = '123';
-- SET LOCAL app.current_user_role = 'admin';
-- SET LOCAL app.current_user_id = '456';
-- SET LOCAL app.bypass_rls = 'true';  -- Solo sistema
--
-- Uso en logging/auditoría:
-- Funciones de sistema deben usar bypass_rls=true
-- para registrar eventos sin restricciones
-- ====================================================================
