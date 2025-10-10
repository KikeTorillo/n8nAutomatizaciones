# Frontend - SaaS Agendamiento Empresarial

**Versión:** 2.0.0
**Stack:** React 18 + Vite 5 + Tailwind CSS
**Estado:** ✅ Onboarding Flow Completo

---

## 📦 Stack Tecnológico

### Core
- **React 18** - Librería UI
- **Vite 5** - Build tool ultrarrápido
- **React Router v7** - Enrutamiento

### Estado y Data Fetching
- **Zustand** - Estado global ligero con persist
- **React Query** - Cache y sincronización de datos
- **Axios** - Cliente HTTP con interceptors

### UI y Estilos
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos

### Formularios y Validación
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas

### Desarrollo
- **ESLint** - Linter
- **Prettier** - Formateador de código

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor dev en http://localhost:3001

# Build
npm run build            # Genera build de producción
npm run preview          # Preview del build de producción

# Linting y Formateo
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Ejecuta ESLint y auto-fix
npm run format           # Formatea código con Prettier
npm run format:check     # Verifica formato sin cambiar archivos
```

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                                    # Configuración principal
│   │   ├── App.jsx                            # Componente raíz
│   │   ├── router.jsx                         # React Router config
│   │   └── queryClient.js                     # React Query config
│   │
│   ├── pages/                                  # Páginas
│   │   ├── landing/                           # Landing page
│   │   ├── auth/                              # Login
│   │   ├── onboarding/                        # Flujo de registro
│   │   │   ├── OnboardingFlow.jsx            # ✅ Stepper principal
│   │   │   └── steps/                        # ✅ 6 pasos implementados
│   │   │       ├── Step1_BusinessInfo.jsx
│   │   │       ├── Step2_PlanSelection.jsx
│   │   │       ├── Step3_AccountSetup.jsx
│   │   │       ├── Step4_Professionals.jsx
│   │   │       ├── Step5_Services.jsx
│   │   │       └── Step6_WhatsAppIntegration.jsx
│   │   └── dashboard/                         # Dashboard principal
│   │       └── Dashboard.jsx                 # ✅ Implementado
│   │
│   ├── components/                            # Componentes reutilizables
│   │   ├── ui/                               # ✅ Componentes UI base
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   └── index.js
│   │   ├── common/                           # Componentes comunes
│   │   │   └── LoadingSpinner.jsx           # ✅ Implementado
│   │   └── forms/                            # Componentes de formularios
│   │       └── FormField.jsx                # ✅ Implementado
│   │
│   ├── services/                              # ✅ Servicios API
│   │   └── api/
│   │       ├── client.js                     # Axios con interceptors
│   │       └── endpoints.js                  # Todos los endpoints
│   │
│   ├── hooks/                                 # ✅ Custom hooks
│   │   └── useAuth.js
│   │
│   ├── store/                                 # ✅ Zustand stores
│   │   ├── authStore.js                      # Auth + JWT persist
│   │   └── onboardingStore.js                # Onboarding localStorage
│   │
│   └── lib/                                   # ✅ Utilidades
│       ├── utils.js                          # Helpers (cn, formatCurrency, etc.)
│       ├── constants.js                      # Constantes del sistema
│       └── validations.js                    # Schemas Zod
│
├── .env.development                           # Variables de desarrollo
├── vite.config.js                            # Configuración Vite
└── tailwind.config.js                        # Configuración Tailwind
```

---

## 🔧 Configuración

### Variables de Entorno

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# App Configuration
VITE_APP_NAME=SaaS Agendamiento
VITE_APP_VERSION=2.0.0

# Features Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true

# WhatsApp Integration
VITE_WHATSAPP_API_URL=http://localhost:3000/api/v1/whatsapp
```

### Alias de Imports

```javascript
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import useAuthStore from '@/store/authStore';
```

---

## 🎨 Rutas

| Ruta | Componente | Estado | Descripción |
|------|-----------|--------|-------------|
| `/` | `LandingPage` | ✅ | Página principal |
| `/login` | `Login` | ✅ | Inicio de sesión |
| `/onboarding` | `OnboardingFlow` | ✅ | Registro completo (6 pasos) |
| `/dashboard` | `Dashboard` | ✅ | Dashboard principal |

---

## 🔄 Flujo de Onboarding (Implementado)

### Paso 1: Información del Negocio
- Nombre comercial y fiscal
- Industria
- País y ciudad
- Teléfono principal
- **Validación:** Zod schema con React Hook Form

### Paso 2: Selección de Plan
- Fetch de planes desde backend
- Tarjetas interactivas con selección
- Muestra límites y features
- **API:** `GET /api/v1/planes`

### Paso 3: Crear Cuenta (Registro + Auth)
- Email y contraseña (con validación regex)
- Nombre completo
- Checkbox términos y condiciones
- **Flujo:**
  1. Crear organización: `POST /api/v1/organizaciones`
  2. Crear usuario propietario: `POST /api/v1/usuarios`
  3. Guardar JWT en authStore (persist)
  4. Continuar autenticado

### Paso 4: Agregar Profesionales
- Formulario dinámico para múltiples profesionales
- Tipo de profesional y especialidades
- Color de calendario
- Permite walk-in
- **API:** `POST /api/v1/profesionales` (batch)

### Paso 5: Crear Servicios
- Formulario dinámico para múltiples servicios
- Asignación a profesionales
- Duración y precio
- Categorías
- **API:** `POST /api/v1/servicios` (batch)

### Paso 6: Integración WhatsApp
- Muestra QR Code para vincular
- Polling cada 3s para verificar estado
- Detección automática de conexión
- **API:**
  - `GET /api/v1/whatsapp/qr-code`
  - `GET /api/v1/whatsapp/status` (polling)

### Finalización
- Limpia onboardingStore
- Redirección a `/dashboard`
- Usuario autenticado con JWT

---

## 🔐 Autenticación

### Cliente Axios Configurado
```javascript
// Interceptor Request
- Agrega Authorization: Bearer {token} automáticamente
- Agrega X-Organization-Id para super_admin

// Interceptor Response
- Auto-refresh token en 401
- Manejo de errores centralizado
- Redirect a /login si refresh falla
```

### Stores de Zustand

**authStore:**
- State: user, accessToken, refreshToken, isAuthenticated
- Persist en localStorage ('auth-storage')
- Helpers: hasRole(), isAdmin(), getOrganizacionId()

**onboardingStore:**
- State: currentStep, formData (6 pasos), completedSteps
- Persist en localStorage ('onboarding-storage')
- Actions: nextStep(), prevStep(), addProfessional(), etc.
- Helper: getProgress() (%)

---

## 🎯 Componentes UI Implementados

### Button
```jsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```
Variantes: primary, secondary, outline, danger, ghost
Tamaños: sm, md, lg, xl

### Input
```jsx
<Input
  label="Email"
  error={errors.email?.message}
  required
/>
```

### Select
```jsx
<Select
  label="Industria"
  options={INDUSTRIAS}
  placeholder="Selecciona..."
/>
```

### FormField (React Hook Form + Zod)
```jsx
<FormField
  name="email"
  control={control}
  label="Email"
  type="email"
  required
/>
```

### LoadingSpinner
```jsx
<LoadingSpinner size="lg" text="Cargando..." />
```

---

## 📝 Validaciones con Zod

Schemas implementados:
- `businessInfoSchema` - Paso 1
- `planSelectionSchema` - Paso 2
- `accountSetupSchema` - Paso 3 (con password regex)
- `professionalSchema` - Paso 4
- `serviceSchema` - Paso 5
- `loginSchema` - Login

```javascript
import { businessInfoSchema } from '@/lib/validations';

const { control, handleSubmit } = useForm({
  resolver: zodResolver(businessInfoSchema),
});
```

---

## 🚀 Testing del Flujo

### Prerrequisitos
1. Backend corriendo en `http://localhost:3000`
2. Base de datos PostgreSQL con RLS activo
3. Planes de subscripción creados en BD

### Pasos para Testing
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor dev
npm run dev

# 3. Abrir navegador
http://localhost:3001/onboarding

# 4. Completar los 6 pasos:
- Paso 1: Llenar información del negocio
- Paso 2: Seleccionar un plan
- Paso 3: Crear cuenta (email único)
- Paso 4: Agregar al menos 1 profesional
- Paso 5: Agregar al menos 1 servicio
- Paso 6: Escanear QR WhatsApp (opcional)

# 5. Verificar redirección a /dashboard
```

### Verificación en Backend
```bash
# Verificar organización creada
docker exec postgres_db psql -U admin -d postgres \
  -c "SELECT * FROM organizaciones;"

# Verificar usuario propietario
docker exec postgres_db psql -U admin -d postgres \
  -c "SELECT * FROM usuarios WHERE rol = 'propietario';"

# Verificar profesionales
docker exec postgres_db psql -U admin -d postgres \
  -c "SELECT * FROM profesionales;"

# Verificar servicios
docker exec postgres_db psql -U admin -d postgres \
  -c "SELECT * FROM servicios;"
```

---

## 🐛 Troubleshooting

### Error: "Network Error" en requests
**Solución:**
1. Verificar que backend esté corriendo: `docker logs -f back`
2. Verificar CORS en backend
3. Verificar `VITE_API_URL` en `.env.development`

### Error: "Refresh token failed"
**Solución:**
1. Limpiar localStorage: `localStorage.clear()`
2. Recargar página
3. Volver a hacer onboarding

### Error: Plan no aparece en Step 2
**Solución:**
1. Verificar que existan planes en BD:
```sql
SELECT * FROM planes_subscripcion;
```
2. Si no existen, crear planes:
```sql
INSERT INTO planes_subscripcion (nombre, precio_mensual, ...) VALUES (...);
```

### Error: WhatsApp QR no se genera
**Solución:**
1. Verificar que Evolution API esté corriendo
2. Verificar endpoint: `GET http://localhost:3000/api/v1/whatsapp/qr-code`
3. Ver logs de n8n: `docker logs -f n8n`

---

## 📚 Recursos

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Query](https://tanstack.com/query)
- [Zod](https://zod.dev)

---

## 🎉 Estado del Proyecto

**Versión:** 2.0.0
**Estado:** ✅ Onboarding Flow Completo e Integrado con Backend
**Última actualización:** 09 Octubre 2025

### ✅ Completado
- Setup completo de Vite + React + Tailwind
- Cliente Axios con interceptors JWT
- Stores de Zustand (auth + onboarding)
- Schemas de validación con Zod
- Componentes UI base reutilizables
- Flujo completo de onboarding (6 pasos)
- Integración con todos los endpoints del backend
- Dashboard básico
- Manejo de errores centralizado
- Loading states en todos los pasos
- Persistencia de progreso (localStorage)

### 🔄 Próximos Pasos
- [ ] Implementar página de Login funcional
- [ ] Proteger rutas con guards de autenticación
- [ ] Agregar página de Configuración
- [ ] Implementar módulo de Citas
- [ ] Agregar módulo de Clientes
- [ ] Dashboard con gráficas y métricas
- [ ] Tests unitarios (Vitest + Testing Library)
- [ ] Tests E2E (Playwright)

---

**Mantenido por:** Equipo de Desarrollo
