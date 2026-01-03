# Plan de Mejoras - Módulo Empleados/RRHH Nexo

## Análisis Competitivo: Nexo vs Odoo 19

**Fecha:** 2 Enero 2026
**Última Actualización:** 3 Enero 2026 (Fase 5 COMPLETADA - Plan completo terminado)

---

## 🔍 AUDITORÍA DE CÓDIGO REAL (2 Enero 2026)

> **Metodología:** Análisis de código fuente (SQL, Backend, Frontend) + pruebas E2E en localhost:8080
> **Usuario de prueba:** arellanestorillo@gmail.com

### ✅ Fase 0 Completada (2 Enero 2026)

Los campos que existían en BD pero no en UI han sido implementados:

| Campo | En BD | En Backend | En UI | Estado |
|-------|:-----:|:----------:|:-----:|--------|
| `fecha_nacimiento` | ✅ | ✅ | ✅ | **Implementado** |
| `documento_identidad` | ✅ | ✅ | ✅ | **Implementado** |
| `salario_base` | ✅ | ✅ | ✅ | **Implementado** (sección Compensación) |
| `forma_pago` | ✅ | ✅ | ✅ | **Implementado** (sección Compensación) |
| `años_experiencia` | ✅ | ✅ | ✅ | **Implementado** (sección Info Profesional) |
| `licencias_profesionales` | ✅ | ✅ | ✅ | **Implementado** (textarea) |
| `idiomas` | ✅ | ✅ | ✅ | **Implementado** (MultiSelect) |
| `disponible_online` | ✅ | ✅ | ✅ | **Implementado** (toggle) |

### ⚠️ Campo Eliminado: `comision_porcentaje`

| Campo | Decisión | Justificación |
|-------|----------|---------------|
| `comision_porcentaje` | **ELIMINADO** | Duplicaba funcionalidad del Módulo Comisiones |

**Análisis arquitectónico:**
- El campo `comision_porcentaje` en `profesionales` era **"dead code"** - nunca se usaba en los triggers de cálculo de comisiones
- Las comisiones operativas se configuran en `configuracion_comisiones` (Módulo Comisiones) que permite:
  - Comisión diferente por servicio
  - Comisión diferente por producto
  - Reglas específicas por profesional
- **Principio aplicado:** Single Source of Truth (SSOT)

**Campos de compensación que SÍ permanecen (para HR/Nómina futura):**
- `salario_base` → Salario mensual contractual
- `forma_pago` → Modalidad: 'comision', 'salario', 'mixto'

### 📊 Tablas Existentes vs Propuestas

**Tablas que SÍ existen (13):**
```
profesionales                  ✅ Tabla principal (34+ columnas)
categorias_profesional         ✅ Catálogo de categorías
profesionales_categorias       ✅ Relación M:N
departamentos                  ✅ Estructura organizacional
puestos                        ✅ Estructura organizacional
horarios_profesionales         ✅ Agendamiento
profesionales_sucursales       ✅ Multi-sucursal
servicios_profesionales        ✅ Servicios asignados
invitaciones_profesionales     ✅ Sistema de invitaciones
configuracion_comisiones       ✅ Sistema de comisiones (Módulo Comisiones)
bloqueos_horarios              ✅ Vacaciones/ausencias (módulo agendamiento)
workflow_delegaciones          ✅ Delegaciones por ausencia
eventos_sistema                ✅ Auditoría
```

**Tablas implementadas (plan completado):**
```
documentos_empleado            ✅ Fase 2 (2 Ene 2026)
cuentas_bancarias_empleado     ✅ Fase 1 (2 Ene 2026)
politicas_vacaciones           ✅ Fase 3 (3 Ene 2026)
saldos_vacaciones              ✅ Fase 3 (3 Ene 2026)
solicitudes_vacaciones         ✅ Fase 3 (3 Ene 2026)
niveles_vacaciones             ✅ Fase 3 (3 Ene 2026)
dias_festivos                  ✅ Fase 3 (3 Ene 2026)
experiencia_laboral            ✅ Fase 4 (3 Ene 2026)
educacion_formal               ✅ Fase 4 (3 Ene 2026)
catalogo_habilidades           ✅ Fase 4 (3 Ene 2026)
habilidades_empleado           ✅ Fase 4 (3 Ene 2026)
plantillas_onboarding          ✅ Fase 5 (3 Ene 2026)
tareas_onboarding              ✅ Fase 5 (3 Ene 2026)
progreso_onboarding            ✅ Fase 5 (3 Ene 2026)
```

---

## Estado Actual del Módulo en Nexo (Enero 2026)

### Arquitectura Actual

El sistema de empleados en Nexo **NO es un módulo único**, sino que se distribuye entre:

| Módulo | Tabla Principal | Propósito |
|--------|-----------------|-----------|
| `profesionales` | `profesionales` | Entidad principal de empleados |
| `organizacion` | `departamentos`, `puestos`, `categorias_profesional` | Estructura organizacional |
| `agendamiento` | `bloqueos_horarios` | Vacaciones, permisos, ausencias |
| `comisiones` | `configuracion_comisiones` | Reglas de comisión por servicio/producto |
| `workflows` | `workflow_delegaciones` | Delegaciones por ausencia |
| `auditoria` | `eventos_sistema` | Registro de acciones |

### Funcionalidades Implementadas (Actualizado 2 Enero 2026)

| Componente | Estado | Notas |
|------------|--------|-------|
| **Datos básicos** | ✅ Completo | Nombre, email, teléfono, foto, código empleado |
| **Información personal** | ✅ Completo | Género, estado civil, dirección, contacto emergencia, **fecha_nacimiento**, **documento_identidad** |
| **Jerarquía organizacional** | ✅ Completo | Supervisor, departamento, puesto, subordinados (CTE recursivo) |
| **Estados laborales** | ✅ Completo | activo, vacaciones, incapacidad, suspendido, baja |
| **Tipos de contratación** | ✅ Completo | tiempo_completo, medio_tiempo, temporal, contrato, freelance |
| **Fechas laborales** | ✅ Completo | Ingreso, baja, motivo de baja |
| **Compensación básica** | ✅ Completo | salario_base, forma_pago (solo admin/propietario) |
| **Comisiones operativas** | ✅ Completo | Módulo Comisiones (configuracion_comisiones) |
| **Categorías/especialidades** | ✅ Completo | Relación M:N flexible con tipos personalizables |
| **Bloqueos (vacaciones)** | ✅ Completo | Día completo/parcial, recurrencia, notificaciones |
| **Delegaciones** | ✅ Completo | Delegar aprobaciones por ausencia |
| **Organigrama visual** | ✅ Completo | Vista jerárquica con filtros |
| **Búsqueda avanzada** | ✅ Completo | Full-text en español, filtros JSONB |
| **Auditoría** | ✅ Completo | Eventos del sistema con IP, User-Agent |
| **Vinculación usuario** | ✅ Completo | Profesional ↔ Usuario del sistema |
| **Métricas automáticas** | ✅ Completo | Calificación, citas completadas, clientes atendidos |
| **Experiencia profesional** | ✅ Completo | **años_experiencia**, **licencias_profesionales**, **idiomas** |
| **Disponibilidad online** | ✅ Completo | Toggle para booking público |

---

## 1. Comparativa de Funcionalidades

### Leyenda
- ✅ Implementado completo
- ⚡ Implementado parcial
- ❌ No implementado

| Funcionalidad | Nexo | Odoo 19 | Notas |
|--------------|------|---------|-------|
| **DATOS BÁSICOS** |
| Nombre completo | ✅ | ✅ | |
| Foto de perfil | ✅ | ✅ | |
| Email de trabajo | ✅ | ✅ | |
| Teléfono de trabajo | ✅ | ✅ | |
| Celular de trabajo | ✅ | ✅ | |
| Código de empleado | ✅ | ❌ | Nexo tiene código único (EMP001) |
| Etiquetas/Tags | ⚡ | ✅ | Nexo usa categorías M:N |
| **INFORMACIÓN PERSONAL** |
| Fecha de nacimiento | ✅ | ✅ | **Implementado Fase 0** |
| Género | ✅ | ✅ | |
| Estado civil | ✅ | ✅ | |
| Documento de identidad | ✅ | ✅ | **Implementado Fase 0** |
| Número de pasaporte | ✅ | ✅ | **Implementado Fase 1** |
| Número seguro social | ✅ | ✅ | **Implementado Fase 1** |
| Nacionalidad | ✅ | ✅ | **Implementado Fase 1** |
| Lugar de nacimiento | ✅ | ✅ | Ciudad + País **Implementado Fase 1** |
| Dirección particular | ✅ | ✅ | |
| Distancia casa-trabajo | ✅ | ✅ | En km **Implementado Fase 1** |
| Hijos dependientes | ✅ | ✅ | Cantidad **Implementado Fase 1** |
| Email privado | ✅ | ✅ | **Implementado Fase 1** |
| Teléfono privado | ✅ | ✅ | **Implementado Fase 1** |
| **CONTACTO EMERGENCIA** |
| Nombre contacto | ✅ | ✅ | |
| Teléfono contacto | ✅ | ✅ | |
| **DOCUMENTOS** |
| Visa/Permiso trabajo | ✅ | ✅ | **Implementado Fase 2** (15 tipos documento) |
| Copia de identificación | ✅ | ✅ | **Implementado Fase 2** |
| Licencia de conducir | ✅ | ✅ | **Implementado Fase 2** |
| Cuentas bancarias | ✅ | ✅ | **Implementado Fase 1** |
| **ORGANIZACIÓN** |
| Departamentos jerárquicos | ✅ | ✅ | Ambos soportan padre-hijo |
| Puestos de trabajo | ✅ | ✅ | |
| Supervisor/Gerente | ✅ | ✅ | |
| Organigrama visual | ✅ | ✅ | |
| Ubicaciones de trabajo | ❌ | ✅ | Oficinas, sucursales |
| Ubicación por día | ❌ | ✅ | Lun-Dom configurable |
| **CONTRATO/NÓMINA** |
| Tipo de empleado | ✅ | ✅ | |
| Tipo de contratación | ✅ | ✅ | 5 tipos en Nexo |
| Salario base | ✅ | ✅ | **Implementado Fase 0** |
| Forma de pago | ✅ | ❌ | **Implementado Fase 0** (comision/salario/mixto) |
| Comisiones | ✅ | ⚡ | Nexo tiene Módulo Comisiones completo |
| Plantillas de contrato | ❌ | ✅ | |
| Horario laboral | ⚡ | ✅ | Nexo en JSONB, Odoo más estructurado |
| Categoría de pago | ❌ | ✅ | Para nómina |
| Cálculo de nómina | ❌ | ✅ | Módulo completo en Odoo |
| **CURRÍCULUM/CV** |
| Experiencia laboral | ✅ | ✅ | **Implementado Fase 4** |
| Educación formal | ✅ | ✅ | **Implementado Fase 4** |
| Habilidades | ✅ | ✅ | **Implementado Fase 4** con niveles 1-5 |
| Certificaciones | ✅ | ✅ | **licencias_profesionales implementado Fase 0** |
| Idiomas | ✅ | ❌ | **MultiSelect implementado Fase 0** |
| Años de experiencia | ✅ | ❌ | **Implementado Fase 0** |
| **AUSENCIAS/VACACIONES** |
| Bloqueos manuales | ✅ | ✅ | |
| Día completo/parcial | ✅ | ✅ | |
| Recurrencia | ✅ | ❌ | Nexo soporta patrones |
| Notificación a afectados | ✅ | ⚡ | |
| Saldo de vacaciones | ✅ | ✅ | **Implementado Fase 3** con niveles LFT |
| Solicitud/Aprobación | ✅ | ✅ | **Implementado Fase 3** con bloqueo automático |
| **APRENDIZAJE** |
| Capacitaciones | ❌ | ✅ | |
| Asistencias a cursos | ❌ | ✅ | |
| Certificaciones obtenidas | ✅ | ✅ | Via licencias_profesionales |
| **ONBOARDING** |
| Plan de integración | ✅ | ✅ | **Implementado Fase 5** con plantillas |
| Motivos de salida | ❌ | ✅ | Catálogo configurable |
| **SISTEMA** |
| Usuario vinculado | ✅ | ✅ | |
| Zona horaria | ✅ | ✅ | **Implementado Fase 1** |
| Responsable de RRHH | ✅ | ✅ | **Implementado Fase 1** |
| Código NIP (asistencia) | ✅ | ✅ | **Implementado Fase 1** |
| ID de credencial | ✅ | ✅ | **Implementado Fase 1** |
| **REPORTES** |
| Dashboard empleados | ⚡ | ✅ | |
| Gráficos/Pivot | ❌ | ✅ | Múltiples vistas |
| Exportación | ❌ | ✅ | |

---

## 2. Fortalezas Actuales de Nexo

### Ventajas Competitivas

1. **Código de empleado único** - Odoo no lo tiene nativo
2. **Categorías flexibles M:N** - Sistema más versátil que etiquetas simples
3. **Idiomas como MultiSelect** - Fácil de gestionar (implementado Fase 0)
4. **Años de experiencia** - Campo dedicado (implementado Fase 0)
5. **Bloqueos con recurrencia** - Más potente que Odoo
6. **Notificación automática a afectados** - Por bloqueos/vacaciones
7. **Métricas automáticas** - Calificación, citas, clientes (orientado a servicios)
8. **Jerarquía con CTE recursivo** - Consultas eficientes de subordinados/supervisores
9. **Comisiones integradas** - Módulo completo con reglas por servicio/producto
10. **RLS multi-tenant robusto** - 430+ políticas
11. **Búsqueda full-text en español** - Optimizada para LATAM
12. **Soft delete con auditoría** - Quién eliminó y cuándo
13. **Separación clara de datos** - Compensación contractual (HR) vs comisiones operativas (Módulo Comisiones)

---

## 3. Plan de Implementación

### ✅ Fase 0: Quick Win - Campos en BD sin UI (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (2 Enero 2026)

#### Implementaciones realizadas:

**Archivo:** `frontend/src/components/profesionales/ProfesionalFormModal.jsx`

| Sección | Campos Implementados |
|---------|---------------------|
| **Datos Personales** | `fecha_nacimiento`, `documento_identidad` |
| **Información Profesional** (nueva) | `años_experiencia`, `idiomas` (MultiSelect), `licencias_profesionales`, `disponible_online` |
| **Compensación** (nueva, solo admin) | `salario_base`, `forma_pago` |

**Constantes agregadas:** `frontend/src/hooks/useProfesionales.js`
- `FORMAS_PAGO` - { comision, salario, mixto }
- `IDIOMAS_DISPONIBLES` - 13 idiomas incluyendo Náhuatl y Maya

**Decisión arquitectónica:**
- ❌ `comision_porcentaje` **ELIMINADO** de BD, backend y frontend
- ✅ Comisiones operativas se configuran en Módulo Comisiones (`configuracion_comisiones`)

#### Bugs corregidos durante validación E2E:

| Bug | Causa | Solución | Archivo |
|-----|-------|----------|---------|
| Error 400 al crear profesional | Frontend enviaba `fecha_contratacion`, backend esperaba `fecha_ingreso` | Corregido nombre del campo en submit | `ProfesionalFormModal.jsx:574` |
| Campo licencias mostraba "{}" | `JSON.stringify({})` sobre objeto vacío de BD | Verificar `Object.keys(val).length === 0` antes de stringify | `ProfesionalFormModal.jsx:382-392` |

#### Prueba E2E exitosa:
- **Profesional creado:** María García López
- **Email:** maria.garcia@ejemplo.com
- **Teléfono:** 5512345678
- **Resultado:** Toast "Profesional creado e invitación enviada" ✅
- **Verificación:** Registro visible en lista de profesionales ✅

---

### ✅ Fase 1: Campos Básicos + Cuentas Bancarias (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (2 Enero 2026)
> **Campos agregados:** 13 nuevos campos en tabla profesionales
> **Nueva tabla:** cuentas_bancarias_empleado con CRUD completo

#### 1.1 Campos agregados a tabla `profesionales`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero_pasaporte` | VARCHAR(50) | Pasaporte para viajes/visa |
| `numero_seguro_social` | VARCHAR(50) | IMSS, ISSSTE, etc. |
| `nacionalidad` | VARCHAR(50) | País de nacionalidad |
| `lugar_nacimiento_ciudad` | VARCHAR(100) | Ciudad de nacimiento |
| `lugar_nacimiento_pais` | VARCHAR(50) | País de nacimiento |
| `email_privado` | VARCHAR(150) | Email personal (separado del trabajo) |
| `telefono_privado` | VARCHAR(20) | Teléfono personal |
| `distancia_casa_trabajo_km` | DECIMAL(6,2) | Para cálculo viáticos |
| `hijos_dependientes` | INTEGER | Cantidad de hijos |
| `zona_horaria` | VARCHAR(50) | Default: America/Mexico_City |
| `responsable_rrhh_id` | INTEGER (FK) | Usuario RRHH asignado |
| `codigo_nip` | VARCHAR(10) | PIN para control asistencia |
| `id_credencial` | VARCHAR(50) | ID tarjeta/credencial física |

#### 1.2 Archivos Implementados

| Archivo | Descripción |
|---------|-------------|
| `sql/profesionales/01-tablas.sql` | 13 campos nuevos en profesionales |
| `sql/profesionales/06-cuentas-bancarias.sql` | Tabla, RLS, trigger, índices |
| `backend/.../models/profesional.model.js` | CRUD actualizado con nuevos campos |
| `backend/.../models/cuenta-bancaria.model.js` | CRUD completo cuentas bancarias |
| `backend/.../controllers/cuenta-bancaria.controller.js` | 6 endpoints REST |
| `backend/.../schemas/profesional.schemas.js` | Validación Joi nuevos campos |
| `backend/.../constants/profesionales.constants.js` | Constantes TIPOS_CUENTA, USOS, MONEDAS |
| `backend/.../routes/profesionales.js` | Rutas cuentas bancarias |
| `frontend/src/hooks/useCuentasBancarias.js` | Hooks React Query |
| `frontend/src/components/.../CuentasBancariasSection.jsx` | Sección colapsable UI |
| `frontend/src/components/.../CuentaBancariaModal.jsx` | Modal crear/editar cuenta (fix forms anidados) |
| `frontend/src/services/api/endpoints.js` | 6 métodos API cuentas bancarias |
| `frontend/src/.../ProfesionalFormModal.jsx` | Schemas Zod + sección integrada |
| `init-data.sh` | SQL agregado para deploy desde cero |

#### 1.4 Bugs Corregidos Durante Validación E2E

| Bug | Causa | Solución | Archivo |
|-----|-------|----------|---------|
| Formularios anidados | `<form>` dentro de `<form>` en ProfesionalFormModal | Crear `CuentaBancariaModal.jsx` como modal independiente | `CuentaBancariaModal.jsx` (nuevo) |
| Botón Guardar no funcionaba | El submit del form interno conflictuaba con el form padre | Modal se renderiza fuera del árbol DOM del form padre | `CuentasBancariasSection.jsx` |

#### 1.5 Prueba E2E Exitosa
- **Cuenta 1 (API):** BBVA - 1234567890 - Principal ✅
- **Cuenta 2 (UI):** Santander - 9876543210 ✅
- **Toast:** "Cuenta bancaria creada" ✅
- **Lista actualizada:** "Cuentas Bancarias 2" ✅

#### 1.6 Endpoints API Cuentas Bancarias

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/profesionales/:id/cuentas-bancarias` | Listar cuentas |
| POST | `/profesionales/:id/cuentas-bancarias` | Crear cuenta |
| GET | `/profesionales/:id/cuentas-bancarias/:cuentaId` | Obtener detalle |
| PUT | `/profesionales/:id/cuentas-bancarias/:cuentaId` | Actualizar |
| DELETE | `/profesionales/:id/cuentas-bancarias/:cuentaId` | Soft delete |
| PATCH | `/profesionales/:id/cuentas-bancarias/:cuentaId/principal` | Establecer principal |

---

### ✅ Fase 2: Documentos del Empleado (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (2 Enero 2026)
> **Arquitectura:** Tabla separada `documentos_empleado` con FK a `archivos_storage`
> **Storage:** Bucket PRIVADO (nexo-private) con URLs presigned temporales
> **Alertas:** pg_cron diario 8:00 AM con notificaciones automáticas

#### Implementación Realizada:

| Archivo | Descripción |
|---------|-------------|
| `sql/profesionales/05-documentos-empleado.sql` | Tabla, ENUM, índices, RLS, pg_cron |
| `backend/app/modules/profesionales/models/documento.model.js` | CRUD con RLSContextManager |
| `backend/app/modules/profesionales/controllers/documento.controller.js` | 8 endpoints REST |
| `frontend/src/components/profesionales/DocumentosEmpleadoSection.jsx` | Sección colapsable |
| `frontend/src/components/profesionales/DocumentoUploadModal.jsx` | Modal upload FormData |
| `frontend/src/hooks/useDocumentosEmpleado.js` | Hooks React Query |
| `frontend/src/services/api/endpoints.js` | documentosEmpleadoApi agregado |
| `backend/app/services/storage/minio.client.js` | minioPublicClient para presigned URLs |
| `init-data.sh` | SQL agregado para deploy desde cero |

#### Bugs Corregidos Durante E2E:

| Bug | Ubicación | Solución |
|-----|-----------|----------|
| `column a.ruta does not exist` | `documento.model.js:170` | Cambiar `a.ruta` → `a.path` |
| Presigned URLs inaccesibles | `minio.client.js` | Crear `minioPublicClient` con endpoint `localhost` y `region: 'us-east-1'` |

#### Tipos de Documento Implementados (15):
`identificacion`, `pasaporte`, `licencia_conducir`, `contrato`, `visa`, `certificado`, `seguro_social`, `comprobante_domicilio`, `carta_recomendacion`, `acta_nacimiento`, `curp`, `rfc`, `titulo_profesional`, `cedula_profesional`, `otro`

#### Prueba E2E Exitosa:
- Documento subido: "INE Ana Martínez 2026" (PDF)
- Verificación de lista con conteo y badges de estado
- Descarga via presigned URL funcionando ✅
- Marcar como verificado funcionando ✅

---

### ✅ Fase 3: Sistema de Vacaciones (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (3 Enero 2026)
> **Arquitectura:** Módulo separado que reutiliza `bloqueos_horarios`
> **Análisis Competitivo:** ✅ Completado - Investigación Odoo 19

#### 3.0 Implementación Realizada

##### Archivos Backend Creados:
```
backend/app/modules/vacaciones/
├── constants/vacaciones.constants.js
├── schemas/vacaciones.schemas.js
├── models/
│   ├── politicas.model.js
│   ├── niveles.model.js
│   ├── saldos.model.js
│   └── solicitudes.model.js
├── controllers/vacaciones.controller.js
└── routes/index.js
```

##### Archivos Frontend Creados:
```
frontend/src/
├── hooks/useVacaciones.js (20+ hooks)
├── pages/vacaciones/VacacionesPage.jsx
└── components/vacaciones/
    ├── VacacionesDashboard.jsx
    ├── SaldoVacacionesCard.jsx
    ├── SolicitudVacacionesModal.jsx
    └── SolicitudesVacacionesList.jsx
```

##### SQL (2 archivos):
- `sql/vacaciones/01-tablas.sql` - Políticas, saldos, solicitudes, dias_festivos
- `sql/vacaciones/02-niveles.sql` - Niveles por antigüedad + datos LFT México

##### Endpoints API (14):
| Ruta | Descripción |
|------|-------------|
| `GET/PUT /vacaciones/politica` | Política de la org |
| `GET/POST /vacaciones/niveles` | Niveles por antigüedad |
| `POST /vacaciones/niveles/preset` | Crear niveles LFT México/Colombia |
| `GET /vacaciones/mi-saldo` | Mi saldo actual |
| `GET /vacaciones/saldos` | Listar saldos (admin) |
| `POST /vacaciones/solicitudes` | Crear solicitud |
| `GET /vacaciones/mis-solicitudes` | Mis solicitudes |
| `POST /.../aprobar` | Aprobar (crea bloqueo) |
| `POST /.../rechazar` | Rechazar |
| `GET /vacaciones/dashboard` | Dashboard personal |

##### Ventajas Competitivas sobre Odoo:
| Ventaja | Descripción |
|---------|-------------|
| **Bloqueo automático** | Al aprobar → crea bloqueo_horarios |
| **Integración citas** | Profesional no disponible para agendar |
| **Días reservados** | `dias_solicitados_pendientes` evita sobregiro |
| **Niveles LFT México** | 12 niveles según Ley Federal del Trabajo |
| **Campo calculado** | `dias_pendientes` GENERATED en PostgreSQL |

##### Prueba E2E Exitosa:
- Solicitud VAC-2026-0002 creada desde UI
- Fechas: 20-23 enero 2026 (4 días hábiles)
- Estado: Pendiente
- Saldo actualizado: 11 → 7 días disponibles

---

#### 3.1 Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO VACACIONES                        │
├─────────────────────────────────────────────────────────────┤
│  politicas_vacaciones  →  niveles_vacaciones               │
│         (1:N org)              (12 niveles LFT)             │
│              ↓                                              │
│       saldos_vacaciones (1:N prof/año)                     │
│              ↓                                              │
│       solicitudes_vacaciones                                │
│              │ Al aprobar                                   │
│              ↓                                              │
│       bloqueos_horarios (auto_generado=true)               │
│              ↓                                              │
│       CitaValidacionUtil → Profesional no disponible       │
└─────────────────────────────────────────────────────────────┘
```

#### 3.2 Flujo Implementado

1. **Empleado solicita** → Validar saldo/anticipación → Reservar días
2. **Aprobador aprueba** → Crear bloqueo automático → Actualizar saldo
3. **Bloqueo afecta citas** → CitaValidacionUtil detecta indisponibilidad

### ✅ Fase 4: Currículum y Habilidades (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (3 Enero 2026)

**Archivos implementados:**
- `sql/profesionales/07-curriculum.sql` - Tablas experiencia, educación, habilidades
- `backend/.../models/experiencia.model.js`, `educacion.model.js`, `habilidad.model.js`
- `backend/.../controllers/experiencia.controller.js`, `educacion.controller.js`, `habilidad.controller.js`
- `frontend/src/components/profesionales/ExperienciaLaboralSection.jsx`
- `frontend/src/components/profesionales/EducacionFormalSection.jsx`
- `frontend/src/components/profesionales/HabilidadesSection.jsx`
- `frontend/src/hooks/useExperienciaLaboral.js`, `useEducacionFormal.js`, `useHabilidades.js`

**Funcionalidades:**
- Experiencia laboral con empleos actuales y anteriores
- Educación formal con niveles (preparatoria→doctorado)
- Catálogo de habilidades con niveles 1-5 y verificación

### ✅ Fase 5: Onboarding de Empleados (COMPLETADA)

> **Estado:** ✅ **COMPLETADA** (3 Enero 2026)

**Archivos implementados:**
- `sql/profesionales/08-onboarding-empleados.sql` - Tablas + funciones + vistas
- `backend/.../models/onboarding.model.js`
- `backend/.../controllers/onboarding.controller.js`
- `backend/.../schemas/onboarding.schemas.js`
- `backend/.../routes/onboarding.js`
- `frontend/src/components/profesionales/OnboardingProgresoSection.jsx`
- `frontend/src/components/profesionales/OnboardingAplicarModal.jsx`
- `frontend/src/pages/onboarding-empleados/OnboardingAdminPage.jsx`
- `frontend/src/hooks/useOnboardingEmpleados.js`

**Funcionalidades:**
- Plantillas de onboarding por departamento/puesto
- Tareas con responsables (empleado/supervisor/rrhh)
- Aplicación automática de plantillas a profesionales
- Progreso visual con porcentaje de completado
- Dashboard RRHH con estadísticas

**Bug corregido:** `$5::INTEGER` cast en `marcarTareaCompletada` para tipo completado_por

---

## 4. Estimación de Esfuerzo

| Fase | Duración | Estado |
|------|----------|--------|
| **Fase 0:** Quick Win (campos BD→UI) | 1 día | ✅ **COMPLETADA** (2 Ene) |
| **Fase 1:** Campos básicos + Cuentas Bancarias | 1 día | ✅ **COMPLETADA** (2 Ene) |
| **Fase 2:** Documentos del empleado | 1 día | ✅ **COMPLETADA** (2 Ene) |
| **Fase 3:** Sistema de vacaciones | 1 día | ✅ **COMPLETADA** (3 Ene) |
| **Fase 4:** Currículum y habilidades | 1 día | ✅ **COMPLETADA** (3 Ene) |
| **Fase 5:** Onboarding empleados | 1 día | ✅ **COMPLETADA** (3 Ene) |
| **PLAN COMPLETO** | **2 días** | ✅ **TERMINADO** |

---

## 5. Conclusión

### ✅ PLAN COMPLETADO (3 Enero 2026)

Nexo ahora es **competitivo con Odoo 19** en funcionalidades RRHH:

| Categoría | Estado |
|-----------|--------|
| Datos personales completos | ✅ |
| Documentos empleado (15 tipos) | ✅ |
| Cuentas bancarias | ✅ |
| Sistema vacaciones (LFT México) | ✅ |
| Currículum (experiencia/educación) | ✅ |
| Habilidades con niveles | ✅ |
| Onboarding con plantillas | ✅ |

### Ventajas competitivas de Nexo:
- Código de empleado único
- Bloqueos con recurrencia
- Vacaciones → bloqueo automático (afecta citas)
- Niveles por antigüedad LFT México
- Onboarding por departamento/puesto
- RLS multi-tenant (430+ políticas)
- Búsqueda full-text en español

### Gaps restantes (baja prioridad):
- Plantillas de contrato
- Cálculo de nómina completo
- Capacitaciones/cursos
- Motivos de salida

---

## 6. Registro de Cambios

| Fecha | Fase | Cambio Principal |
|-------|------|------------------|
| 2 Ene 2026 | 0 | 8 campos BD→UI, `comision_porcentaje` eliminado |
| 2 Ene 2026 | 1 | 13 campos nuevos + cuentas_bancarias_empleado |
| 2 Ene 2026 | 2 | documentos_empleado (15 tipos) + MinIO presigned URLs |
| 3 Ene 2026 | 3 | Sistema vacaciones completo con niveles LFT México |
| 3 Ene 2026 | 4 | Currículum (experiencia, educación, habilidades) |
| 3 Ene 2026 | 5 | Onboarding con plantillas y progreso por profesional |

### Bugs corregidos durante implementación:
- `fecha_contratacion` → `fecha_ingreso` (Fase 0)
- `a.ruta` → `a.path` en documento.model (Fase 2)
- Presigned URLs con `minioPublicClient` (Fase 2)
- Forms anidados → modales independientes (Fase 1)
- `$5::INTEGER` cast en marcarTareaCompletada (Fase 5)

---

*Documento creado: 2 Enero 2026*
*Plan completado: 3 Enero 2026*
