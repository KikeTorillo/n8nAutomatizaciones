-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - EXTENSIONES DE POSTGRESQL
-- ====================================================================
--
-- Descripción: Extensiones necesarias para el sistema
-- Dependencias: Ninguna (primer archivo a ejecutar)
-- Orden: 01
--
-- Contenido:
-- - pg_trgm (búsqueda fuzzy y similitud de texto)
-- - unaccent (normalización de texto sin acentos)
-- - pgcrypto (funciones criptográficas)
-- ====================================================================

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
