# PLAN DE REFINAMIENTO: MODELO DE NEGOCIO

**Fecha:** 24 Noviembre 2025
**Versión:** 2.0
**Estado:** En Planificación

---

## 1. ANÁLISIS COMPETITIVO: ODOO

### 1.1 Modelo de Precios Odoo 2025

| Plan | Precio | Características |
|------|--------|-----------------|
| **One App Free** | $0 | **1 app a elegir**, usuarios ilimitados, para siempre |
| **Standard** | €19.90-$24.90/usuario/mes | TODAS las apps incluidas |
| **Custom** | €29.90-$37.40/usuario/mes | Todo + Studio, API, on-premise |

### 1.2 Fortalezas del Modelo Odoo

1. **Libertad de elección** - Usuario elige qué app necesita
2. **Escalabilidad clara** - Pagas por usuarios cuando necesitas más apps
3. **Free tier muy atractivo** - 1 app completa gratis, sin límites funcionales
4. **Sin sorpresas** - El cliente sabe exactamente cuánto pagará
5. **Upsell natural** - Necesitas otra app = upgrade a Pro

### 1.3 Apps de Odoo (Referencia)

Odoo tiene 40+ apps: CRM, Ventas, Inventario, Facturación, Compras, Fabricación,
Sitio Web, eCommerce, POS, Proyectos, Contabilidad, RRHH, Marketing, etc.

**Clave:** Cada app es independiente y funcional por sí sola.

---

## 2. NUESTRAS APPS DISPONIBLES

### 2.1 Catálogo de Apps

| App | Descripción | Casos de Uso |
|-----|-------------|--------------|
| **Agendamiento** | Citas, profesionales, horarios, calendario | Barberías, salones, clínicas, spas |
| **Inventario** | Productos, stock, proveedores, movimientos | Tiendas, almacenes, distribuidoras |
| **POS** | Punto de venta, caja, tickets, cobros | Comercios, restaurantes, cafés |
| **Marketplace** | Perfil público, reseñas, SEO, presencia online | Cualquier negocio que quiera visibilidad |
| **Comisiones** | Cálculo automático, reportes, pagos empleados | Negocios con equipos de trabajo |
| **Chatbots IA** | Telegram, WhatsApp, agendamiento automático | Automatización de atención al cliente |

### 2.2 Dependencias entre Apps

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE APPS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   CORE (invisible)                   │   │
│   │  Organizaciones, Usuarios, Auth, Configuración       │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│           ┌───────────────┼───────────────┐                  │
│           ▼               ▼               ▼                  │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│   │Agendamiento│   │ Inventario│   │    POS    │             │
│   │ (standalone)│   │(standalone)│   │(standalone)│             │
│   └─────┬─────┘   └───────────┘   └───────────┘             │
│         │                                                    │
│   ┌─────┴─────────────────────────────────────┐             │
│   │        Apps que REQUIEREN Agendamiento:    │             │
│   │  • Comisiones (calcula sobre citas)        │             │
│   │  • Chatbots IA (agenda citas por chat)     │             │
│   │  • Marketplace (perfil + agendamiento)     │             │
│   └───────────────────────────────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

LEYENDA:
• Standalone = Funciona solo, sin dependencias
• Core = Siempre incluido (invisible para el usuario)
```

---

## 3. MODELO ACTUAL vs PROPUESTO

### 3.1 Modelo Actual (Complejo)

```
┌─────────────────────────────────────────────────────────────┐
│                    PLANES ACTUALES                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Plan Básico   │  Plan Profesional │    Plan Custom       │
│   $299 MXN/mes  │   $599 MXN/mes    │   Contactar          │
├─────────────────┼─────────────────┼─────────────────────────┤
│ 5 profesionales │ 15 profesionales │ Ilimitado            │
│ 15 servicios    │ 50 servicios     │ Ilimitado            │
│ 200 citas/mes   │ 800 citas/mes    │ Ilimitado            │
│ 3 usuarios      │ 8 usuarios       │ Ilimitado            │
├─────────────────┴─────────────────┴─────────────────────────┤
│ + MÓDULOS OPCIONALES (costo adicional):                     │
│   • Inventario: +$199 MXN/mes                               │
│   • POS: +$149 MXN/mes                                      │
│   • Comisiones: +$99 MXN/mes                                │
│   • Marketplace: +$199 MXN/mes                              │
│   • Chatbots IA: +$199 MXN/mes                              │
└─────────────────────────────────────────────────────────────┘

PROBLEMAS:
❌ Agendamiento forzado (no todos lo necesitan)
❌ Confuso para el cliente (muchas decisiones)
❌ Fricción en el upsell (cada módulo es una negociación)
❌ Límites artificiales generan frustración
❌ Difícil de comunicar en marketing
```

### 3.2 Modelo Propuesto (Estilo Odoo - 1 App a Elegir)

```
┌─────────────────────────────────────────────────────────────┐
│                    NUEVO MODELO                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 PLAN FREE (1 App)                    │   │
│   │                      $0                              │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ ✓ ELIGE 1 APP:                                      │   │
│   │   □ Agendamiento                                    │   │
│   │   □ Inventario                                      │   │
│   │   □ POS                                             │   │
│   │                                                     │   │
│   │ ✓ Usuarios ilimitados                               │   │
│   │ ✓ Para siempre (no trial)                           │   │
│   │ ✓ App completamente funcional                       │   │
│   └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    PLAN PRO                          │   │
│   │            $249 MXN/usuario/mes                      │   │
│   │           (~$15 USD/usuario/mes)                     │   │
│   ├─────────────────────────────────────────────────────┤   │
│   │ ✓ TODAS las apps incluidas                          │   │
│   │ ✓ Agendamiento + Inventario + POS                   │   │
│   │ ✓ Marketplace + Comisiones + Chatbots IA            │   │
│   │ ✓ Sin límites de nada                               │   │
│   │ ✓ Soporte prioritario                               │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   NOTA: "Usuario" = persona que inicia sesión               │
│         (no clientes finales, no profesionales)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

VENTAJAS:
✅ Usuario elige lo que necesita (no forzamos Agendamiento)
✅ Free tier generoso (1 app completa, usuarios ilimitados)
✅ Upsell cuando necesitan 2+ apps
✅ Marketing simple: "1 App Gratis, Todo por $249/usuario"
✅ Ampliamos mercado (tiendas, restaurantes, etc.)
```

---

## 4. COMPARATIVA DE INGRESOS

### Escenario A: Barbería (solo Agendamiento)

| Concepto | Modelo Actual | Modelo Propuesto |
|----------|---------------|------------------|
| Plan base | $299 (Básico) | $0 (Free - 1 App) |
| **TOTAL** | **$299 MXN/mes** | **$0** |

**Nota:** Si solo necesita Agendamiento, usa Plan Free. Upsell cuando necesite Comisiones o Chatbots.

### Escenario B: Barbería que quiere Comisiones (2+ apps)

| Concepto | Modelo Actual | Modelo Propuesto |
|----------|---------------|------------------|
| Plan base | $299 (Básico) | $249 (1 usuario Pro) |
| Comisiones | +$99 | $0 (incluido) |
| **TOTAL** | **$398 MXN/mes** | **$249 MXN/mes** |

### Escenario C: Tienda (solo Inventario + POS)

| Concepto | Modelo Actual | Modelo Propuesto |
|----------|---------------|------------------|
| Plan base | $299 (Básico) - pero incluye Agendamiento que NO necesitan | $249 (1 usuario Pro) |
| Inventario | +$199 | $0 (incluido) |
| POS | +$149 | $0 (incluido) |
| **TOTAL** | **$647 MXN/mes** | **$249 MXN/mes** |

**Nota:** Ahora podemos captar tiendas que antes no nos consideraban.

### Escenario D: Clínica grande (10 usuarios, todo)

| Concepto | Modelo Actual | Modelo Propuesto |
|----------|---------------|------------------|
| Plan base | $599 + custom | $2,490 (10 × $249) |
| Módulos | ~$500+ | $0 (incluido) |
| **TOTAL** | **~$1,100+ MXN/mes** | **$2,490 MXN/mes** |

**Conclusión:**
- Free tier genera leads de calidad (usan el producto real)
- Negocios pequeños pagan menos = menor churn
- Clientes grandes pagan más = mayor revenue
- Ampliamos TAM (Total Addressable Market) a tiendas, restaurantes, etc.

---

## 5. IMPLEMENTACIÓN TÉCNICA

### 5.1 Cambios en Base de Datos

```sql
-- PASO 1: Agregar campo para app seleccionada en plan free
ALTER TABLE organizaciones
  ADD COLUMN app_seleccionada VARCHAR(50); -- 'agendamiento', 'inventario', 'pos'

-- PASO 2: Simplificar planes
-- Mantener límites pero solo para Plan Free
-- Plan Pro = sin límites (NULL = ilimitado)

UPDATE planes_subscripcion
SET nombre = 'Free',
    codigo = 'free',
    descripcion = '1 App gratis a elegir',
    limite_usuarios = NULL -- ilimitado en Free
WHERE codigo = 'trial';

UPDATE planes_subscripcion
SET nombre = 'Pro',
    codigo = 'pro',
    descripcion = 'Todas las apps incluidas',
    limite_profesionales = NULL,
    limite_servicios = NULL,
    limite_citas_mes = NULL,
    limite_clientes = NULL,
    limite_usuarios = NULL
WHERE codigo IN ('basico', 'profesional');

-- PASO 3: Nueva columna para precio por usuario
ALTER TABLE planes_subscripcion
  ADD COLUMN precio_por_usuario DECIMAL(10,2) DEFAULT NULL;

UPDATE planes_subscripcion SET precio_por_usuario = 249 WHERE codigo = 'pro';

-- PASO 4: Nueva tabla para tracking de usuarios facturables
CREATE TABLE usuarios_facturables (
  id SERIAL PRIMARY KEY,
  organizacion_id INTEGER REFERENCES organizaciones(id),
  mes_facturacion DATE NOT NULL,
  cantidad_usuarios INTEGER NOT NULL,
  monto_calculado DECIMAL(10,2),
  creado_en TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Cambios en Backend

| Archivo | Cambio |
|---------|--------|
| `middleware/subscription.js` | Verificar acceso a app según plan (Free = 1 app, Pro = todas) |
| `models/organizacion.model.js` | Agregar `app_seleccionada` al crear |
| `controllers/organizacion.controller.js` | Recibir `app_seleccionada` en onboarding |
| `routes/` | Nuevo middleware: `verificarAccesoApp(appRequerida)` |

### 5.3 Nuevo Middleware: Verificar Acceso a App

```javascript
// middleware/appAccess.js
const verificarAccesoApp = (appRequerida) => {
  return async (req, res, next) => {
    const { plan, app_seleccionada, modulos_activos } = req.tenant;

    // Plan Pro tiene acceso a todo
    if (plan === 'pro') return next();

    // Plan Free: verificar si es la app seleccionada
    if (plan === 'free') {
      if (app_seleccionada === appRequerida) return next();

      return res.status(403).json({
        error: `Tu plan Free solo incluye ${app_seleccionada}. Upgrade a Pro para acceder a ${appRequerida}.`
      });
    }

    next();
  };
};
```

### 5.4 Cambios en Frontend

| Componente | Cambio |
|------------|--------|
| `Step2_PlanSelection.jsx` | Plan Free: selector de 1 app. Plan Pro: todas incluidas |
| `Step3_ModulosSelection.jsx` | **ELIMINAR** (la selección se hace en Step2) |
| `Sidebar.jsx` | Mostrar solo menús de apps activas |
| `Dashboard.jsx` | Banner "Upgrade a Pro" si intentan acceder a app no incluida |

### 5.5 Flujo de Onboarding Nuevo

```
┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING (3 pasos)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PASO 1: Info Negocio                                        │
│  ─────────────────────                                       │
│  • Nombre comercial                                          │
│  • Teléfono                                                  │
│  • (Ya no preguntamos categoría/industria - lo inferimos)    │
│                                                              │
│  PASO 2: Elige tu Plan                                       │
│  ─────────────────────                                       │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │    PLAN FREE    │  │    PLAN PRO     │                   │
│  │      $0         │  │ $249/usuario/mes│                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ Elige 1 App:    │  │ Todo incluido:  │                   │
│  │ ○ Agendamiento  │  │ ✓ Agendamiento  │                   │
│  │ ○ Inventario    │  │ ✓ Inventario    │                   │
│  │ ○ POS           │  │ ✓ POS           │                   │
│  │                 │  │ ✓ Marketplace   │                   │
│  │                 │  │ ✓ Comisiones    │                   │
│  │                 │  │ ✓ Chatbots IA   │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                              │
│  PASO 3: Crear Cuenta                                        │
│  ────────────────────                                        │
│  • Nombre, Email, Contraseña                                 │
│  • Términos y condiciones                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. FASES DE MIGRACIÓN

### Fase 1: Backend - Estructura Base
- [ ] Agregar columna `app_seleccionada` a `organizaciones`
- [ ] Crear planes 'free' y 'pro' en `planes_subscripcion`
- [ ] Implementar middleware `verificarAccesoApp`
- [ ] Actualizar `organizacion.controller.js` para recibir `app_seleccionada`

### Fase 2: Frontend - Onboarding
- [ ] Rediseñar `Step2_PlanSelection.jsx` con selector de apps
- [ ] **ELIMINAR** `Step3_ModulosSelection.jsx`
- [ ] Actualizar `OnboardingFlow.jsx` (volver a 3 pasos)
- [ ] Actualizar `onboardingStore.js`

### Fase 3: Frontend - Dashboard y Navegación
- [ ] Modificar `Sidebar.jsx` para mostrar solo apps activas
- [ ] Agregar banner "Upgrade a Pro" en páginas bloqueadas
- [ ] Crear página de "Gestionar Plan" para upgrade

### Fase 4: Migración de Clientes Existentes
- [ ] Script para migrar clientes actuales:
  - Básico/Profesional → Pro (mantener acceso actual)
  - Trial → Free + app_seleccionada = 'agendamiento'
- [ ] Comunicar cambios por email

### Fase 5: Marketing y Landing
- [ ] Actualizar landing page con nuevo modelo
- [ ] Nuevo copy: "1 App Gratis - Todo por $249/usuario"
- [ ] Crear comparativa de apps

---

## 7. DECISIONES YA TOMADAS

| Decisión | Valor | Justificación |
|----------|-------|---------------|
| Modelo de pricing | Estilo Odoo (1 app free) | Simplicidad + amplia mercado |
| Apps standalone | Agendamiento, Inventario, POS | Cada una funciona sola |
| Apps dependientes | Comisiones, Chatbots, Marketplace | Requieren Agendamiento |
| Plan Free | 1 app a elegir, usuarios ilimitados | Competir con Odoo |
| Plan Pro | Todas las apps, $249/usuario/mes | ~$15 USD, bajo vs Odoo $24 |

---

## 8. DECISIONES PENDIENTES

### 8.1 Límites del Plan Free (por app)

**Agendamiento Free:**
| Recurso | Opción A (Generoso) | Opción B (Conservador) |
|---------|---------------------|------------------------|
| Usuarios | Ilimitados | Ilimitados |
| Profesionales | Sin límite | 3 |
| Citas/mes | Sin límite | 100 |
| Clientes | Sin límite | 200 |

**Inventario Free:**
| Recurso | Opción A | Opción B |
|---------|----------|----------|
| Productos | Sin límite | 100 |
| Proveedores | Sin límite | 10 |

**POS Free:**
| Recurso | Opción A | Opción B |
|---------|----------|----------|
| Ventas/mes | Sin límite | 200 |

**Recomendación:** Opción A (Generoso) - Como Odoo, sin límites funcionales.
El upsell es por necesitar MÁS APPS, no por límites artificiales.

### 8.2 Apps adicionales en Free

¿Permitir desbloquear apps individuales sin ir a Pro?

| Opción | Precio | Pros | Cons |
|--------|--------|------|------|
| A: Solo Free o Pro | N/A | Simple | Algunos podrían querer solo 2 apps |
| B: +$99/app adicional | $99/mes | Flexibilidad | Más complejo |

**Recomendación:** Opción A - Mantener simplicidad. Free (1 app) o Pro (todo).

---

## 9. MÉTRICAS DE ÉXITO

- **Signups Free:** Target +50% vs modelo actual
- **Conversión Free → Pro:** Target 10-15%
- **Time to first value:** <5 minutos (solo 3 pasos)
- **Churn Pro:** <5% mensual
- **NPS:** >50
- **Nuevos segmentos:** Tiendas, restaurantes (sin agendamiento)

---

## 10. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Free tier canibaliza Pro | Media | Alto | Monitorear conversiones; ajustar si <5% |
| Clientes confundidos con cambio | Baja | Medio | Email explicativo + grandfather 3 meses |
| Tiendas/restaurantes no convierten | Media | Bajo | Experimentar con marketing específico |
| Competencia copia modelo | Baja | Bajo | Ejecutar rápido, mejorar producto |

---

## RESUMEN EJECUTIVO

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMBIO DE MODELO                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ANTES:                                                      │
│  • Agendamiento obligatorio                                  │
│  • 3 planes + módulos opcionales                             │
│  • Límites artificiales frustrantes                          │
│  • Solo barberías/salones/clínicas                           │
│                                                              │
│  DESPUÉS:                                                    │
│  • Usuario elige su app                                      │
│  • 2 planes: Free (1 app) o Pro (todo)                       │
│  • Sin límites en funcionalidad                              │
│  • Tiendas, restaurantes, cualquier negocio                  │
│                                                              │
│  BENEFICIOS:                                                 │
│  ✅ Más signups (free tier atractivo)                        │
│  ✅ Más mercado (no solo agendamiento)                       │
│  ✅ Más revenue (clientes grandes pagan más)                 │
│  ✅ Menos churn (sin frustraciones de límites)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Última actualización:** 24 Noviembre 2025
**Versión:** 2.0
