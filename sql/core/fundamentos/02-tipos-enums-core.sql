-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - TIPOS Y ENUMERACIONES CORE
-- ====================================================================
--
-- Descripción: ENUMs GENÉRICOS para cualquier SaaS multi-tenant
-- Dependencias: Ninguna (archivo base)
-- Orden: 02 (después de extensiones)
--
-- ⚠️ IMPORTANTE: SOLO incluir ENUMs UNIVERSALES
-- ENUMs específicos de dominio van en templates/
--
-- Contenido:
-- - rol_usuario ENUM (6 niveles de acceso - UNIVERSAL)
-- - plan_tipo ENUM (4 planes de subscripción - UNIVERSAL)
-- - estado_subscripcion ENUM (5 estados - UNIVERSAL)
-- - plataforma_chatbot ENUM (7 plataformas - UNIVERSAL)
--
-- ❌ REMOVIDOS (movidos a templates/):
-- - industria_tipo → tabla dinámica categorias_industria
-- - estado_cita → templates/scheduling-saas/
-- - estado_franja → templates/scheduling-saas/
-- - tipo_profesional → tabla dinámica en templates/
--
-- Fecha creación: 18 Noviembre 2025 (Refactor para SaaS Starter Kit)
-- ====================================================================

-- ====================================================================
-- 👥 ENUM ROL_USUARIO - ELIMINADO (FASE 7 - Ene 2026)
-- ====================================================================
-- El tipo ENUM rol_usuario fue eliminado como parte de la FASE 7 de limpieza.
-- El sistema ahora usa exclusivamente la tabla `roles` con `rol_id`.
-- Ver: sql/nucleo/16-tabla-roles.sql
-- ====================================================================

-- ====================================================================
-- DEPRECATED (Ene 2026): -- 💰 ENUM PLAN_TIPO - PLANES DE SUBSCRIPCIÓN SAAS
-- DEPRECATED (Ene 2026): -- ====================================================================
-- DEPRECATED (Ene 2026): -- Modelo de Negocio (Nov 2025):
-- DEPRECATED (Ene 2026): -- • free: 1 App gratis a elegir, usuarios ilimitados
-- DEPRECATED (Ene 2026): -- • pro: Todas las apps, $249 MXN/usuario/mes
-- DEPRECATED (Ene 2026): -- • custom: Plan personalizado (precio negociado)
-- DEPRECATED (Ene 2026): -- • trial: Período de prueba 14 días
-- DEPRECATED (Ene 2026): -- • basico/profesional: LEGACY (inactivos)
-- DEPRECATED (Ene 2026): --
-- DEPRECATED (Ene 2026): -- 💡 NOTA: Los límites específicos se definen en tabla planes_subscripcion
-- DEPRECATED (Ene 2026): -- ────────────────────────────────────────────────────────────────────
-- DEPRECATED (Ene 2026): CREATE TYPE plan_tipo AS ENUM (
-- DEPRECATED (Ene 2026):     'trial',              -- Plan de prueba gratuito (14 días)
-- DEPRECATED (Ene 2026):                           -- • Acceso a todas las apps para evaluar
-- DEPRECATED (Ene 2026):                           -- • Límites reducidos
-- DEPRECATED (Ene 2026):                           -- • Sin compromiso de pago
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'free',               -- Plan Free: 1 App gratis a elegir
-- DEPRECATED (Ene 2026):                           -- • Usuario elige: Agendamiento, Inventario o POS
-- DEPRECATED (Ene 2026):                           -- • Sin límites dentro de la app elegida
-- DEPRECATED (Ene 2026):                           -- • Usuarios ilimitados, para siempre
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'pro',                -- Plan Pro: Todas las apps incluidas
-- DEPRECATED (Ene 2026):                           -- • $249 MXN/usuario/mes (~$15 USD)
-- DEPRECATED (Ene 2026):                           -- • Sin límites
-- DEPRECATED (Ene 2026):                           -- • Soporte prioritario
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'basico',             -- [LEGACY] Plan básico para negocios pequeños
-- DEPRECATED (Ene 2026):                           -- • NO disponible para nuevos clientes
-- DEPRECATED (Ene 2026):                           -- • Solo clientes existentes
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'profesional',        -- [LEGACY] Plan avanzado para negocios en crecimiento
-- DEPRECATED (Ene 2026):                           -- • NO disponible para nuevos clientes
-- DEPRECATED (Ene 2026):                           -- • Solo clientes existentes
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'custom'              -- Plan personalizado con características específicas
-- DEPRECATED (Ene 2026):                           -- • Límites personalizados
-- DEPRECATED (Ene 2026):                           -- • Funcionalidades a medida
-- DEPRECATED (Ene 2026):                           -- • Precios negociados
-- DEPRECATED (Ene 2026): );
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026): COMMENT ON TYPE plan_tipo IS 
-- DEPRECATED (Ene 2026): 'Tipos de planes de subscripción disponibles en el sistema. 
-- DEPRECATED (Ene 2026): Los límites específicos (usuarios, recursos, etc.) se configuran 
-- DEPRECATED (Ene 2026): en la tabla planes_subscripcion.';
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026): -- ====================================================================
-- DEPRECATED (Ene 2026): -- 📊 ENUM ESTADO_SUBSCRIPCION - CICLO DE VIDA DE SUBSCRIPCIONES
-- DEPRECATED (Ene 2026): -- ====================================================================
-- DEPRECATED (Ene 2026): -- Controla el estado actual de la subscripción de cada organización.
-- DEPRECATED (Ene 2026): -- Impacta directamente en el acceso a funcionalidades del sistema.
-- DEPRECATED (Ene 2026): -- ────────────────────────────────────────────────────────────────────
-- DEPRECATED (Ene 2026): CREATE TYPE estado_subscripcion AS ENUM (
-- DEPRECATED (Ene 2026):     'activa',             -- Subscripción pagada y funcional
-- DEPRECATED (Ene 2026):                           -- • Acceso completo según el plan
-- DEPRECATED (Ene 2026):                           -- • Todas las funcionalidades disponibles
-- DEPRECATED (Ene 2026):                           -- • Sin restricciones
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'suspendida',         -- Temporalmente suspendida
-- DEPRECATED (Ene 2026):                           -- • Acceso de solo lectura
-- DEPRECATED (Ene 2026):                           -- • No se pueden crear nuevos recursos
-- DEPRECATED (Ene 2026):                           -- • Motivo: problemas técnicos o administrativos
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'cancelada',          -- Cancelada por el cliente
-- DEPRECATED (Ene 2026):                           -- • Acceso limitado a exportación de datos
-- DEPRECATED (Ene 2026):                           -- • No se pueden crear recursos
-- DEPRECATED (Ene 2026):                           -- • Datos se preservan según política
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'trial',              -- En período de prueba gratuito
-- DEPRECATED (Ene 2026):                           -- • Acceso completo según límites de trial
-- DEPRECATED (Ene 2026):                           -- • Fecha de expiración definida
-- DEPRECATED (Ene 2026):                           -- • Conversión automática o manual a plan pago
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026):     'morosa'              -- Falta de pago, acceso limitado
-- DEPRECATED (Ene 2026):                           -- • Solo lectura
-- DEPRECATED (Ene 2026):                           -- • Notificaciones de pago pendiente
-- DEPRECATED (Ene 2026):                           -- • Suspensión automática tras período de gracia
-- DEPRECATED (Ene 2026): );
-- DEPRECATED (Ene 2026): 
-- DEPRECATED (Ene 2026): COMMENT ON TYPE estado_subscripcion IS 
-- DEPRECATED (Ene 2026): 'Estados del ciclo de vida de una subscripción. 
-- DEPRECATED (Ene 2026): Determina el nivel de acceso y restricciones aplicadas 
-- DEPRECATED (Ene 2026): a la organización en el sistema.';
-- DEPRECATED (Ene 2026): 
-- ====================================================================
-- 🤖 ENUM PLATAFORMA_CHATBOT - PLATAFORMAS DE MENSAJERÍA
-- ====================================================================
-- Define las plataformas de chatbot soportadas para integraciones.
-- Usado en configuración de chatbots y credenciales.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plataforma_chatbot AS ENUM (
    'telegram',           -- Telegram Bot API
                          -- • Bot token-based
                          -- • Webhooks o polling
                          -- • Rich media support

    'whatsapp',           -- WhatsApp Business Cloud API
                          -- • Meta Graph API v18.0+
                          -- • Webhooks obligatorios
                          -- • Plantillas pre-aprobadas

    'messenger',          -- Facebook Messenger
                          -- • Meta Graph API
                          -- • Webhooks
                          -- • Integración con páginas FB

    'instagram',          -- Instagram Direct Messages
                          -- • Meta Graph API
                          -- • Webhooks
                          -- • Integración con perfiles comerciales

    'discord',            -- Discord Bot API
                          -- • Bot token-based
                          -- • Gateway + REST API
                          -- • Slash commands support

    'slack',              -- Slack Bot API
                          -- • OAuth 2.0
                          -- • Webhooks + Events API
                          -- • App integrations

    'custom'              -- Plataforma personalizada o API genérica
                          -- • Configuración manual
                          -- • Webhooks custom
);

COMMENT ON TYPE plataforma_chatbot IS 
'Plataformas de mensajería soportadas para chatbots con IA. 
Cada plataforma tiene sus propios requisitos de configuración 
y credenciales en la tabla chatbot_credentials.';

-- ====================================================================
-- 👷 ENUM TIPO_EMPLEADO - ELIMINADO (Dic 2025)
-- ====================================================================
-- NOTA: Este ENUM fue eliminado porque no tenía función práctica.
-- La jerarquía de supervisión ahora se determina por el ROL del usuario:
--   - admin/propietario pueden supervisar
--   - empleado no puede supervisar
-- ====================================================================

-- ====================================================================
-- 📋 ENUM ESTADO_LABORAL - ESTADO DEL EMPLEADO
-- ====================================================================
-- Estados del ciclo laboral del empleado.
-- Impacta en disponibilidad para citas y acceso al sistema.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_laboral AS ENUM (
    'activo',             -- Trabajando normalmente
                          -- • Puede atender citas
                          -- • Acceso completo según rol

    'vacaciones',         -- En período vacacional
                          -- • No disponible para citas
                          -- • Sin acceso temporal al sistema

    'incapacidad',        -- Incapacidad médica
                          -- • No disponible para citas
                          -- • Puede tener acceso limitado

    'suspendido',         -- Suspensión temporal
                          -- • No disponible para citas
                          -- • Sin acceso al sistema

    'baja'                -- Ya no trabaja en la organización
                          -- • Registro histórico
                          -- • Sin acceso al sistema
                          -- • Requiere fecha_baja
);

COMMENT ON TYPE estado_laboral IS
'Estados del ciclo laboral del empleado. Impacta disponibilidad y acceso.
Estado "baja" requiere fecha_baja obligatoria.';

-- ====================================================================
-- 📄 ENUM TIPO_CONTRATACION - TIPO DE CONTRATO
-- ====================================================================
-- Modalidad de contratación del empleado.
-- Para gestión de nómina y RRHH.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE tipo_contratacion AS ENUM (
    'tiempo_completo',    -- Jornada completa (40+ hrs/semana)
                          -- • Beneficios completos
                          -- • Salario fijo mensual

    'medio_tiempo',       -- Media jornada (20 hrs/semana aprox)
                          -- • Beneficios proporcionales
                          -- • Horario reducido

    'temporal',           -- Contrato temporal
                          -- • Fecha de término definida
                          -- • Para cubrir ausencias o proyectos

    'contrato',           -- Por contrato/proyecto
                          -- • Entregables específicos
                          -- • Duración definida

    'freelance'           -- Independiente
                          -- • Honorarios por servicio
                          -- • Sin relación laboral formal
);

COMMENT ON TYPE tipo_contratacion IS
'Modalidad de contratación del empleado. Para gestión de nómina y RRHH.';

-- ====================================================================
-- 👤 ENUM GENERO - GÉNERO DEL EMPLEADO
-- ====================================================================
-- Género para información personal del empleado.
-- Opcional, con opción de no especificar.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE genero AS ENUM (
    'masculino',          -- Masculino
    'femenino',           -- Femenino
    'otro',               -- Otro / No binario
    'no_especificado'     -- Prefiere no especificar (default)
);

COMMENT ON TYPE genero IS
'Género del empleado. Campo opcional con default "no_especificado".';

-- ====================================================================
-- 📝 NOTAS FINALES
-- ====================================================================
-- • Estos ENUMs son UNIVERSALES para cualquier SaaS
-- • NO agregar ENUMs específicos de dominio aquí
-- • Para ENUMs de dominio, usar carpeta templates/
-- • Para catálogos dinámicos, usar tablas en lugar de ENUMs
-- ====================================================================
