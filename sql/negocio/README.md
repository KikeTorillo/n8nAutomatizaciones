# 🎯 Módulo NEGOCIO - Catálogo de Servicios

**Categoría:** Modelo de Negocio
**Prioridad:** Alta
**Dependencias:** nucleo, profesionales

---

## 📊 Descripción

Catálogo de servicios personalizado por organización con configuración avanzada de precios, tiempos y metadatos.

**Refactorizado Dic 2025:** Profesionales y clientes extraídos a sus propios módulos independientes.

**Contenido actual:**
- **Servicios**: Catálogo de servicios personalizado por organización
- **Servicios_Profesionales**: Relación M:N con configuraciones personalizadas

---

## 📁 Archivos del Módulo

| Archivo | Descripción |
|---------|-------------|
| `01-tablas-negocio.sql` | Tablas servicios + servicios_profesionales |
| `02-indices.sql` | 10 índices especializados |
| `03-rls-policies.sql` | 3 políticas de aislamiento |
| `04-funciones.sql` | 1 función PL/pgSQL |
| `05-triggers.sql` | 2 triggers automáticos |
| `06-invitaciones.sql` | Sistema de invitaciones para profesionales |

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Tablas** | 2 |
| **Columnas (servicios)** | 22 |
| **Columnas (servicios_profesionales)** | 10 |
| **Índices** | 10 |
| **Políticas RLS** | 3 |
| **Funciones** | 1 |
| **Triggers** | 2 |

---

## 🔗 Dependencias

**Requiere módulos:**
- `nucleo` - Tabla `organizaciones`
- `profesionales` - Tabla `profesionales` (FK en servicios_profesionales)

**Requerido por módulos:**
- `citas` - FK servicio_id en citas_servicios
- `pos` - FK servicio_id en ventas_detalle
- `agendamiento` - Servicios disponibles para agendar

---

## 🎯 Características Destacadas

### 1. Configuración Avanzada de Servicios
```sql
duracion_minutos INTEGER NOT NULL,           -- Duración base
requiere_preparacion_minutos INTEGER,        -- Tiempo preparación pre-servicio
tiempo_limpieza_minutos INTEGER,             -- Tiempo limpieza post-servicio
max_clientes_simultaneos INTEGER DEFAULT 1,  -- Servicios grupales
```

### 2. Precios Flexibles
```sql
precio DECIMAL(10,2) NOT NULL,       -- Precio base
precio_minimo DECIMAL(10,2),         -- Rango permitido
precio_maximo DECIMAL(10,2),         -- Rango permitido
precio_personalizado DECIMAL(10,2),  -- Override por profesional
```

### 3. Búsqueda Full-Text en Español
```sql
-- Índice GIN combinado para búsqueda inteligente
CREATE INDEX idx_servicios_search_combined ON servicios USING gin(
    to_tsvector('spanish',
        COALESCE(nombre, '') || ' ' ||
        COALESCE(descripcion, '') || ' ' ||
        COALESCE(categoria, '')
    )
) WHERE activo = TRUE;
```

### 4. Configuración por Profesional
```sql
-- Tabla M:N permite personalización granular
CREATE TABLE servicios_profesionales (
    servicio_id INTEGER,
    profesional_id INTEGER,
    precio_personalizado DECIMAL(10,2),    -- Override precio
    duracion_personalizada INTEGER,         -- Override duración
    notas_especiales TEXT,                  -- Notas por profesional
);
```

---

## 🔍 Consultas Típicas

### Listar servicios por categoría
```sql
SELECT nombre, precio, duracion_minutos
FROM servicios
WHERE organizacion_id = ?
  AND categoria = 'corte'
  AND activo = TRUE
ORDER BY precio;
-- Usa idx_servicios_categoria_covering
```

### Buscar servicios por texto
```sql
SELECT nombre, precio, duracion_minutos
FROM servicios
WHERE organizacion_id = ?
  AND to_tsvector('spanish', nombre || ' ' || descripcion)
      @@ plainto_tsquery('spanish', 'corte cabello')
  AND activo = TRUE;
-- Usa idx_servicios_search_combined
```

### Servicios de un profesional con precios personalizados
```sql
SELECT s.nombre,
       COALESCE(sp.precio_personalizado, s.precio) AS precio_final,
       COALESCE(sp.duracion_personalizada, s.duracion_minutos) AS duracion_final
FROM servicios s
JOIN servicios_profesionales sp ON s.id = sp.servicio_id
WHERE sp.profesional_id = ?
  AND sp.activo = TRUE
  AND s.activo = TRUE;
-- Usa idx_servicios_profesionales_profesional
```

---

## 📝 Historial de Cambios

| Fecha | Cambio |
|-------|--------|
| Dic 2025 | **Refactorizado**: profesionales y clientes extraídos a módulos independientes |
| Nov 2025 | Migración inicial desde `sql/schema/05-business-tables.sql` |

---

## 🚀 Uso

Este módulo se ejecuta automáticamente durante `npm run clean:data` a través de `init-data.sh`:

```bash
# Orden de ejecución:
# 1. fundamentos
# 2. nucleo
# 3. catalogos
# 4. profesionales  <-- Nuevo módulo (Dic 2025)
# 5. clientes       <-- Nuevo módulo (Dic 2025)
# 6. negocio        <-- ESTE MÓDULO (solo servicios)
# 7. organizacion
# 8. agendamiento
# 9. ...resto de módulos
```

---

*Refactorizado Diciembre 2025*
