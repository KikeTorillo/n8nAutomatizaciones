# 🎯 SaaS Starter Kit - SQL Core

## 📋 Descripción

Este directorio contiene el **schema SQL core** universal para cualquier SaaS multi-tenant.

**Fecha de refactor:** 18 Noviembre 2025  
**Versión:** 2.0 (Limpieza para desacople)

---

## ✅ ¿Qué incluye este CORE?

### **1. Fundamentos (`fundamentos/`)**

- **`01-extensiones.sql`** - Extensiones PostgreSQL (pgcrypto, pg_trgm, btree_gin)
- **`02-tipos-enums-core.sql`** - ✅ **SOLO ENUMs universales**:
  - `rol_usuario` (6 roles: super_admin, admin, propietario, empleado, cliente, bot)
  - `plan_tipo` (4 planes: trial, basico, profesional, custom)
  - `estado_subscripcion` (5 estados: activa, suspendida, cancelada, trial, morosa)
  - `plataforma_chatbot` (7 plataformas: telegram, whatsapp, messenger, etc.)

### **2. Schema Core (`schema/`)**

- **`01-tabla-categorias-industria.sql`** - Tabla dinámica para categorías/industrias
  - Reemplaza ENUM `industria_tipo` (hardcodeado)
  - Permite cualquier SaaS definir sus categorías
  - ⚠️ **SOLO estructura** (sin datos iniciales)
  - Los datos se insertan mediante seeds en templates/

---

## ❌ ¿Qué NO está en el CORE?

### **ENUMs de Dominio (movidos a templates/)**

- ❌ `industria_tipo` → Tabla `categorias_industria` (dinámica)
- ❌ `estado_cita` → `templates/scheduling-saas/sql/01-enums-dominio.sql`
- ❌ `estado_franja` → `templates/scheduling-saas/sql/01-enums-dominio.sql`
- ❌ `tipo_profesional` → Tabla dinámica en templates

### **Módulos de Dominio**

Ver carpeta `templates/scheduling-saas/sql/` para:
- Catálogos (tipos_profesional, tipos_bloqueo)
- Negocio (profesionales, servicios, clientes)
- Citas, Bloqueos, Comisiones, Marketplace

---

## 🚀 Implementación

### **Opción A: Proyecto NUEVO (Sin datos existentes)**

```bash
# 1. Crear DB
psql -U postgres -c "CREATE DATABASE mi_saas_db;"

# 2. Ejecutar core (SOLO estructura, sin datos)
psql -U postgres -d mi_saas_db -f sql/core/fundamentos/01-extensiones.sql
psql -U postgres -d mi_saas_db -f sql/core/fundamentos/02-tipos-enums-core.sql
psql -U postgres -d mi_saas_db -f sql/core/schema/01-tabla-categorias-industria.sql

# 3. Ejecutar template según tu tipo de SaaS
# Para SaaS de AGENDAMIENTO:
psql -U postgres -d mi_saas_db \
  -f sql/templates/scheduling-saas/seeds/categorias-agendamiento.sql

# Para SaaS de INVITACIONES:
# psql -U postgres -d mi_saas_db \
#   -f sql/templates/invitations-saas/seeds/categorias-invitaciones.sql

# 4. Continuar con resto de tablas core
#    (organizaciones, usuarios, subscripciones, etc.)
```

### **Opción B: Migración desde ENUM industria_tipo**

```bash
# ⚠️ HACER BACKUP PRIMERO
pg_dump mi_saas_db > backup_antes_migracion.sql

# 1. Ejecutar nueva tabla
psql -U postgres -d mi_saas_db -f sql/core/schema/01-tabla-categorias-industria.sql

# 2. Agregar categorías de agendamiento
psql -U postgres -d mi_saas_db \
  -f templates/scheduling-saas/sql/seeds/categorias-agendamiento.sql

# 3. Migrar datos existentes
psql -U postgres -d mi_saas_db \
  -f templates/scheduling-saas/sql/migrate-industria-tipo.sql

# 4. Validar (ver output del script)
# 5. Descomentar pasos 4-6 del script de migración
```

---

## 📁 Estructura de Archivos

```
sql/core/
├── fundamentos/
│   ├── 01-extensiones.sql           # Extensiones PostgreSQL
│   └── 02-tipos-enums-core.sql      # ✅ SOLO ENUMs universales
│
├── schema/
│   ├── 01-tabla-categorias-industria.sql  # Tabla dinámica categorías
│   ├── 02-tabla-organizaciones.sql        # (pendiente)
│   ├── 03-tabla-usuarios.sql              # (pendiente)
│   └── ...                                # Resto de tablas core
│
└── README.md                         # Este archivo

templates/scheduling-saas/sql/
├── 01-enums-dominio.sql             # ENUMs específicos agendamiento
├── seeds/
│   └── categorias-agendamiento.sql  # 11 categorías de agendamiento
└── migrate-industria-tipo.sql       # Script de migración
```

---

## 🔄 Cambios vs Versión Anterior

| Componente | Versión Anterior | Versión 2.0 (19 Nov 2025) |
|------------|------------------|---------------------------|
| **industria_tipo** | ENUM con 11 valores | Tabla `categorias_industria` (sin datos) |
| **Datos categorías** | 7 genéricas en core | 0 en core, seeds en templates/ |
| **estado_cita** | En fundamentos/ | En templates/scheduling-saas/ |
| **estado_franja** | En fundamentos/ | En templates/scheduling-saas/ |
| **tipo_profesional** | ENUM 33 valores | Tabla (ya existía en catálogos/) |
| **Ubicación ENUMs** | Mezclados | Separados core vs dominio |
| **Reutilizabilidad** | Limitada (datos hardcoded) | Alta (estructura universal) |

---

## 💡 Ejemplos de Uso

### **SaaS de Invitaciones (Nuevo proyecto)**

```sql
-- 1. Crear seed: sql/templates/invitations-saas/seeds/categorias-invitaciones.sql
INSERT INTO categorias_industria (codigo, nombre, sector, descripcion, icono, orden) VALUES
    ('bodas', 'Bodas', 'events', 'Invitaciones para bodas', 'heart', 1),
    ('cumpleanos', 'Cumpleaños', 'events', 'Invitaciones para cumpleaños', 'cake', 2),
    ('baby_shower', 'Baby Shower', 'events', 'Baby showers', 'baby', 3);

-- 2. Ejecutar seed después del core

-- 3. Crear organización (IDs ahora son 1-3)
INSERT INTO organizaciones (
    nombre_comercial,
    categoria_industria_id,
    ...
) VALUES (
    'Invitaciones Elegantes',
    1,  -- bodas (primer registro)
    ...
);
```

### **SaaS de E-commerce**

```sql
-- 1. Crear seed: sql/templates/ecommerce-saas/seeds/categorias-ecommerce.sql
INSERT INTO categorias_industria (codigo, nombre, sector, descripcion, orden) VALUES
    ('fashion', 'Moda y Ropa', 'retail', 'Tiendas de moda', 1),
    ('electronics', 'Electrónicos', 'retail', 'Tiendas de tecnología', 2);

-- 2. Ejecutar seed después del core
```

---

## 📝 Checklist de Implementación

### **Antes de Migrar**

- [ ] Backup completo de la base de datos
- [ ] Listar referencias a `industria_tipo` en código:
  ```bash
  grep -r "industria_tipo" backend/app sql/ frontend/src
  ```
- [ ] Crear branch de refactor: `git checkout -b refactor/sql-core-limpio`

### **Durante la Migración**

- [ ] Ejecutar tabla `categorias_industria`
- [ ] Ejecutar seeds correspondientes
- [ ] Ejecutar script de migración
- [ ] Validar datos migrados (ver output del script)
- [ ] Actualizar código backend/frontend para usar `categoria_industria_id`

### **Después de Migrar**

- [ ] Ejecutar tests completos
- [ ] Validar onboarding funciona
- [ ] Validar creación de organizaciones
- [ ] Documentar cambios en CHANGELOG.md
- [ ] Commit: `git commit -m "refactor(sql): Migrar industria_tipo a tabla dinámica"`

---

## 🆘 Soporte

**Dudas o problemas:** Ver `sql/core/TROUBLESHOOTING.md` (pendiente)

**Rollback:** Ver paso "ROLLBACK" en `migrate-industria-tipo.sql`

---

**Última actualización:** 18 Noviembre 2025  
**Mantenedor:** Equipo SaaS Starter Kit
