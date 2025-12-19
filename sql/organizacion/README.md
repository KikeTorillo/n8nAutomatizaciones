# Módulo Organización

Sistema de gestión de estructura organizacional para empleados.

## Contenido

| Archivo | Descripción |
|---------|-------------|
| `01-tablas.sql` | Tablas: departamentos, puestos, categorias_profesional, profesionales_categorias |
| `02-indices.sql` | Índices para nuevos campos en profesionales |
| `03-foreign-keys.sql` | FKs diferidas (supervisor, departamento, puesto, categorías) |
| `04-funciones.sql` | Funciones de jerarquía (subordinados, supervisores) |
| `05-rls-policies.sql` | Políticas RLS para aislamiento multi-tenant |

## Orden de Ejecución

```
1. sql/core/fundamentos/02-tipos-enums-core.sql  (ENUMs nuevos)
2. sql/organizacion/01-tablas.sql
3. sql/negocio/01-tablas-negocio.sql             (profesionales extendido)
4. sql/organizacion/02-indices.sql
5. sql/organizacion/03-foreign-keys.sql
6. sql/organizacion/04-funciones.sql
7. sql/organizacion/05-rls-policies.sql
```

## Tablas

### departamentos
Áreas/departamentos con soporte de jerarquía (parent_id).

### puestos
Puestos de trabajo con rango salarial sugerido.

### categorias_profesional
Sistema flexible de categorías por organización:
- **especialidad**: Barbero, Estilista, Masajista
- **nivel**: Junior, Senior, Master
- **area**: Recepción, Servicios
- **certificacion**: Certificado Loreal
- **general**: Cualquier otra

### profesionales_categorias
Relación M:N entre profesionales y categorías.

## Funciones de Jerarquía

```sql
-- Obtener todos los subordinados
SELECT * FROM get_subordinados(5);

-- Verificar si X es jefe de Y
SELECT es_supervisor_de(5, 12);

-- Obtener cadena de supervisores hacia arriba
SELECT * FROM get_cadena_supervisores(12);

-- Árbol de departamentos
SELECT * FROM get_arbol_departamentos(1);

-- Validar que no se cree ciclo
SELECT validar_supervisor_sin_ciclo(5, 12);

-- Contar subordinados
SELECT contar_subordinados(5, true);  -- Solo directos
SELECT contar_subordinados(5, false); -- Todos
```

## Modelo de Control

```
┌─────────────────────────────────────────────────────────────┐
│  profesionales.tipo          → Solo clasificación           │
│  (operativo/administrativo)    (reportes, organigrama)      │
├─────────────────────────────────────────────────────────────┤
│  profesionales.modulos_acceso → ★ CONTROL PRINCIPAL ★       │
│  {agendamiento, pos,            Determina funcionalidades   │
│   inventario}                                               │
├─────────────────────────────────────────────────────────────┤
│  profesionales_categorias    → Especialidad, nivel, etc.    │
│  (M:N)                         Clasificación flexible       │
└─────────────────────────────────────────────────────────────┘
```

## Fecha
Diciembre 2025
