# 🧑‍💼 Módulo CLIENTES - Base de Datos de Clientes

**Categoría:** Entidades Core
**Prioridad:** Alta
**Dependencias:** nucleo (organizaciones), profesionales

---

## 📊 Descripción

Base de datos de clientes con soporte multi-canal (Telegram, WhatsApp, teléfono tradicional). Incluye validaciones inteligentes, búsqueda fuzzy y control de marketing.

**Características:**
- Multi-canal: Telegram, WhatsApp, teléfono
- Búsqueda fuzzy por nombre y teléfono
- Profesional preferido para asignación automática
- Control granular de marketing

---

## 📁 Archivos del Módulo

| Archivo | Descripción |
|---------|-------------|
| `01-tablas.sql` | Tabla clientes + FKs |
| `02-indices.sql` | 13 índices especializados |
| `03-rls-policies.sql` | 3 políticas de aislamiento |

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Tablas** | 1 |
| **Columnas** | 17 |
| **Índices** | 13 |
| **Políticas RLS** | 3 |
| **Constraints** | 5 |

---

## 🔗 Dependencias

**Requiere módulos:**
- `nucleo` - Tabla `organizaciones`
- `profesionales` - FK profesional_preferido_id

**Requerido por módulos:**
- `citas` - FK cliente_id
- `pos` - FK cliente_id en ventas
- `recordatorios` - Notificaciones a clientes
- `chatbots` - Búsqueda fuzzy para IA

---

## 🎯 Características Destacadas

### 1. Multi-Canal
```sql
telegram_chat_id VARCHAR(50),   -- ID de Telegram
whatsapp_phone VARCHAR(50),     -- Número WhatsApp internacional
telefono VARCHAR(20),           -- Teléfono tradicional
```

### 2. Búsqueda Fuzzy (Trigram)
```sql
-- Búsqueda por teléfono similar
WHERE similarity(telefono, '555-1234') > 0.3

-- Búsqueda por nombre similar
WHERE similarity(nombre, 'Juan Perez') > 0.2
```

### 3. Constraints Únicos por Organización
- Email único por organización
- Teléfono único por organización (parcial, permite NULL)
- Telegram chat_id único por organización
- WhatsApp phone único por organización

---

## 🔍 Consultas Típicas

### Buscar cliente por teléfono (fuzzy)
```sql
SELECT nombre, telefono, email
FROM clientes
WHERE organizacion_id = ?
  AND similarity(telefono, '555-1234') > 0.3
ORDER BY similarity(telefono, '555-1234') DESC
LIMIT 10;
-- Usa idx_clientes_telefono_trgm
```

### Clientes para marketing
```sql
SELECT nombre, email, telefono
FROM clientes
WHERE organizacion_id = ?
  AND marketing_permitido = TRUE
  AND activo = TRUE;
-- Usa idx_clientes_marketing
```

---

*Extraído de sql/negocio/ - Diciembre 2025*
