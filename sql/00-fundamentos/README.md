# Módulo: Fundamentos

## Descripción

Componentes base del sistema: extensiones PostgreSQL, tipos personalizados (ENUMs) y funciones helper globales utilizadas por todos los módulos del sistema.

Este es el módulo fundamental que debe ejecutarse **primero** antes que cualquier otro módulo.

## Archivos

### 01-extensiones.sql
Extensiones de PostgreSQL requeridas por el sistema:
- **pg_trgm** - Búsqueda fuzzy mediante trigramas (similarity, word_similarity)
- **unaccent** - Normalización de texto sin acentos
- **pgcrypto** - Funciones criptográficas (gen_random_bytes, crypt, gen_salt)

### 02-tipos-enums.sql
ENUMs y tipos personalizados globales:
- **rol_usuario** (6 niveles) - super_admin, admin, propietario, empleado, cliente, bot
- **industria_tipo** (11 sectores) - barberia, salon_belleza, estetica, spa, etc.
- **plan_tipo** (4 planes) - trial, basico, profesional, custom
- **estado_subscripcion** (5 estados) - activa, suspendida, cancelada, trial, morosa
- **estado_cita** (6 estados) - pendiente, confirmada, en_curso, completada, cancelada, no_asistio
- **estado_franja** (4 estados) - disponible, reservado_temporal, ocupado, bloqueado
- **tipo_profesional** (33 tipos) - barbero, estilista, podologo, veterinario, etc.
- **plataforma_chatbot** (7 plataformas) - telegram, whatsapp_oficial, instagram, etc.

### 03-funciones-utilidad.sql
Funciones helper globales usadas por múltiples módulos:
- **actualizar_timestamp()** - Trigger function para actualizar campo `actualizado_en` automáticamente
- **normalizar_telefono()** - Normalización de números telefónicos (remove caracteres especiales y códigos de país)

## Dependencias

**Ninguna** - Este es el módulo base del sistema.

## Usado por

**Todos los módulos del sistema:**
- nucleo/
- catalogos/
- negocio/
- agendamiento/
- citas/
- bloqueos/
- comisiones/
- suscripciones/
- pagos/
- chatbots/
- auditoria/
- mantenimiento/
- marketplace/

## Orden de Ejecución

1. `01-extensiones.sql` - Primero (instalar extensiones)
2. `02-tipos-enums.sql` - Segundo (crear tipos)
3. `03-funciones-utilidad.sql` - Tercero (crear funciones globales)

Los archivos se ejecutan automáticamente en orden numérico.

## Notas Importantes

- ⚠️ **NO modificar ENUMs existentes** sin crear migración - puede romper datos existentes
- ✅ **Agregar nuevos valores a ENUMs** es seguro si se hace al final
- 🔧 **Funciones IMMUTABLE** (como normalizar_telefono) pueden usarse en índices
- 📋 **Función actualizar_timestamp** es usada por triggers en prácticamente todas las tablas

## Migrado desde

Este módulo fue creado durante el refactoring SQL modular (Noviembre 2025):
- Extensiones: `schema/02-functions.sql` (líneas 25-33)
- ENUMs: `schema/01-types-and-enums.sql` (completo)
- Funciones: `schema/02-functions.sql` (actualizar_timestamp, normalizar_telefono)

## Versión

**1.0** - Migración inicial completada el 16 de Noviembre 2025
