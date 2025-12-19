# 👷 Módulo PROFESIONALES - Gestión de Empleados

**Categoría:** Entidades Core
**Prioridad:** Alta
**Dependencias:** nucleo (organizaciones, usuarios)

---

## 📊 Descripción

Módulo central de gestión de empleados/profesionales. Soporta todos los tipos de colaboradores: operativos, administrativos, gerenciales y ventas.

**Modelo de Control:**
- `tipo` → Solo clasificación organizacional (reportes, organigrama)
- `modulos_acceso` → ★ CONTROL PRINCIPAL de funcionalidades ★
- `categorias` (M:N) → Especialidad, nivel, certificaciones

---

## 📁 Archivos del Módulo

| Archivo | Descripción |
|---------|-------------|
| `01-tablas.sql` | Tabla profesionales + FKs con usuarios |
| `02-indices.sql` | 11 índices especializados |
| `03-rls-policies.sql` | Política de aislamiento multi-tenant |
| `04-triggers.sql` | Trigger de timestamps |

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Tablas** | 1 |
| **Columnas** | 35 |
| **Índices** | 11 |
| **Políticas RLS** | 1 |
| **Triggers** | 1 |
| **Foreign Keys** | 2 |

---

## 🔗 Dependencias

**Requiere módulos:**
- `nucleo` - Tabla `organizaciones` y `usuarios`
- `core/fundamentos` - ENUMs y funciones base

**Requerido por módulos:**
- `clientes` - FK profesional_preferido_id
- `servicios` - Tabla servicios_profesionales
- `organizacion` - Tabla profesionales_categorias
- `agendamiento` - Tabla horarios_profesionales
- `citas` - FK profesional_id
- `comisiones` - Tablas de comisiones
- `sucursales` - Tabla profesionales_sucursales

---

## 🎯 Características Destacadas

### 1. Control de Acceso por Módulos
```sql
modulos_acceso JSONB DEFAULT '{"agendamiento": true, "pos": false, "inventario": false}'
```
- Determina QUÉ puede hacer el empleado
- Independiente del campo `tipo`

### 2. Jerarquía Organizacional
- `supervisor_id` → Jefe directo (auto-referencia)
- `departamento_id` → Departamento asignado
- `puesto_id` → Puesto de trabajo

### 3. Vinculación con Usuario
```sql
usuario_id INTEGER UNIQUE  -- Usuario del sistema vinculado
```
- Permite auto-asignación en POS
- Comisiones unificadas (citas + ventas)

---

## 🔍 Consultas Típicas

### Listar profesionales disponibles online
```sql
SELECT nombre_completo, calificacion_promedio, telefono, email
FROM profesionales
WHERE organizacion_id = ?
  AND activo = TRUE
  AND disponible_online = TRUE
ORDER BY calificacion_promedio DESC;
-- Usa idx_profesionales_disponibles_covering (Index-Only Scan)
```

### Profesionales con acceso a POS
```sql
SELECT * FROM profesionales
WHERE organizacion_id = ?
  AND activo = TRUE
  AND modulos_acceso->>'pos' = 'true';
-- Usa idx_profesionales_modulos_gin
```

---

*Extraído de sql/negocio/ - Diciembre 2025*
