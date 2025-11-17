-- ====================================================================
-- MÓDULO NÚCLEO: DATOS INICIALES
-- ====================================================================
-- Datos de configuración inicial del sistema:
-- • Planes de subscripción (básico, profesional, custom)
--
-- Migrado de: sql/schema/10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- DATOS INICIALES: PLANES DE SUBSCRIPCIÓN
-- ====================================================================
-- Inserta los 3 planes base del SaaS:
-- • basico: Para negocios pequeños (5 profesionales, 200 clientes)
-- • profesional: Para negocios en crecimiento (15 profesionales, 1000 clientes)
-- • custom: Plan personalizado (sin límites, precio negociado)
-- ====================================================================

INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion, precio_mensual, precio_anual,
    limite_profesionales, limite_clientes, limite_servicios, limite_usuarios, limite_citas_mes,
    funciones_habilitadas, orden_display
) VALUES
-- Plan Básico
('basico', 'Plan Básico', 'Perfecto para negocios pequeños', 299.00, 2990.00,
 5, 200, 15, 3, 200,
 '{"whatsapp_integration": true, "advanced_reports": false, "custom_branding": false, "api_access": false}', 1),

-- Plan Professional
('profesional', 'Plan Professional', 'Para negocios en crecimiento', 599.00, 5990.00,
 15, 1000, 50, 8, 800,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": false}', 2),

-- Plan Custom (para necesidades específicas)
('custom', 'Plan Personalizado', 'Plan a medida para organizaciones con necesidades específicas', 0.00, NULL,
 NULL, NULL, NULL, NULL, NULL,
 '{"whatsapp_integration": true, "advanced_reports": true, "custom_branding": true, "api_access": true, "priority_support": true, "dedicated_support": true, "sla_guarantee": true, "custom_features": true}', 3)
ON CONFLICT (codigo_plan) DO NOTHING;

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE planes_subscripcion IS
'Planes de subscripción base del SaaS.
- basico: Para negocios pequeños (5 profesionales)
- profesional: Para negocios en crecimiento (15 profesionales)
- custom: Plan personalizado sin límites (precio negociado)';
