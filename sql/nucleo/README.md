# Módulo Núcleo (nucleo)

Tablas fundamentales del sistema multi-tenant.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `01-tablas-core.sql` | Organizaciones, usuarios, departamentos, puestos |
| `02-tablas-subscripciones.sql` | Planes, suscripciones, límites |
| `03-indices.sql` | Índices de las tablas core |
| `04-rls-policies.sql` | Políticas RLS para aislamiento multi-tenant |
| `05-funciones.sql` | Funciones auxiliares del núcleo |
| `06-triggers.sql` | Triggers de auditoría y validación |
| `07-datos-iniciales.sql` | Datos seed (planes, roles) |
| `08-funciones-modulos.sql` | Funciones para verificar módulos activos |
| `09-vistas-modulos.sql` | Vistas de estado de módulos |
| `10-activaciones-cuenta.sql` | Sistema de activación por email |
| `11-tablas-permisos.sql` | **Sistema de permisos normalizados** |
| `12-funciones-permisos.sql` | **Funciones para consultar permisos** |
| `13-datos-permisos.sql` | **Catálogo de permisos y permisos por rol** |

## Sistema de Permisos (Fase 3B)

Sistema normalizado que reemplaza los campos JSONB (`modulos_acceso`, `permisos_override`).

### Tablas

```
permisos_catalogo          -- Catálogo maestro de permisos del sistema
    ├── codigo             -- Identificador único (ej: 'pos.max_descuento')
    ├── modulo             -- Módulo al que pertenece
    ├── tipo_valor         -- booleano, numerico, texto, lista
    └── valor_default      -- Valor por defecto (JSONB)

permisos_rol               -- Permisos asignados a cada rol
    ├── rol                -- admin, propietario, empleado, bot, cliente
    ├── permiso_id         -- FK a permisos_catalogo
    └── valor              -- Valor para este rol (JSONB)

permisos_usuario_sucursal  -- Override por usuario en sucursal específica
    ├── usuario_id         -- FK a usuarios
    ├── sucursal_id        -- FK a sucursales
    ├── permiso_id         -- FK a permisos_catalogo
    ├── valor              -- Override específico (JSONB)
    ├── otorgado_por       -- Auditoría: quién lo otorgó
    └── fecha_fin          -- Permisos temporales
```

### Jerarquía de Resolución

```
1. Override usuario/sucursal (si existe y está vigente)
2. Permiso del rol del usuario
3. Valor default del catálogo
```

### Funciones Principales

```sql
-- Obtener valor de un permiso (retorna JSONB)
SELECT obtener_permiso(usuario_id, sucursal_id, 'pos.max_descuento');

-- Verificar permiso booleano (retorna BOOLEAN)
SELECT tiene_permiso(usuario_id, sucursal_id, 'pos.acceso');

-- Obtener valor numérico
SELECT obtener_valor_permiso_numerico(usuario_id, sucursal_id, 'pos.max_descuento');

-- Todos los permisos de un usuario
SELECT * FROM obtener_permisos_usuario(usuario_id, sucursal_id);

-- Permisos de un módulo específico
SELECT * FROM obtener_permisos_modulo(usuario_id, sucursal_id, 'pos');

-- Verificar en middleware (lanza excepción si no tiene permiso)
SELECT verificar_permiso_middleware(usuario_id, sucursal_id, 'pos.acceso');
```

### Categorías de Permisos

| Módulo | Permisos |
|--------|----------|
| `acceso` | Acceso a módulos principales |
| `agendamiento` | Crear, editar, cancelar citas |
| `pos` | Ventas, descuentos, devoluciones |
| `inventario` | Productos, órdenes de compra |
| `clientes` | CRUD de clientes |
| `profesionales` | Gestión de empleados |
| `contabilidad` | Asientos, periodos |
| `reportes` | Acceso a reportes |
| `configuracion` | Configuración del sistema |

### Ejemplo de Uso en Backend

```javascript
// Verificar permiso antes de acción
const tienePermiso = await pool.query(
  'SELECT tiene_permiso($1, $2, $3)',
  [userId, sucursalId, 'pos.aplicar_descuentos']
);

if (!tienePermiso.rows[0].tiene_permiso) {
  throw new ForbiddenError('No tienes permiso para aplicar descuentos');
}

// Obtener límite numérico
const limite = await pool.query(
  'SELECT obtener_valor_permiso_numerico($1, $2, $3)',
  [userId, sucursalId, 'pos.max_descuento']
);

if (descuento > limite.rows[0].obtener_valor_permiso_numerico) {
  throw new ValidationError('Descuento excede el límite permitido');
}
```

## Dependencias

- Requiere extensiones: ninguna adicional
- Depende de: `sql/core/fundamentos/` (ENUMs)
- Requerido por: todos los demás módulos
