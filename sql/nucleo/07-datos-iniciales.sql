-- ====================================================================
-- MÓDULO NÚCLEO: DATOS INICIALES
-- ====================================================================
-- Datos de configuración inicial del sistema:
-- • Planes de subscripción (trial, pro, custom)
--
-- Modelo de Negocio (Dic 2025):
-- • Trial: 14 días de prueba con acceso completo
-- • Pro: Todas las apps, $249 MXN/usuario/mes
-- • Custom: Plan personalizado (precio negociado)
--
-- Migrado de: sql/schema/10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- Actualización: 3 Diciembre 2025 - Modelo Trial/Pro (sin Free)
-- ====================================================================

-- ====================================================================
-- DATOS INICIALES: PLANES DE SUBSCRIPCIÓN
-- ====================================================================

INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion,
    precio_mensual, precio_anual, precio_por_usuario, moneda,
    limite_profesionales, limite_clientes, limite_servicios,
    limite_usuarios, limite_citas_mes, limite_sucursales,
    limite_eventos_activos, limite_invitados_por_evento, limite_fotos_galeria_evento,
    funciones_habilitadas, activo, orden_display
) VALUES

-- ============================================================
-- Plan Trial: Período de prueba (14 días)
-- ============================================================
-- Acceso temporal a todas las apps para evaluar
-- Después del trial: suscribirse a Pro
-- ============================================================
('trial', 'Trial',
 'Período de prueba de 14 días. Acceso completo para evaluar.',
 0.00, NULL, NULL, 'MXN',
 3, 50, 10, 2, 50, 1,  -- Límites para trial (1 sucursal)
 1, 50, 5,  -- Eventos: 1 activo, 50 invitados, 5 fotos galería
 '{
   "soporte_email": true,
   "soporte_chat": false,
   "api_access": false,
   "custom_branding": false,
   "whatsapp": true,
   "reportes_avanzados": false
 }'::jsonb,
 TRUE, 0),

-- ============================================================
-- Plan Pro: Todas las apps incluidas
-- ============================================================
-- $249 MXN/usuario/mes (~$15 USD)
-- Todas las apps: Agendamiento, Inventario, POS, Marketplace,
--                 Comisiones, Chatbots IA
-- Hasta 10 sucursales
-- ============================================================
('pro', 'Pro',
 'Todas las apps incluidas. $249 MXN por usuario al mes.',
 249.00, 2490.00, 249.00, 'MXN',  -- precio_por_usuario = $249
 NULL, NULL, NULL, NULL, NULL, 10,  -- Sin límites, 10 sucursales
 NULL, NULL, 50,  -- Eventos: ilimitados, invitados ilimitados, 50 fotos galería
 '{
   "soporte_email": true,
   "soporte_chat": true,
   "soporte_prioritario": true,
   "api_access": true,
   "custom_branding": true,
   "whatsapp": true,
   "reportes_avanzados": true,
   "marketplace": true,
   "comisiones": true,
   "chatbots_ia": true
 }'::jsonb,
 TRUE, 1),

-- ============================================================
-- Plan Custom: Empresarial / Personalizado
-- ============================================================
-- Para organizaciones grandes con necesidades específicas
-- Precio negociado, sucursales ilimitadas
-- ============================================================
('custom', 'Personalizado',
 'Plan a medida para organizaciones con necesidades específicas.',
 0.00, NULL, NULL, 'MXN',
 NULL, NULL, NULL, NULL, NULL, NULL,  -- Sin límites (sucursales ilimitadas)
 NULL, NULL, 100,  -- Eventos: ilimitados, invitados ilimitados, 100 fotos galería
 '{
   "soporte_email": true,
   "soporte_chat": true,
   "soporte_prioritario": true,
   "soporte_dedicado": true,
   "api_access": true,
   "custom_branding": true,
   "whatsapp": true,
   "reportes_avanzados": true,
   "marketplace": true,
   "comisiones": true,
   "chatbots_ia": true,
   "sla_garantizado": true,
   "features_custom": true
 }'::jsonb,
 TRUE, 2)

ON CONFLICT (codigo_plan) DO UPDATE SET
    nombre_plan = EXCLUDED.nombre_plan,
    descripcion = EXCLUDED.descripcion,
    precio_mensual = EXCLUDED.precio_mensual,
    precio_anual = EXCLUDED.precio_anual,
    precio_por_usuario = EXCLUDED.precio_por_usuario,
    limite_profesionales = EXCLUDED.limite_profesionales,
    limite_clientes = EXCLUDED.limite_clientes,
    limite_servicios = EXCLUDED.limite_servicios,
    limite_usuarios = EXCLUDED.limite_usuarios,
    limite_citas_mes = EXCLUDED.limite_citas_mes,
    limite_sucursales = EXCLUDED.limite_sucursales,
    limite_eventos_activos = EXCLUDED.limite_eventos_activos,
    limite_invitados_por_evento = EXCLUDED.limite_invitados_por_evento,
    limite_fotos_galeria_evento = EXCLUDED.limite_fotos_galeria_evento,
    funciones_habilitadas = EXCLUDED.funciones_habilitadas,
    activo = EXCLUDED.activo,
    orden_display = EXCLUDED.orden_display,
    actualizado_en = NOW();

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE planes_subscripcion IS
'Planes de subscripción del SaaS (Modelo Dic 2025):
- trial: Período de prueba 14 días con límites
- pro: Todas las apps, $249 MXN/usuario/mes (~$15 USD), sin límites
- custom: Plan personalizado (precio negociado)';


-- ====================================================================
-- NOTA: SUPER_ADMIN SIN ORGANIZACIÓN (Nov 2025)
-- ====================================================================
-- El super_admin es un usuario de plataforma que NO pertenece a ninguna
-- organización. Gestiona todas las organizaciones desde /superadmin/*.
-- Las organizaciones se crean cuando usuarios normales se registran.
-- ====================================================================
