# 🏗️ PLAN DE REFACTORING: ORGANIZACIÓN SQL MODULAR

**Fecha Creación:** 16 Noviembre 2025
**Prioridad:** 🔴 CRÍTICA - Antes de agregar nuevas funcionalidades
**Objetivo:** Reorganizar estructura SQL de monolítica a modular
**Esfuerzo Estimado:** 1-2 días (8-16 horas)
**Riesgo:** BAJO (proyecto se levanta desde cero, sin datos en producción)

---

## 📑 ÍNDICE

1. [Problema Actual](#problema-actual)
2. [Estructura Propuesta](#estructura-propuesta)
3. [Beneficios](#beneficios)
4. [Plan de Migración](#plan-de-migración)
5. [Mapa de Dependencias](#mapa-de-dependencias)
6. [Checklist de Ejecución](#checklist-de-ejecución)
7. [Rollback Plan](#rollback-plan)

---

## 🚨 PROBLEMA ACTUAL

### Estructura Monolítica Actual (17 archivos)

```
sql/schema/
├── 01-types-and-enums.sql          15 KB  - ENUMs de todo el sistema
├── 02-functions.sql                51 KB  - TODAS las funciones mezcladas
├── 03-core-tables.sql              4.5KB  - organizaciones, usuarios
├── 04-catalog-tables.sql           24 KB  - tipos_profesional, tipos_bloqueo
├── 05-business-tables.sql          21 KB  - profesionales, servicios, clientes
├── 06-operations-tables.sql        25 KB  - citas, bloqueos, comisiones
├── 07-indexes.sql                  45 KB  - TODOS los índices (269 índices)
├── 08-rls-policies.sql             34 KB  - TODAS las políticas RLS
├── 09-triggers.sql                 16 KB  - TODOS los triggers
├── 10-subscriptions-table.sql      36 KB  - Suscripciones + historial + límites
├── 11-horarios-profesionales.sql   15 KB  - Horarios base profesionales
├── 12-eventos-sistema.sql          34 KB  - Auditoría + particionamiento
├── 13-bloqueos-horarios.sql        21 KB  - Bloqueos temporales
├── 14-payments-mercadopago.sql     14 KB  - Pagos + métodos de pago
├── 15-maintenance-functions.sql    31 KB  - Funciones de mantenimiento
├── 17-system-config.sql            5.9KB  - Config global
└── 18-pg-cron-setup.sql            17 KB  - Jobs automáticos
```

### ❌ Problemas Identificados

1. **Cohesión Baja:**
   - `02-functions.sql` tiene funciones de citas + comisiones + bloqueos + particionamiento
   - `07-indexes.sql` mezcla índices de 25 tablas diferentes
   - Difícil saber qué función pertenece a qué módulo

2. **Acoplamiento Alto:**
   - Modificar índice de comisiones requiere abrir archivo con 269 índices
   - Agregar trigger de citas requiere navegar archivo con 20+ triggers

3. **Mantenimiento Complejo:**
   - "¿Dónde está el trigger de comisiones?" → Buscar en archivo de 16KB
   - "¿Qué índices tiene marketplace?" → Revisar 45KB de código

4. **Testing Difícil:**
   - No puedes probar solo el módulo de comisiones
   - Tests requieren levantar TODO el esquema

5. **Documentación Dispersa:**
   - No hay README por módulo
   - Comentarios mezclados en archivos gigantes

6. **Git Conflicts:**
   - 2 developers modificando `07-indexes.sql` simultáneamente = conflicto

7. **Onboarding Lento:**
   - Nuevo developer: "¿Dónde está comisiones?"
   - Respuesta actual: "Busca en 06, 07, 08, 09, 02..."

---

## 🎯 ESTRUCTURA PROPUESTA

### Organización Modular por Funcionalidad

```
sql/
├── 00-fundamentos/                   ← Fundamentos del sistema
│   ├── 01-extensiones.sql            (pg_trgm, uuid-ossp, etc.)
│   ├── 02-tipos-enums.sql            (ENUMs globales)
│   └── 03-funciones-utilidad.sql     (Funciones helper globales)
│
├── nucleo/                           ← Módulo Núcleo (Multi-tenant)
│   ├── 10-tablas.sql                 (organizaciones, usuarios, planes_subscripcion)
│   ├── 11-indices.sql
│   ├── 12-rls.sql
│   ├── 13-funciones.sql
│   ├── 14-disparadores.sql
│   └── README.md
│
├── catalogos/                        ← Módulo Catálogos
│   ├── 20-tablas.sql                 (tipos_profesional, tipos_bloqueo)
│   ├── 21-indices.sql
│   ├── 22-rls.sql
│   ├── 23-datos.sql                  (33 tipos profesional, 9 tipos bloqueo)
│   └── README.md
│
├── negocio/                          ← Módulo Negocio
│   ├── 30-tablas.sql                 (profesionales, servicios, clientes)
│   ├── 31-indices.sql
│   ├── 32-rls.sql
│   ├── 33-funciones.sql
│   ├── 34-disparadores.sql
│   └── README.md
│
├── agendamiento/                     ← Módulo Agendamiento
│   ├── 40-tablas.sql                 (horarios_profesionales, disponibilidad)
│   ├── 41-indices.sql
│   ├── 42-rls.sql
│   ├── 43-funciones.sql
│   ├── 44-disparadores.sql
│   └── README.md
│
├── citas/                            ← Módulo Citas
│   ├── 50-tablas.sql                 (citas, citas_servicios)
│   ├── 51-indices.sql
│   ├── 52-rls.sql
│   ├── 53-funciones.sql
│   ├── 54-disparadores.sql
│   ├── 55-particionamiento.sql       (Particionamiento mensual)
│   └── README.md
│
├── bloqueos/                         ← Módulo Bloqueos
│   ├── 60-tablas.sql                 (bloqueos_horarios)
│   ├── 61-indices.sql
│   ├── 62-rls.sql
│   ├── 63-funciones.sql
│   ├── 64-disparadores.sql
│   └── README.md
│
├── comisiones/                       ← Módulo Comisiones
│   ├── 70-tablas.sql                 (configuracion_comisiones, comisiones_profesionales, historial)
│   ├── 71-indices.sql
│   ├── 72-rls.sql
│   ├── 73-funciones.sql              (calcular_comision_cita, etc.)
│   ├── 74-disparadores.sql
│   └── README.md
│
├── suscripciones/                    ← Módulo Suscripciones
│   ├── 80-tablas.sql                 (subscripciones, historial_subscripciones)
│   ├── 81-indices.sql
│   ├── 82-rls.sql
│   ├── 83-funciones.sql
│   ├── 84-disparadores.sql
│   └── README.md
│
├── pagos/                            ← Módulo Pagos
│   ├── 90-tablas.sql                 (pagos, metodos_pago)
│   ├── 91-indices.sql
│   ├── 92-rls.sql
│   ├── 93-funciones.sql
│   └── README.md
│
├── chatbots/                         ← Módulo Chatbots
│   ├── 100-tablas.sql                (chatbot_config, chatbot_credentials)
│   ├── 101-indices.sql
│   ├── 102-rls.sql
│   └── README.md
│
├── auditoria/                        ← Módulo Auditoría
│   ├── 110-tablas.sql                (eventos_sistema, eventos_sistema_archivo)
│   ├── 111-indices.sql
│   ├── 112-rls.sql
│   ├── 113-funciones.sql
│   ├── 114-disparadores.sql
│   ├── 115-particionamiento.sql      (Particionamiento mensual)
│   └── README.md
│
├── marketplace/                      ← Módulo Marketplace (NUEVO)
│   ├── 120-tablas.sql                (marketplace_perfiles, marketplace_reseñas, etc.)
│   ├── 121-indices.sql
│   ├── 122-rls.sql
│   ├── 123-funciones.sql
│   ├── 124-disparadores.sql
│   └── README.md
│
└── mantenimiento/                    ← Módulo Mantenimiento
    ├── 900-funciones.sql             (Funciones de limpieza y archivado)
    ├── 901-pg-cron.sql               (Jobs automáticos)
    ├── 902-config-sistema.sql        (Tabla configuracion_sistema)
    └── README.md
```

---

## ✅ BENEFICIOS DE LA NUEVA ESTRUCTURA

### 1. **Cohesión Alta**

```bash
# Todo lo de comisiones en un solo lugar
ls sql/comisiones/
70-tablas.sql
71-indices.sql
72-rls.sql
73-funciones.sql
74-disparadores.sql
README.md
```

### 2. **Mantenimiento Simple**

```bash
# Modificar índices de comisiones
nano sql/comisiones/71-indices.sql

# Ver todas las funciones de comisiones
cat sql/comisiones/73-funciones.sql
```

### 3. **Testing Modular**

```bash
# Probar solo módulo de comisiones
psql < sql/00-fundamentos/02-tipos-enums.sql
psql < sql/nucleo/10-tablas.sql
psql < sql/citas/50-tablas.sql
psql < sql/comisiones/70-tablas.sql
psql < sql/comisiones/71-indices.sql
# etc.
```

### 4. **Documentación Clara**

Cada módulo tiene su README.md:

```markdown
# Módulo: Comisiones

## Descripción
Sistema automático de cálculo de comisiones por cita completada.

## Tablas
- configuracion_comisiones
- comisiones_profesionales
- historial_configuracion_comisiones

## Dependencias
- core (organizaciones, usuarios)
- business (profesionales, servicios)
- appointments (citas)

## Funciones Clave
- calcular_comision_cita()
- obtener_configuracion_comision()

## Triggers
- trigger_calcular_comision_cita
```

### 5. **Onboarding Rápido**

```bash
# Nuevo developer: "¿Dónde está marketplace?"
cd sql/marketplace/
cat README.md  # Documentación completa
```

### 6. **Git Workflow Mejorado**

```bash
# Developer A: Trabajando en comisiones
nano sql/comisiones/73-funciones.sql
git commit -m "feat(comisiones): Mejorar cálculo mixto"

# Developer B: Trabajando en marketplace
nano sql/marketplace/120-tablas.sql
git commit -m "feat(marketplace): Agregar tabla reseñas"

# No hay conflictos porque están en archivos diferentes
```

### 7. **Preparado para Microservicios**

```bash
# Separar comisiones en su propio servicio
mkdir commissions-service/db/
cp -r sql/00-fundamentos/ commissions-service/db/
cp -r sql/nucleo/ commissions-service/db/
cp -r sql/comisiones/ commissions-service/db/
```

---

## 🗺️ MAPA DE DEPENDENCIAS

### Grafo de Dependencias entre Módulos

```
00-foundation (base)
    ↓
core (organizaciones, usuarios, planes)
    ↓
    ├─→ catalogs (tipos_profesional, tipos_bloqueo)
    │       ↓
    ├─→ business (profesionales, servicios, clientes)
    │       ↓
    │       ├─→ scheduling (horarios_profesionales)
    │       │       ↓
    │       └─→ appointments (citas, citas_servicios)
    │               ↓
    │               ├─→ blockouts (bloqueos_horarios)
    │               ├─→ commissions (comisiones_profesionales)
    │               └─→ marketplace (marketplace_reseñas - requiere cita completada)
    │
    ├─→ subscriptions (subscripciones, historial)
    │
    ├─→ payments (pagos, metodos_pago)
    │
    ├─→ chatbots (chatbot_config)
    │
    ├─→ auditing (eventos_sistema)
    │
    └─→ marketplace (marketplace_perfiles - requiere organizacion)

maintenance (independiente - funciones utilitarias)
```

### Orden de Ejecución Garantizado

```
1. 00-fundamentos/       (00-09)
2. nucleo/               (10-19)
3. catalogos/            (20-29)
4. negocio/              (30-39)
5. agendamiento/         (40-49)
6. citas/                (50-59)
7. bloqueos/             (60-69)
8. comisiones/           (70-79)
9. suscripciones/        (80-89)
10. pagos/               (90-99)
11. chatbots/            (100-109)
12. auditoria/           (110-119)
13. marketplace/         (120-129)
14. mantenimiento/       (900-909)
```

**El orden numérico en los prefijos garantiza dependencias correctas.**

---

## 📋 PLAN DE MIGRACIÓN

### Estrategia: Migración Incremental y Validada

**NO se refactoriza todo de golpe.** Se hace por partes pequeñas con validación continua.

### 🎯 Metodología de Migración

**Proceso por cada pieza de código:**

1. ✅ **Crear archivo nuevo** en carpeta modular
2. ✅ **Copiar código** desde archivo original
3. ✅ **Eliminar/comentar** del archivo original
4. ✅ **Validar que funciona** (levantar BD desde cero)
5. ✅ **Si funciona** → Continuar con siguiente pieza
6. ✅ **Si falla** → Revertir con git y analizar

**Ejemplo práctico:**

```bash
# 1. Crear archivo nuevo
nano sql/00-fundamentos/02-tipos-enums.sql
# (agregar header + copiar ENUMs de schema/01-types-and-enums.sql)

# 2. Eliminar del original (marcar lo migrado)
nano sql/schema/01-types-and-enums.sql
# (comentar o eliminar los ENUMs que ya copiaste)

# 3. Validar
docker-compose down -v
docker-compose up -d saas_db
sleep 10
./sql/validate-schema.sh

# 4. Si funciona → commit
git add sql/00-fundamentos/02-tipos-enums.sql sql/schema/01-types-and-enums.sql
git commit -m "refactor(sql): Migrar ENUMs a módulo fundamentos"

# 5. Continuar con siguiente (funciones globales)
```

**Ventajas de esta estrategia:**

✅ **Seguridad total:** Código original nunca se pierde hasta validar
✅ **Rollback instantáneo:** `git checkout -- archivo` revierte cambios
✅ **Validación continua:** Detectas problemas de inmediato
✅ **Sin sorpresas:** Avanzas con confianza
✅ **Commits atómicos:** Cada migración es independiente

---

### **FASE 0: PREPARACIÓN (30 minutos)**

#### Paso 0.1: Crear Estructura de Carpetas

```bash
cd sql/

# Crear nuevas carpetas modulares (nombres en español)
mkdir -p 00-fundamentos
mkdir -p nucleo catalogos negocio agendamiento citas
mkdir -p bloqueos comisiones suscripciones pagos
mkdir -p chatbots auditoria marketplace mantenimiento

# Mantener carpeta schema/ intacta
# Los archivos originales se irán vaciando gradualmente conforme migremos código
# Al final se elimina toda la carpeta schema/
```

#### Paso 0.2: Analizar init-data.sh Actual

**IMPORTANTE:** El archivo `/init-data.sh` actualmente ejecuta los 17 archivos monolíticos de `schema/`.

```bash
# Ver el script actual
cat /home/kike/Documentos/n8nAutomatizaciones/init-data.sh
```

Este script **DEBE ser actualizado** al final del refactoring para ejecutar los nuevos módulos.

**Dos opciones:**

**Opción A - Automática (RECOMENDADA):**
```bash
# Ejecutar todos los .sql de todas las carpetas en orden numérico
for dir in $(ls -d $SQL_DIR/{00-fundamentos,nucleo,catalogos,negocio,agendamiento,citas,bloqueos,comisiones,suscripciones,pagos,chatbots,auditoria,marketplace,mantenimiento} 2>/dev/null | sort); do
  for file in $(ls $dir/*.sql 2>/dev/null | sort); do
    echo "    📄 $(basename $file)..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
  done
done
```

**Opción B - Explícita:**
```bash
# Especificar cada archivo manualmente (más control)
echo "    🎭 Tipos y enumeraciones..."
psql ... -f "$SQL_DIR/00-fundamentos/02-tipos-enums.sql"
echo "    ⚡ Funciones utilitarias..."
psql ... -f "$SQL_DIR/00-fundamentos/03-funciones-utilidad.sql"
# etc.
```

**⚠️ IMPORTANTE:**
- Durante las Fases 1-3, `init-data.sh` seguirá usando los archivos de `schema/` (que irán quedando vacíos)
- Esto es NORMAL - PostgreSQL ejecutará archivos vacíos sin problema
- Los nuevos archivos modulares se ejecutarán automáticamente por orden numérico
- Al final de FASE 4, actualizaremos `init-data.sh` para usar solo la estructura modular
- NO tocar `init-data.sh` hasta terminar FASE 3 completamente

#### Paso 0.3: Script de Validación

Crear `sql/validate-schema.sh`:

```bash
#!/bin/bash
# Script para validar que el esquema cargado es correcto

echo "Validando esquema de BD..."

# Contar tablas esperadas
EXPECTED_TABLES=25
ACTUAL_TABLES=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")

if [ "$ACTUAL_TABLES" -eq "$EXPECTED_TABLES" ]; then
    echo "✅ Tablas: $ACTUAL_TABLES/$EXPECTED_TABLES"
else
    echo "❌ ERROR: Tablas incorrectas $ACTUAL_TABLES/$EXPECTED_TABLES"
    exit 1
fi

# Validar funciones críticas
FUNCTIONS=("calcular_comision_cita" "obtener_configuracion_comision" "setup_partitions_for_month")
for func in "${FUNCTIONS[@]}"; do
    EXISTS=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname = '$func';")
    if [ "$EXISTS" -eq "1" ]; then
        echo "✅ Función: $func"
    else
        echo "❌ ERROR: Función $func no existe"
        exit 1
    fi
done

# Validar triggers
TRIGGERS=("trigger_calcular_comision_cita" "trigger_actualizar_updated_at")
for trig in "${TRIGGERS[@]}"; do
    EXISTS=$(docker-compose exec -T saas_db psql -U saas_user -d saas_db -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname = '$trig';")
    if [ "$EXISTS" -ge "1" ]; then
        echo "✅ Trigger: $trig"
    else
        echo "❌ ERROR: Trigger $trig no existe"
        exit 1
    fi
done

echo "✅ Validación completa exitosa"
```

```bash
chmod +x sql/validate-schema.sh
```

---

### **FASE 1: FOUNDATION (2 horas)**

Migrar fundamentos del sistema.

#### Paso 1.1: Migrar ENUMs y Tipos

**Migración incremental:**

```bash
# 1. Crear archivo nuevo
nano sql/00-fundamentos/02-tipos-enums.sql
```

Contenido de `00-fundamentos/02-tipos-enums.sql`:

```sql
-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - TIPOS Y ENUMERACIONES
-- ====================================================================
--
-- Descripción: ENUMs y tipos personalizados globales del sistema
-- Dependencias: Ninguna (archivo base)
-- Orden: 02 (después de extensiones)
--
-- Contenido:
-- - rol_usuario ENUM
-- - estado_cita ENUM
-- - industria_tipo ENUM
-- - estado_subscripcion ENUM
-- ====================================================================

-- (copiar contenido de schema/01-types-and-enums.sql aquí)
```

```bash
# 2. Eliminar del archivo original
nano sql/schema/01-types-and-enums.sql
# (eliminar todo el contenido o dejarlo vacío con comentario "MIGRADO A 00-fundamentos/02-tipos-enums.sql")

# 3. Validar
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh

# 4. Commit
git add sql/00-fundamentos/02-tipos-enums.sql sql/schema/01-types-and-enums.sql
git commit -m "refactor(sql): Migrar ENUMs a módulo fundamentos"
```

#### Paso 1.2: Extraer Funciones Globales

**Migrar solo funciones HELPER globales** (no las específicas de módulos):

```bash
nano sql/00-fundamentos/03-funciones-utilidad.sql
```

Contenido de `00-fundamentos/03-funciones-utilidad.sql`:

```sql
-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - FUNCIONES UTILITARIAS GLOBALES
-- ====================================================================
--
-- Funciones helper globales usadas por múltiples módulos
--
-- Contenido:
-- - actualizar_updated_at() - Trigger function para timestamps
-- - generar_codigo_unico() - Generador de códigos
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (copiar SOLO funciones globales de schema/02-functions.sql)
-- NO copiar funciones específicas de comisiones, citas, etc.
```

```bash
# Eliminar del archivo original las funciones que copiaste
nano sql/schema/02-functions.sql
# (comentar o eliminar SOLO las funciones globales que migraste)

# Validar
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh

# Commit
git add sql/00-fundamentos/03-funciones-utilidad.sql sql/schema/02-functions.sql
git commit -m "refactor(sql): Migrar funciones globales a módulo fundamentos"
```

#### Paso 1.3: Crear README

```bash
nano sql/00-fundamentos/README.md
```

Contenido de `00-fundamentos/README.md`:

```markdown
# Módulo: Fundamentos

## Descripción
Componentes base del sistema: extensiones, tipos, ENUMs y funciones utilitarias globales.

## Archivos
- `02-tipos-enums.sql` - ENUMs y tipos personalizados
- `03-funciones-utilidad.sql` - Funciones helper globales

## Dependencias
Ninguna (módulo base)

## Usado por
Todos los módulos del sistema
```

```bash
# Commit
git add sql/00-fundamentos/README.md
git commit -m "docs(sql): Agregar README módulo fundamentos"
```

#### Paso 1.4: Validar

```bash
# Eliminar BD actual
docker-compose down -v

# Levantar con nueva estructura
docker-compose up -d saas_db

# Esperar que inicie
sleep 10

# Validar
./sql/validate-schema.sh
```

---

### **FASE 2: NÚCLEO (3 horas)**

Migrar módulo Núcleo (organizaciones, usuarios, planes).

#### Paso 2.1: Migrar Tablas Núcleo

**Migración incremental:**

```bash
nano sql/nucleo/10-tablas.sql
```

Contenido de `nucleo/10-tablas.sql`:

```sql
-- ====================================================================
-- 🏗️ MÓDULO: NÚCLEO - TABLAS PRINCIPALES
-- ====================================================================
--
-- Descripción: Multi-tenancy, autenticación y planes
-- Dependencias: 00-fundamentos
-- Orden: 10
--
-- Tablas:
-- - organizaciones (multi-tenant principal)
-- - usuarios (autenticación y RBAC)
-- - planes_subscripcion (planes SaaS)
-- ====================================================================

-- (copiar contenido de schema/03-core-tables.sql)
```

```bash
# Eliminar del original
nano sql/schema/03-core-tables.sql
# (eliminar todo o marcar como MIGRADO)

# Validar
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh

# Commit
git add sql/nucleo/10-tablas.sql sql/schema/03-core-tables.sql
git commit -m "refactor(sql): Migrar tablas núcleo"
```

#### Paso 2.2: Extraer Índices del Núcleo

**Migrar SOLO índices de tablas núcleo** desde `schema/07-indexes.sql`:

```bash
nano sql/nucleo/11-indices.sql
```

Contenido de `nucleo/11-indices.sql`:

```sql
-- ====================================================================
-- 🏗️ MÓDULO: NÚCLEO - ÍNDICES
-- ====================================================================

-- Índices de organizaciones
CREATE INDEX idx_organizaciones_slug ON organizaciones(slug);
CREATE INDEX idx_organizaciones_activo ON organizaciones(activo) WHERE activo = true;

-- Índices de usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_organizacion ON usuarios(organizacion_id);

-- (copiar SOLO índices de organizaciones, usuarios, planes_subscripcion)
```

```bash
# Eliminar del original
nano sql/schema/07-indexes.sql
# (comentar/eliminar SOLO los índices que migraste)

# Validar + Commit
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh
git add sql/nucleo/11-indices.sql sql/schema/07-indexes.sql
git commit -m "refactor(sql): Migrar índices núcleo"
```

#### Paso 2.3: Extraer RLS del Núcleo

```bash
nano sql/nucleo/12-rls.sql
```

```sql
-- ====================================================================
-- 🏗️ MÓDULO: NÚCLEO - POLÍTICAS RLS
-- ====================================================================

-- RLS para organizaciones
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizaciones_tenant_isolation
ON organizaciones
FOR ALL
TO saas_app
USING (...);

-- (copiar políticas RLS de organizaciones, usuarios, planes)
```

```bash
# Eliminar del original + validar + commit
nano sql/schema/08-rls-policies.sql
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh
git add sql/nucleo/12-rls.sql sql/schema/08-rls-policies.sql
git commit -m "refactor(sql): Migrar RLS núcleo"
```

#### Paso 2.4: Extraer Triggers del Núcleo

```bash
nano sql/nucleo/14-disparadores.sql
```

```sql
-- ====================================================================
-- 🏗️ MÓDULO: NÚCLEO - DISPARADORES
-- ====================================================================

-- Trigger para actualizar updated_at en organizaciones
CREATE TRIGGER trigger_organizaciones_updated_at
    BEFORE UPDATE ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at();

-- (copiar triggers de organizaciones, usuarios, planes)
```

```bash
# Eliminar del original + validar + commit
nano sql/schema/09-triggers.sql
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh
git add sql/nucleo/14-disparadores.sql sql/schema/09-triggers.sql
git commit -m "refactor(sql): Migrar triggers núcleo"
```

#### Paso 2.5: Crear README

```bash
nano sql/nucleo/README.md
```

```markdown
# Módulo: Núcleo (Multi-tenant y Autenticación)

## Descripción
Sistema multi-tenant, autenticación JWT y gestión de planes SaaS.

## Tablas
- **organizaciones** - Tenants del sistema (multi-tenancy)
- **usuarios** - Autenticación y RBAC
- **planes_subscripcion** - Planes SaaS (gratuito, profesional, empresarial)

## Archivos
- `10-tablas.sql` - Definición de tablas
- `11-indices.sql` - Índices optimizados
- `12-rls.sql` - Políticas RLS multi-tenant
- `14-disparadores.sql` - Triggers automáticos

## Dependencias
- 00-fundamentos (ENUMs, funciones globales)

## Usado por
Todos los módulos (base del multi-tenancy)

## Índices Críticos
- `idx_organizaciones_slug` - Búsqueda por slug único
- `idx_usuarios_email` - Login por email
```

```bash
git add sql/nucleo/README.md
git commit -m "docs(sql): Agregar README módulo núcleo"
```

---

### **FASE 3: MIGRACIÓN DEL RESTO DE MÓDULOS (1 día)**

**Repetir el mismo proceso de migración incremental para cada módulo restante.**

#### Módulos a Migrar (en orden de dependencias)

1. ✅ **catalogos/** (de `04-catalog-tables.sql`)
2. ✅ **negocio/** (de `05-business-tables.sql`)
3. ✅ **agendamiento/** (de `11-horarios-profesionales.sql`)
4. ✅ **citas/** (de `06-operations-tables.sql` - solo citas)
5. ✅ **bloqueos/** (de `13-bloqueos-horarios.sql`)
6. ✅ **comisiones/** (de `06-operations-tables.sql` - solo comisiones)
7. ✅ **suscripciones/** (de `10-subscriptions-table.sql`)
8. ✅ **pagos/** (de `14-payments-mercadopago.sql`)
9. ✅ **chatbots/** (de `05-business-tables.sql` - tabla chatbot_*)
10. ✅ **auditoria/** (de `12-eventos-sistema.sql`)
11. ✅ **mantenimiento/** (de `15-maintenance-functions.sql`, `17-system-config.sql`, `18-pg-cron-setup.sql`)

#### Plantilla por Módulo

Para cada módulo, seguir el **proceso de migración incremental**:

```bash
# 1. Migrar tablas
nano sql/[modulo]/[numero]-tablas.sql
# (copiar desde archivo original)
# (eliminar del archivo original)
# (validar + commit)

# 2. Migrar índices
nano sql/[modulo]/[numero]-indices.sql
# (copiar SOLO índices de este módulo desde 07-indexes.sql)
# (eliminar del archivo original)
# (validar + commit)

# 3. Migrar RLS
nano sql/[modulo]/[numero]-rls.sql
# (copiar SOLO políticas de este módulo desde 08-rls-policies.sql)
# (eliminar del archivo original)
# (validar + commit)

# 4. Migrar funciones (si aplica)
nano sql/[modulo]/[numero]-funciones.sql
# (copiar SOLO funciones de este módulo desde 02-functions.sql)
# (eliminar del archivo original)
# (validar + commit)

# 5. Migrar triggers (si aplica)
nano sql/[modulo]/[numero]-disparadores.sql
# (copiar SOLO triggers de este módulo desde 09-triggers.sql)
# (eliminar del archivo original)
# (validar + commit)

# 6. Crear README
nano sql/[modulo]/README.md
git add sql/[modulo]/README.md
git commit -m "docs(sql): Agregar README módulo [nombre]"
```

**Validación después de cada paso:**
```bash
docker-compose down -v && docker-compose up -d saas_db && sleep 10 && ./sql/validate-schema.sh
```

---

### **FASE 4: LIMPIEZA (30 minutos)**

#### Paso 4.1: Verificar Archivos Originales Vacíos

```bash
# Verificar que los archivos originales estén vacíos o solo tengan comentarios
ls -lh sql/schema/

# Deben estar todos vacíos o con comentarios "MIGRADO A..."
cat sql/schema/01-types-and-enums.sql  # Debe estar vacío
cat sql/schema/02-functions.sql        # Debe estar vacío
# etc.
```

#### Paso 4.2: Eliminar Archivos Legacy

Una vez confirmado que todo funciona correctamente:

```bash
# Eliminar carpeta schema/ completa
rm -rf sql/schema/

# Commit
git add sql/
git commit -m "refactor(sql): Eliminar archivos legacy tras migración completa"
```

**NOTA:** NO mover a carpeta `legacy/`, **ELIMINAR DIRECTAMENTE** ya que todo está en git.

#### Paso 4.3: Actualizar init-data.sh

**Este paso es CRÍTICO** - El script `init-data.sh` ejecuta los archivos SQL al iniciar PostgreSQL.

```bash
nano /home/kike/Documentos/n8nAutomatizaciones/init-data.sh
```

**Reemplazar la sección de esquema (líneas 31-66) con:**

**OPCIÓN RECOMENDADA - Automática:**

```bash
# 2. Aplicar esquema SaaS modular (estructura nueva)
echo "  3️⃣ Aplicando esquema SaaS modular (estructura nueva)..."

# Definir módulos en orden de dependencias
MODULES=(
    "00-fundamentos"
    "nucleo"
    "catalogos"
    "negocio"
    "agendamiento"
    "citas"
    "bloqueos"
    "comisiones"
    "suscripciones"
    "pagos"
    "chatbots"
    "auditoria"
    "mantenimiento"
)

# Ejecutar cada módulo en orden
for module in "${MODULES[@]}"; do
    if [ -d "$SQL_DIR/$module" ]; then
        echo "    📦 Módulo: $module"
        for file in $(ls $SQL_DIR/$module/*.sql 2>/dev/null | sort -V); do
            filename=$(basename "$file")
            echo "       📄 $filename"
            psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$file"
        done
    fi
done
```

**Actualizar también las líneas de resumen (169-196):**

```bash
echo "🗄️ ESQUEMA SAAS MODULAR:"
echo "  ├── 📁 Estructura modular por funcionalidad (14 módulos)"
echo "  ├── 🎭 8 ENUMs especializados (tipos de negocio + bloqueos)"
echo "  ├── ⚡ 48 funciones PL/pgSQL automáticas"
echo "  ├── 🏛️ 25 tablas enterprise"
echo "  ├── ⚡ Tablas PARTICIONADAS: citas y eventos_sistema"
echo "  ├── 📊 269 índices optimizados"
echo "  ├── 🛡️ 29 políticas RLS multi-tenant"
echo "  ├── 🔄 25 triggers automáticos"
echo "  ├── 💳 Sistema de comisiones automático"
echo "  ├── 💰 Integración Mercado Pago"
echo "  ├── 🧹 Sistema de archivado automático"
echo "  ├── ⏰ pg_cron: 4 jobs automáticos"
echo "  └── 🔧 Arquitectura modular mantenible"
echo ""
echo "📁 ESTRUCTURA MODULAR:"
echo "  ├── Schema organizado en 14 módulos funcionales"
echo "  ├── ~60 archivos especializados (vs 17 monolíticos)"
echo "  ├── Alta cohesión, bajo acoplamiento"
echo "  ├── README por módulo con documentación"
echo "  └── Escalable para 1000+ organizaciones"
```

```bash
# Validar cambios
docker-compose down -v
docker-compose up -d saas_db
# Esperar logs y verificar que inicia correctamente
docker-compose logs -f saas_db

# Commit
git add init-data.sh
git commit -m "refactor(sql): Actualizar init-data.sh para estructura modular"
```

#### Paso 4.4: Actualizar Documentación Principal

```bash
nano sql/README.md
```

Contenido de `sql/README.md`:

```markdown
# Estructura SQL Modular

## Organización

El esquema está organizado por **módulos funcionales**, no por tipo de objeto.

Cada módulo contiene:
- Tablas
- Índices
- Políticas RLS
- Funciones
- Triggers/Disparadores
- README con documentación

## Módulos

1. **00-fundamentos/** - Fundamentos (ENUMs, helpers)
2. **nucleo/** - Multi-tenant, autenticación, planes
3. **catalogos/** - Catálogos (tipos profesional, tipos bloqueo)
4. **negocio/** - Profesionales, servicios, clientes
5. **agendamiento/** - Horarios profesionales
6. **citas/** - Citas y servicios por cita
7. **bloqueos/** - Bloqueos de horarios
8. **comisiones/** - Sistema de comisiones
9. **suscripciones/** - Suscripciones SaaS
10. **pagos/** - Pagos Mercado Pago
11. **chatbots/** - IA conversacional
12. **auditoria/** - Eventos de sistema
13. **marketplace/** - Marketplace público (futuro)
14. **mantenimiento/** - Funciones de mantenimiento

## Orden de Ejecución

Los archivos se ejecutan en orden numérico automáticamente.
Las dependencias están garantizadas por los prefijos numéricos.

## Agregar Nuevo Módulo

1. Crear carpeta `sql/[modulo]/`
2. Crear archivos con prefijos numéricos apropiados:
   - `XX-tablas.sql`
   - `XX-indices.sql`
   - `XX-rls.sql`
   - `XX-funciones.sql` (opcional)
   - `XX-disparadores.sql` (opcional)
3. Crear `README.md` documentando el módulo
4. Validar con `./validate-schema.sh`

## Mantenimiento

- Modificar solo el módulo que corresponda
- NO mezclar módulos en un mismo commit
- Actualizar README del módulo si cambias estructura
- Validar siempre antes de commit
```

```bash
git add sql/README.md
git commit -m "docs(sql): Actualizar README principal con estructura modular"
```

---

### **FASE 5: VALIDACIÓN COMPLETA (2 horas)**

#### Paso 5.1: Tests Automatizados

```bash
# Ejecutar TODOS los tests
npm run test:backend

# Tests específicos de BD
cd sql/tests/
./run-all-tests.sh
```

#### Paso 5.2: Validación Manual

```bash
# 1. Eliminar todo
docker-compose down -v

# 2. Levantar desde cero
docker-compose up -d

# 3. Esperar inicialización
sleep 30

# 4. Validar esquema
./sql/validate-schema.sh

# 5. Conectar y verificar manualmente
docker-compose exec saas_db psql -U saas_user -d saas_db

# En psql:
\dt  -- Ver todas las tablas (debe haber 25)
\df  -- Ver todas las funciones
SELECT * FROM organizaciones LIMIT 1;
SELECT * FROM usuarios LIMIT 1;
```

#### Paso 5.3: Test de Funcionalidad

```bash
# Levantar stack completo
docker-compose up -d

# Probar endpoints críticos
curl http://localhost:3000/api/v1/organizaciones
curl http://localhost:3000/api/v1/usuarios

# Probar frontend
open http://localhost:5173
```

#### Paso 5.4: Validar Comisiones (módulo crítico recién implementado)

```sql
-- En psql
\d comisiones_profesionales
\df calcular_comision_cita
\dy trigger_calcular_comision_cita

-- Simular cita completada
UPDATE citas SET estado = 'completada' WHERE id = 1;

-- Verificar que se creó comisión
SELECT * FROM comisiones_profesionales WHERE cita_id = 1;
```

---

## 🔄 ROLLBACK PLAN

Si algo sale mal durante la migración:

### Rollback con Git

```bash
# 1. Detener containers
docker-compose down -v

# 2. Revertir cambios con git
git checkout -- sql/
# O descartar todos los cambios no commiteados
git reset --hard HEAD

# 3. Levantar stack con código restaurado
docker-compose up -d

# 4. Validar
./sql/validate-schema.sh
```

### Rollback Parcial (por módulo)

Si solo un módulo falla:

```bash
# Ejemplo: falló migración de commissions

# 1. Revertir solo esa carpeta con git
git checkout -- sql/commissions/

# 2. Copiar temporalmente desde legacy (si ya moviste el archivo)
cp sql/legacy/06-operations-tables.sql sql/schema/06-operations-tables.sql

# 3. Probar
docker-compose down -v
docker-compose up -d
./sql/validate-schema.sh
```

### Rollback Total (en caso crítico)

```bash
# Si nada funciona, volver al último commit estable
git log --oneline  # Ver commits
git reset --hard <commit-hash-estable>
docker-compose down -v
docker-compose up -d
```

---

## ✅ CHECKLIST DE EJECUCIÓN

### Pre-Migración

- [ ] Git status limpio (commits previos guardados)
- [ ] Script de validación creado y probado
- [ ] Contenedores Docker funcionando correctamente

### Migración por Fase

#### Fase 0: Preparación
- [ ] Estructura de carpetas creada
- [ ] Script de validación funciona

#### Fase 1: Fundamentos
- [ ] `00-fundamentos/02-tipos-enums.sql` creado y validado
- [ ] `00-fundamentos/03-funciones-utilidad.sql` creado y validado
- [ ] `00-fundamentos/README.md` creado
- [ ] Archivos originales vaciados (commits hechos)

#### Fase 2: Núcleo
- [ ] `nucleo/10-tablas.sql` creado y validado
- [ ] `nucleo/11-indices.sql` creado y validado
- [ ] `nucleo/12-rls.sql` creado y validado
- [ ] `nucleo/14-disparadores.sql` creado y validado
- [ ] `nucleo/README.md` creado
- [ ] Archivos originales vaciados (commits hechos)

#### Fase 3: Resto de Módulos
- [ ] `catalogos/` migrado completamente
- [ ] `negocio/` migrado completamente
- [ ] `agendamiento/` migrado completamente
- [ ] `citas/` migrado completamente
- [ ] `bloqueos/` migrado completamente
- [ ] `comisiones/` migrado completamente
- [ ] `suscripciones/` migrado completamente
- [ ] `pagos/` migrado completamente
- [ ] `chatbots/` migrado completamente
- [ ] `auditoria/` migrado completamente
- [ ] `mantenimiento/` migrado completamente

#### Fase 4: Limpieza
- [ ] Archivos originales verificados como vacíos
- [ ] Carpeta `sql/schema/` eliminada
- [ ] **`init-data.sh` actualizado** (CRÍTICO)
- [ ] `init-data.sh` validado con docker-compose
- [ ] `sql/README.md` actualizado

#### Fase 5: Validación
- [ ] Tests automatizados pasan
- [ ] Validación manual exitosa
- [ ] Stack completo funciona
- [ ] Comisiones funcionan correctamente
- [ ] Frontend carga sin errores

### Post-Migración

- [ ] Commit final de refactoring
- [ ] Validación completa de funcionalidad
- [ ] Carpeta `sql/schema/` eliminada
- [ ] Actualizar `CLAUDE.md` con nueva estructura
- [ ] Todo funcionando en desarrollo

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Antes | Después |
|---------|-------|---------|
| **Archivos SQL** | 17 monolíticos | ~60 modulares |
| **Tamaño promedio/archivo** | 22 KB | 8 KB |
| **Tiempo para encontrar código** | 5-10 min | 30 seg |
| **Git conflicts** | Frecuentes | Raros |
| **Tiempo onboarding** | 2-3 días | 4-6 horas |
| **Cohesión de módulos** | Baja (30%) | Alta (90%) |
| **Tests modulares** | Imposible | Posible |
| **Tiempo de migración** | 2-3 días (con backups) | 1-2 días (sin backups) |

---

## 🎯 BENEFICIOS A LARGO PLAZO

1. ✅ **Mantenibilidad:** Cambios aislados por módulo
2. ✅ **Escalabilidad:** Fácil agregar nuevos módulos
3. ✅ **Testing:** Tests modulares e independientes
4. ✅ **Documentación:** README por módulo
5. ✅ **Onboarding:** Developers encuentran código rápido
6. ✅ **Git:** Menos conflictos, mejor historial
7. ✅ **Microservicios:** Preparado para separar servicios
8. ✅ **Deployment:** Posible deployar módulos independientes

---

## 📚 EJEMPLO: Módulo Comisiones Completo

```
sql/comisiones/
├── 70-tablas.sql                  (~600 líneas)
├── 71-indices.sql                 (~200 líneas)
├── 72-rls.sql                     (~150 líneas)
├── 73-funciones.sql               (~400 líneas)
├── 74-disparadores.sql            (~100 líneas)
└── README.md

Total: ~1,450 líneas en 5 archivos organizados vs dispersas en 5 archivos monolíticos
```

`comisiones/README.md`:

```markdown
# Módulo: Comisiones

## Descripción
Sistema automático de cálculo de comisiones para profesionales.

## Características
- Cálculo automático al completar cita
- Configuración por servicio o global
- Tipos: porcentaje, monto fijo, mixto
- Auditoría de cambios en configuración
- Dashboard de ganancias

## Tablas
- **configuracion_comisiones** - Config por profesional/servicio
- **comisiones_profesionales** - Registro histórico
- **historial_configuracion_comisiones** - Auditoría

## Funciones
- `calcular_comision_cita()` - Trigger principal
- `obtener_configuracion_comision()` - Helper

## Disparadores
- `trigger_calcular_comision_cita` - Dispara al completar cita
- `trigger_actualizar_stats_perfil` - Actualiza estadísticas

## Dependencias
- nucleo (organizaciones, usuarios)
- negocio (profesionales, servicios)
- citas (citas completadas)

## Testing
```bash
# Test unitario del módulo
psql < 00-fundamentos/02-tipos-enums.sql
psql < nucleo/10-tablas.sql
psql < negocio/30-tablas.sql
psql < citas/50-tablas.sql
psql < comisiones/70-tablas.sql
psql < comisiones/71-indices.sql
psql < comisiones/72-rls.sql
psql < comisiones/73-funciones.sql
psql < comisiones/74-disparadores.sql
```

## Mantenimiento
- Modificar solo archivos en `comisiones/`
- Documentar cambios en este README
- Validar con `./validate-schema.sh`
```

---

## 🚀 PRÓXIMOS PASOS

### Inmediatos (después de refactoring)

1. ✅ **Validar funcionalidad completa** (todos los tests pasan)
2. ✅ **init-data.sh actualizado** y validado (CRÍTICO)
3. ✅ **Eliminar carpeta schema/** (inmediatamente tras validación)
4. ✅ **Implementar Marketplace** usando estructura modular
5. ✅ **Actualizar CLAUDE.md** con nueva arquitectura

### Futuro

1. **CI/CD por módulo:** Tests automáticos por carpeta
2. **Migrations modulares:** Sistema de migraciones por módulo
3. **Microservicios:** Separar módulos en servicios independientes
4. **Schema versioning:** Versionar esquema por módulo

---

**Fecha Última Actualización:** 16 Noviembre 2025
**Versión:** 2.0 - Migración Incremental en Español
**Estado:** ✅ Listo para Ejecutar
**Riesgo:** BAJO (proyecto desde cero, rollback con git)
**Tiempo Estimado:** 1-2 días (8-16 horas)
**Rama de Trabajo:** `main` (directamente)
**Backups Necesarios:** NO (proyecto se levanta desde cero)
**Estrategia:** Migración incremental validada (copiar → eliminar → validar → commit)
**Nomenclatura:** Archivos y carpetas en español
**Próxima Acción:** Ejecutar Fase 0 (Preparación)
