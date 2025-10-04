# Tests del Backend - SaaS Agendamiento

Suite completa de tests de integración y unitarios para validar la correcta implementación de RLS multi-tenant, auto-generación de códigos y seguridad del backend.

## ⚠️ Estrategia de Testing: Desarrollo Iterativo

**IMPORTANTE:** Estos tests usan la **misma base de datos** que desarrollo (`postgres`).

**Workflow recomendado:**
1. 🧹 `npm run fresh:clean` - Limpiar datos y levantar servicios
2. 🧪 `npm run test:backend` - Ejecutar tests
3. ✅ Validar resultados
4. 🔄 Iterar

**Ventajas:**
- ✅ Mismo ambiente que SQL tests
- ✅ Workflow simple y familiar
- ✅ Iteración rápida

**Consideraciones:**
- ⚠️ Ejecutar `fresh:clean` antes de tests para estado limpio
- ⚠️ Tests modifican/borran datos de la BD
- ⚠️ Para producción, usar BD separada

## 📋 Requisitos Previos

### 1. Sistema Corriendo

```bash
# Levantar sistema completo
npm run fresh:clean

# Verificar que todo está corriendo
npm run status
```

### 2. Variables de Entorno

El archivo `.env.test` ya está configurado para usar la BD principal:

```bash
NODE_ENV=test
DB_NAME=postgres      # ← Misma BD que desarrollo
DB_USER=saas_app      # ← Usuario limitado, NO admin
```

### 3. Instalar Dependencias

```bash
cd backend/app
npm install
```

## 🧪 Ejecutar Tests

### Desde la Raíz del Proyecto (Recomendado)

```bash
# Test rápido (sin limpiar BD)
npm run test:quick

# Test completo (limpia BD + tests)
npm run test:full

# Solo preparar ambiente
npm run test:prepare
```

### Desde backend/app/

```bash
cd backend/app

# Todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch (desarrollo)
npm run test:watch

# Test individual
npx jest __tests__/integration/rls-multi-tenant.test.js
```

## 📁 Estructura de Tests

```
__tests__/
├── integration/           # Tests de integración con BD
│   ├── rls-multi-tenant.test.js          # 🔒 Tests de aislamiento RLS
│   ├── auto-generacion-codigo.test.js    # ✨ Tests de codigo_cita
│   └── triggers-automaticos.test.js      # ⚡ Tests de triggers
├── unit/                  # Tests unitarios (sin BD)
│   ├── models/
│   └── controllers/
├── e2e/                   # Tests end-to-end
│   └── citas-flow.test.js
├── helpers/               # Utilidades para tests
│   └── db-helper.js       # Helpers de BD (RLS, fixtures)
├── fixtures/              # Datos de prueba
├── setup.js               # Setup global
├── teardown.js            # Cleanup global
└── README.md              # Esta guía
```

## 🔍 Tests Implementados

### 1. RLS Multi-Tenant (`rls-multi-tenant.test.js`)

**Objetivo:** Validar que el aislamiento de datos entre organizaciones funciona al 100%.

**Tests críticos:**
- ✅ Org1 solo ve sus propios clientes
- ✅ Org1 NO puede acceder a datos de Org2 por ID
- ✅ Org1 NO puede modificar datos de Org2
- ✅ Org1 NO puede eliminar datos de Org2
- ✅ JOINs respetan RLS
- ✅ Anti SQL-injection (tenant_id validado)
- ✅ Bypass RLS solo con privilegio admin

**Comando:**
```bash
npx jest rls-multi-tenant
```

**Resultado esperado:**
```
🔒 RLS Multi-Tenant - Aislamiento de Datos
  ✓ Org1 solo ve sus propios clientes
  ✓ Org2 solo ve sus propios clientes
  ✓ Org1 NO puede acceder a clientes de Org2 por ID
  ✓ Org1 NO puede modificar clientes de Org2
  ✓ Org1 NO puede eliminar clientes de Org2
  ... (30+ tests)

Tests:       30 passed, 30 total
```

---

### 2. Auto-generación de codigo_cita (`auto-generacion-codigo.test.js`)

**Objetivo:** Validar que el trigger `generar_codigo_cita()` funciona correctamente.

**Tests críticos:**
- ✅ codigo_cita se genera automáticamente
- ✅ Formato correcto: `ORG###-YYYYMMDD-###`
- ✅ Contiene organizacion_id correcto
- ✅ Contiene fecha correcta
- ✅ Códigos únicos para misma org y fecha
- ✅ Códigos independientes entre organizaciones
- ✅ Secuencia reinicia para diferentes fechas
- ✅ CitaBaseModel NO envía codigo_cita

**Comando:**
```bash
npx jest auto-generacion-codigo
```

**Resultado esperado:**
```
✨ Auto-generación de codigo_cita
  Formato de codigo_cita
    ✓ codigo_cita se genera automáticamente
    ✓ codigo_cita tiene formato correcto: ORG###-YYYYMMDD-###
    ✓ codigo_cita contiene organizacion_id correcto
    ✓ codigo_cita contiene fecha correcta
  Unicidad de codigo_cita
    ✓ Códigos son únicos para misma organización y fecha
    ... (15+ tests)

Tests:       15 passed, 15 total
```

---

### 3. Triggers Automáticos (`triggers-automaticos.test.js`)

**Objetivo:** Validar que los triggers de BD funcionan sin intervención del backend.

**Tests críticos:**
- ✅ creado_en se establece automáticamente
- ✅ actualizado_en se actualiza en UPDATE
- ✅ creado_en NO cambia en UPDATE
- ✅ Cliente debe pertenecer a la misma organización
- ✅ Profesional debe pertenecer a la misma organización
- ✅ Servicio debe pertenecer a la misma organización
- ✅ Validaciones de horario
- ✅ Validaciones de precio
- ✅ Estados de cita permitidos

**Comando:**
```bash
npx jest triggers-automaticos
```

**Resultado esperado:**
```
⚡ Triggers Automáticos de BD
  Trigger: actualizar_timestamp
    ✓ creado_en se establece automáticamente al insertar
    ✓ actualizado_en se actualiza automáticamente en UPDATE
    ✓ creado_en NO cambia en UPDATE
  Trigger: validar_coherencia_cita
    ✓ Cliente debe pertenecer a la misma organización
    ... (20+ tests)

Tests:       20 passed, 20 total
```

---

## 🔧 Helpers de Testing

### `db-helper.js`

Funciones utilitarias para tests de BD:

**Configuración RLS:**
```javascript
const { setRLSContext, bypassRLS } = require('../helpers/db-helper');

// Configurar RLS para org 1
await setRLSContext(client, 1);

// Bypass RLS (solo para setup/cleanup)
await bypassRLS(client);
```

**Creación de fixtures:**
```javascript
const {
  createTestOrganizacion,
  createTestCliente,
  createTestProfesional,
  createTestServicio,
  createTestCita
} = require('../helpers/db-helper');

// Crear organización de test
const org = await createTestOrganizacion(client, {
  nombre: 'Mi Organización Test'
});

// Crear cita (NO envía codigo_cita, se auto-genera)
const cita = await createTestCita(client, org.id, {
  cliente_id: cliente.id,
  profesional_id: profesional.id,
  servicio_id: servicio.id,
  fecha_cita: '2025-10-10',
  hora_inicio: '10:00',
  hora_fin: '11:00',
  precio_servicio: 100.00,
  precio_final: 100.00
});

// cita.codigo_cita está auto-generado ✨
expect(cita.codigo_cita).toMatch(/^ORG\d{3}-\d{8}-\d{3}$/);
```

**Limpieza:**
```javascript
const { cleanAllTables, truncateTable } = require('../helpers/db-helper');

// Limpiar todas las tablas
await cleanAllTables(client);

// Limpiar tabla específica
await truncateTable(client, 'citas');
```

---

## 🚨 Errores Comunes

### 1. Error: "Database postgres_test does not exist"

**Solución:**
```bash
docker exec -it postgres_db psql -U admin -d postgres -c "CREATE DATABASE postgres_test;"
```

### 2. Error: "relation 'citas' does not exist"

**Causa:** La BD de test no tiene el schema.

**Solución:**
```bash
# Ejecutar scripts de schema en postgres_test
./sql/scripts/create-test-db.sh
```

### 3. Error: "permission denied for schema public"

**Causa:** Usuario `saas_app` no tiene permisos en la BD de test.

**Solución:**
```sql
-- Como admin
\c postgres_test
GRANT ALL ON SCHEMA public TO saas_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO saas_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO saas_app;
```

### 4. Tests fallan intermitentemente

**Causa:** Race conditions entre tests (ejecución en paralelo).

**Solución:**
El `jest.config.js` ya está configurado con `maxWorkers: 1` para ejecución serial.

### 5. Error: "NODE_ENV debe ser 'test'"

**Causa:** Variable de entorno incorrecta.

**Solución:**
```bash
# Verificar que existe .env.test
cat .env.test | grep NODE_ENV
# Debe mostrar: NODE_ENV=test

# Si no existe, crearlo desde .env.test.example
cp .env.test.example .env.test
```

---

## 📊 Coverage Esperado

Meta de coverage para Fase 1:

| Categoría | Meta | Actual |
|-----------|------|--------|
| **Branches** | 70% | - |
| **Functions** | 70% | - |
| **Lines** | 70% | - |
| **Statements** | 70% | - |

Ejecutar:
```bash
npm run test:coverage

# Ver reporte HTML
open coverage/lcov-report/index.html
```

---

## ✅ Checklist de Validación

Antes de aprobar el backend para producción:

- [ ] Todos los tests de RLS pasan (30+)
- [ ] Todos los tests de auto-generación pasan (15+)
- [ ] Todos los tests de triggers pasan (20+)
- [ ] Coverage >= 70% en todas las categorías
- [ ] No hay warnings en la ejecución de tests
- [ ] Tests se ejecutan en <30 segundos
- [ ] BD de test completamente aislada de desarrollo

---

## 🔗 Referencias

- **Documentación RLS:** `sql/README.md`
- **Tests de BD:** `sql/tests/README.md`
- **Auditoría Backend:** Ver reporte de auditoría
- **Jest Config:** `jest.config.js`

---

## 🤝 Contribuir

Para agregar nuevos tests:

1. Crear archivo en `__tests__/integration/` o `__tests__/unit/`
2. Seguir el patrón de tests existentes
3. Usar helpers de `db-helper.js`
4. Ejecutar `npm test` para validar
5. Actualizar este README si es necesario

---

**Última actualización:** Octubre 2025
**Mantenido por:** Equipo de Desarrollo Backend
