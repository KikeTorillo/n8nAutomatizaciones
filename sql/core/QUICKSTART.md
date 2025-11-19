# 🚀 Quickstart - SaaS Core Limpio

## ✅ Archivos Listos para Usar

Ya tienes el **core SQL limpio** listo. Solo necesitas estos archivos:

```
sql/core/
├── fundamentos/
│   ├── 01-extensiones.sql           ✅ Listo
│   ├── 02-tipos-enums-core.sql      ✅ Listo (SOLO 4 ENUMs universales)
│   └── 03-funciones-utilidad.sql    ✅ Listo
│
└── schema/
    └── 01-tabla-categorias-industria.sql  ✅ Listo
```

---

## 🎯 Para Proyecto NUEVO desde Cero

### **Paso 1: Ejecutar archivos core en orden**

```bash
# En tu DB limpia (sin datos previos)
psql -U admin -d postgres -f sql/core/fundamentos/01-extensiones.sql
psql -U admin -d postgres -f sql/core/fundamentos/02-tipos-enums-core.sql
psql -U admin -d postgres -f sql/core/fundamentos/03-funciones-utilidad.sql
psql -U admin -d postgres -f sql/core/schema/01-tabla-categorias-industria.sql
```

### **Paso 2: (Opcional) Seeds según tu SaaS**

**Si haces SaaS de agendamiento:**
```bash
psql -U admin -d postgres \
  -f templates/scheduling-saas/sql/seeds/categorias-agendamiento.sql
psql -U admin -d postgres \
  -f templates/scheduling-saas/sql/01-enums-dominio.sql
```

**Si haces SaaS de invitaciones:**
```sql
-- Crear tus propias categorías
INSERT INTO categorias_industria (codigo, nombre, sector) VALUES
    ('bodas', 'Bodas', 'events'),
    ('cumpleanos', 'Cumpleaños', 'events'),
    ('baby_shower', 'Baby Shower', 'events');
```

**Si haces otro SaaS:**
```sql
-- Definir categorías según tu dominio
INSERT INTO categorias_industria (codigo, nombre, sector) VALUES
    ('tu_categoria', 'Tu Categoría', 'tu_sector');
```

### **Paso 3: Continuar con tablas de negocio**

Ahora puedes crear tus tablas específicas:
- organizaciones (usando `categoria_industria_id` FK)
- usuarios
- subscripciones
- ... resto de tu dominio

---

## 📋 Comparación: ANTES vs AHORA

### ❌ ANTES (Archivos contaminados)

```bash
# ❌ NO USAR ESTO
sql/fundamentos/02-tipos-enums.sql  
# Contiene:
# - industria_tipo ENUM (específico agendamiento)
# - estado_cita ENUM (específico agendamiento)
# - estado_franja ENUM (específico agendamiento)
# - tipo_profesional ENUM (específico agendamiento)
```

### ✅ AHORA (Core limpio)

```bash
# ✅ USAR ESTO
sql/core/fundamentos/02-tipos-enums-core.sql
# Contiene SOLO:
# - rol_usuario ENUM (universal)
# - plan_tipo ENUM (universal)
# - estado_subscripcion ENUM (universal)
# - plataforma_chatbot ENUM (universal)
```

---

## 🎨 Ejemplos por Tipo de SaaS

### 1️⃣ **SaaS de Invitaciones Online**

```sql
-- Ejecutar core
\i sql/core/fundamentos/01-extensiones.sql
\i sql/core/fundamentos/02-tipos-enums-core.sql
\i sql/core/fundamentos/03-funciones-utilidad.sql
\i sql/core/schema/01-tabla-categorias-industria.sql

-- Agregar categorías de eventos
INSERT INTO categorias_industria (codigo, nombre, sector) VALUES
    ('bodas', 'Bodas', 'events'),
    ('cumpleanos', 'Cumpleaños', 'events'),
    ('baby_shower', 'Baby Shower', 'events'),
    ('graduaciones', 'Graduaciones', 'events');

-- Listo para crear tus tablas:
-- - templates_invitacion
-- - invitaciones
-- - invitados
-- - rsvp
```

### 2️⃣ **SaaS de Ecommerce**

```sql
-- Ejecutar core (mismo que arriba)

-- Agregar categorías de retail
INSERT INTO categorias_industria (codigo, nombre, sector) VALUES
    ('fashion', 'Moda y Ropa', 'retail'),
    ('electronics', 'Electrónicos', 'retail'),
    ('home_decor', 'Hogar y Decoración', 'retail'),
    ('food', 'Alimentos y Bebidas', 'retail');

-- Listo para crear tus tablas:
-- - productos
-- - categorias_producto
-- - ordenes
-- - carrito
```

### 3️⃣ **SaaS de Agendamiento** (tu proyecto actual)

```sql
-- Ejecutar core
\i sql/core/fundamentos/01-extensiones.sql
\i sql/core/fundamentos/02-tipos-enums-core.sql
\i sql/core/fundamentos/03-funciones-utilidad.sql
\i sql/core/schema/01-tabla-categorias-industria.sql

-- Agregar categorías y ENUMs de agendamiento
\i templates/scheduling-saas/sql/seeds/categorias-agendamiento.sql
\i templates/scheduling-saas/sql/01-enums-dominio.sql

-- Continuar con módulos de agendamiento:
-- - sql/negocio/ (profesionales, servicios, clientes)
-- - sql/citas/
-- - sql/bloqueos/
-- etc.
```

---

## 🔧 Próximos Pasos

1. ✅ Ya tienes el core limpio
2. ⏳ Decidir: ¿Qué SaaS vas a construir primero?
   - Agendamiento (ya tienes el template)
   - Invitaciones
   - Otro

3. ⏳ Ejecutar archivos core en DB limpia
4. ⏳ Agregar seeds según tu SaaS
5. ⏳ Crear tablas específicas de tu dominio

---

## 📞 ¿Necesitas Ayuda?

- **Ver estructura completa:** `cat sql/core/README.md`
- **Ver templates disponibles:** `ls templates/`
- **Ver qué incluye cada archivo:** Cada .sql tiene comentarios detallados

---

**¡Listo para desacoplar!** 🚀

Estos archivos ya están listos para copiar a tu SaaS Starter Kit.
