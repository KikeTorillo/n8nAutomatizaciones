-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - EXTENSIONES DE POSTGRESQL
-- ====================================================================
--
-- Descripción: Extensiones necesarias para el sistema
-- Dependencias: Ninguna (primer archivo a ejecutar)
-- Orden: 01
--
-- Contenido:
-- - pg_cron (jobs automáticos - DEBE SER PRIMERO para healthcheck)
-- - pg_trgm (búsqueda fuzzy y similitud de texto)
-- - unaccent (normalización de texto sin acentos)
-- - pgcrypto (funciones criptográficas)
-- ====================================================================

-- ====================================================================
-- ⏰ EXTENSIÓN: PG_CRON (CRÍTICA - HEALTHCHECK)
-- ====================================================================
-- Jobs automáticos para mantenimiento del sistema
-- IMPORTANTE: Debe crearse primero para que el healthcheck de Docker pase
-- La tabla cron.job se crea automáticamente al instalar la extensión
-- Los jobs específicos se configuran en sql/mantenimiento/06-pg-cron.sql
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

COMMENT ON EXTENSION pg_cron IS
'Extensión para jobs programados (cron). Creada temprano para healthcheck Docker.';

-- ====================================================================
-- 🔍 EXTENSIÓN: PG_TRGM
-- ====================================================================
-- Proporciona funciones para búsqueda fuzzy mediante trigramas
-- Usado en: Búsqueda de clientes, profesionales, servicios
-- Funciones: similarity(), word_similarity(), índices GIN
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ====================================================================
-- 📝 EXTENSIÓN: UNACCENT
-- ====================================================================
-- Normalización de texto removiendo acentos y diacríticos
-- Usado en: Búsquedas insensibles a acentos
-- Funciones: unaccent()
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ====================================================================
-- 🔐 EXTENSIÓN: PGCRYPTO
-- ====================================================================
-- Funciones criptográficas para seguridad
-- Usado en: Generación de passwords, tokens, hashes
-- Funciones: gen_random_bytes(), crypt(), gen_salt()
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;
