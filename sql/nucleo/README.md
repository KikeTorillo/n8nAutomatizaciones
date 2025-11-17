# Módulo Núcleo - Sistema Multi-Tenant SaaS

## 📋 Descripción

Este módulo contiene las tablas y funciones fundamentales del sistema multi-tenant SaaS. Es el núcleo del sistema de subscripciones, facturación y gestión de organizaciones.

## 📁 Archivos del Módulo

| Archivo | Propósito | LOC |
|---------|-----------|-----|
| `01-tablas-core.sql` | Organizaciones y usuarios | ~150 |
| `02-tablas-subscripciones.sql` | Sistema completo de subscripciones | ~300 |
| `03-indices.sql` | Índices especializados para performance | ~150 |
| `04-rls-policies.sql` | Políticas de seguridad multi-tenant | ~200 |
| `05-funciones.sql` | Funciones PL/pgSQL para subscripciones | ~350 |
| `06-triggers.sql` | Triggers automáticos | ~100 |
| `07-datos-iniciales.sql` | Planes de subscripción iniciales | ~40 |

**Total**: ~1,290 líneas de código SQL

## 🏗️ Componentes Principales

### Tablas Core (01-tablas-core.sql)

1. **organizaciones**
   - Base del multi-tenancy
   - Cada organización = 1 tenant independiente
   - Campos clave: `codigo_tenant`, `slug`, `plan_actual`, `tipo_industria`

2. **usuarios**
   - Autenticación y autorización RBAC
   - Roles: `super_admin`, `admin`, `propietario`, `empleado`, `cliente`, `bot`
   - Vinculados a organizaciones (multi-tenant) o global (super_admin)

### Tablas de Subscripciones (02-tablas-subscripciones.sql)

1. **planes_subscripcion**
   - Definición normalizada de planes (3NF)
   - Límites por plan: profesionales, clientes, servicios, usuarios, citas/mes
   - Features habilitadas por plan (JSONB)

2. **metricas_uso_organizacion**
   - Contadores desnormalizados para performance
   - Actualizada automáticamente por triggers
   - Reseteo mensual automático para `uso_citas_mes_actual`

3. **subscripciones**
   - Datos de facturación específicos por organización
   - Trial de 14 días automático
   - Integración con gateway de pago (Mercado Pago)

4. **historial_subscripciones**
   - Auditoría completa de cambios
   - Análisis de churn y LTV
   - Registro de upgrades/downgrades/cancelaciones

### Índices Especializados (03-indices.sql)

- **11 índices para usuarios**: Login, búsqueda fuzzy, seguridad, tokens
- **3 índices para organizaciones**: Código tenant, slug, tipo industria
- **3 índices para planes**: Código, precio, MP plan ID
- **6 índices para subscripciones**: Organización, próximo pago, gateway
- **3 índices para historial**: Timeline, tipo evento, subscripción

**Estrategia**: Covering indexes + índices parciales + GIN compuestos

### Políticas RLS (04-rls-policies.sql)

1. **usuarios_unified_access**: Política unificada con 5 casos de acceso
   - Login context
   - Super admin
   - Bypass RLS
   - Self access
   - Tenant isolation

2. **tenant_isolation_organizaciones**: Aislamiento multi-tenant
   - Super admin: acceso global
   - Usuarios: solo su organización

3. **Políticas para subscripciones**: Aislamiento por organización
   - Lectura global para planes
   - Escritura solo super_admin

### Funciones PL/pgSQL (05-funciones.sql)

1. **verificar_limite_plan()**: Valida límites del plan antes de crear recursos
2. **tiene_caracteristica_habilitada()**: Verifica features por plan
3. **actualizar_metricas_uso()**: Trigger function para contadores
4. **registrar_cambio_subscripcion()**: Trigger function para auditoría

### Triggers Automáticos (06-triggers.sql)

- **1 trigger de métricas**: Usuarios (los demás se crean en sus módulos respectivos)
- **1 trigger de auditoría**: Historial de subscripciones
- **2 triggers de timestamps**: Organizaciones, usuarios

**NOTA**: Los triggers para profesionales, clientes, servicios y citas se crearán en sus respectivos módulos ya que esas tablas aún no existen en este punto.

### Datos Iniciales (07-datos-iniciales.sql)

3 planes de subscripción:
- **basico**: $299/mes (5 profesionales, 200 clientes)
- **profesional**: $599/mes (15 profesionales, 1000 clientes)
- **custom**: Precio negociado (sin límites)

## 🔄 Orden de Ejecución

Los archivos **DEBEN** ejecutarse en este orden:

```
1. fundamentos/01-extensiones.sql         (extensiones PostgreSQL)
2. fundamentos/02-tipos-enums.sql         (ENUMs requeridos)
3. fundamentos/03-funciones-utilidad.sql  (actualizar_timestamp)
4. nucleo/01-tablas-core.sql              (organizaciones → usuarios)
5. nucleo/02-tablas-subscripciones.sql    (4 tablas con FKs)
6. nucleo/03-indices.sql                  (índices especializados)
7. nucleo/04-rls-policies.sql             (seguridad multi-tenant)
8. nucleo/05-funciones.sql                (funciones PL/pgSQL)
9. nucleo/06-triggers.sql                 (triggers automáticos)
10. nucleo/07-datos-iniciales.sql         (planes base)
```

## 📊 Dependencias

### Depende de (módulos anteriores)

- **fundamentos**: Requiere ENUMs (rol_usuario, plan_tipo, estado_subscripcion, industria_tipo) y función `actualizar_timestamp()`

### Requerido por (módulos posteriores)

- **catalogos**: Tipos profesional y tipos bloqueo referencian organizaciones
- **negocio**: Profesionales, servicios referencian organizaciones
- **citas**: Citas referencian usuarios y clientes
- **comisiones**: Comisiones profesionales referencian usuarios

## 🎯 Características Clave

1. **Multi-tenancy COMPLETO**: Aislamiento de datos por organización con RLS
2. **Sistema de Subscripciones**: Facturación, límites, trial, upgrades/downgrades
3. **Métricas en Tiempo Real**: Contadores automáticos actualizados por triggers
4. **Auditoría Completa**: Historial de todos los cambios en subscripciones
5. **Validación Automática**: Verificación de límites del plan antes de INSERT
6. **Integración Gateway**: Soporte para Mercado Pago (extensible a otros)

## 🔒 Seguridad

- **RLS habilitado** en todas las tablas
- **Políticas unificadas** para evitar conflictos
- **Validación de formato** en tenant_id (regex: ^[0-9]+$)
- **Bypass controlado** para operaciones de sistema
- **Comentarios documentados** en cada política

## 📝 Notas de Migración

**Fecha migración**: 16 Noviembre 2025

**Origen**:
- `sql/schema/03-core-tables.sql` → `01-tablas-core.sql`
- `sql/schema/10-subscriptions-table.sql` → `02-tablas-subscripciones.sql`, `05-funciones.sql`, `06-triggers.sql`, `07-datos-iniciales.sql`
- `sql/schema/07-indexes.sql` → `03-indices.sql`
- `sql/schema/08-rls-policies.sql` → `04-rls-policies.sql`

**Cambios**:
- Separación modular por tipo de componente (tablas, índices, RLS, funciones, triggers)
- Documentación mejorada con COMMENT ON
- Orden de ejecución claramente definido
- README completo con dependencias y características

**Validación**: Pendiente de ejecutar script de validación después de migrar todos los módulos
