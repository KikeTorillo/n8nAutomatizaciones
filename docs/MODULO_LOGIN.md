# Módulo de Autenticación

Sistema de login multi-método para Nexo ERP.

---

## Resumen

| Aspecto | Valor |
|---------|-------|
| **Métodos de login** | Email+Password, Google OAuth, Magic Links |
| **Tokens** | JWT (access 1h, refresh 7d) con issuer validado |
| **Blacklist** | Redis DB 3 (fail-closed) |
| **Rate Limiting** | Por IP + Por Email (5/hora/destinatario) |
| **Auditoría** | ✅ 10/10 - Producción Ready (Feb 2026) |
| **Desacoplamiento** | ~70% reutilizable, 30% específico de negocio |

---

## Estado de Auditoría (Feb 2026)

| Área | Estado | Evidencia |
|------|--------|-----------|
| SQL Injection Prevention | ✅ 100% | Queries parametrizadas + MAKE_INTERVAL |
| JWT con Issuer | ✅ | Generación y verificación validadas |
| Token Blacklist Fail-Closed | ✅ | Redis falla → 503 (rechaza request) |
| Rate Limiting Email | ✅ | 5 emails/hora/destinatario |
| asyncHandler | ✅ | 21/21 métodos en controller |
| AccessToken en memoria | ✅ | No localStorage, solo variable JS |
| RefreshToken httpOnly | ✅ | Cookie segura |
| Dark Mode | ✅ | 100% páginas de auth |
| Validación Zod | ✅ | Todos los formularios |

### Problemas Menores (Backlog)

| Issue | Archivo | Prioridad |
|-------|---------|-----------|
| Bcrypt salt hardcoded `12` | auth.controller.js:362 | Baja |
| 8x console.error legacy | archivos relacionados | Baja |

---

## Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                         auth.js (Router Principal)              │
│  ├── /login, /logout, /refresh, /me, /profile                  │
│  ├── auth-onboarding.js → /registrar, /activar, /onboarding/*  │
│  ├── auth-oauth.js → /oauth/google                              │
│  └── auth-recovery.js → /reset-password, /magic-link           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    auth.controller.js                           │
│  Orquesta flujos, delega a servicios/modelos                   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  auth.model.js  │  │  jwtService.js  │  │ onboardingServ. │
│  - autenticar   │  │  - generatePair │  │ - completar     │
│  - cambiarPass  │  │  - verify       │  │ - crearOrg      │
│  - resetPass    │  │  - decode       │  └─────────────────┘
│  - verificarMail│  └─────────────────┘
└─────────────────┘
```

---

## Evaluación de Reutilización

### ¿Se puede reutilizar en otro proyecto?

**Respuesta corta**: Parcialmente. ~70% del código es reutilizable directamente, 30% está acoplado a la lógica de negocio de Nexo.

### Componentes 100% Reutilizables

| Componente | Dependencias | Notas |
|------------|--------------|-------|
| `jwtService.js` | jwt, crypto, logger | ✅ Plug & play |
| `tokenBlacklistService.js` | Redis | ✅ Solo configurar Redis |
| `rateLimiting.js` | express-rate-limit, Redis | ✅ Middlewares genéricos |
| `passwordHelper.js` | - | ✅ Evaluación de fortaleza |
| Schemas Joi/Zod | - | ✅ Adaptar campos |
| Cookie config | - | ✅ Copiar constantes |

### Componentes Adaptables (~70% reutilizable)

| Componente | Qué adaptar |
|------------|-------------|
| `auth.model.js` | Reemplazar RLSContextManager por tu sistema de DB |
| `auth.controller.js` | Eliminar/adaptar onboarding, cambio de sucursal |
| Middleware `auth.js` | Adaptar payload JWT a tu estructura de usuario |

### Componentes Específicos de Nexo (❌ No reutilizables directamente)

| Componente | Por qué |
|------------|---------|
| `OnboardingService` | Crea organizaciones, profesionales, planes trial |
| `ActivacionModel` | Lógica de industrias, categorías, módulos |
| `usuario.model.js` | Estructura multi-tenant con RLS |
| `dogfoodingSubscriber` | Vinculación a Nexo Team |

### Checklist para Migración

```markdown
## Para reutilizar en otro proyecto:

1. [ ] Copiar servicios genéricos:
   - jwtService.js
   - tokenBlacklistService.js
   - passwordHelper.js
   - rateLimiting.js (middlewares)

2. [ ] Adaptar auth.model.js:
   - Reemplazar RLSContextManager.query() por tu pool.query()
   - Adaptar tabla usuarios a tu schema
   - Eliminar campos específicos (organizacion_id, sucursal_id)

3. [ ] Simplificar auth.controller.js:
   - Eliminar OnboardingService si no aplica
   - Eliminar cambiarSucursal si es single-tenant
   - Adaptar payload de JWT a tus necesidades

4. [ ] Configurar Redis:
   - DB para rate limiting
   - DB para token blacklist

5. [ ] Adaptar schemas de validación:
   - Joi (backend) o Zod (frontend)
   - Campos de tu modelo de usuario
```

### Diagrama de Dependencias

```
                    ┌──────────────────────────┐
                    │    GENÉRICO (Copiar)     │
                    ├──────────────────────────┤
                    │ • jwtService.js          │
                    │ • tokenBlacklistService  │
                    │ • passwordHelper.js      │
                    │ • rateLimiting.js        │
                    │ • REFRESH_TOKEN_COOKIE   │
                    └──────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────┐
                    │   ADAPTABLE (Modificar)  │
                    ├──────────────────────────┤
                    │ • auth.model.js          │◄── Cambiar DB layer
                    │ • auth.controller.js     │◄── Eliminar Nexo-specific
                    │ • middleware/auth.js     │◄── Adaptar JWT payload
                    └──────────────────────────┘
                              │
                              ▼
                    ┌──────────────────────────┐
                    │  NEXO-SPECIFIC (Ignorar) │
                    ├──────────────────────────┤
                    │ • OnboardingService      │
                    │ • ActivacionModel        │
                    │ • dogfoodingSubscriber   │
                    │ • RLSContextManager      │
                    └──────────────────────────┘
```

---

## Servicios Desacoplados

### JwtService

Servicio stateless para manejo de JWT. **100% Reutilizable**.

```javascript
// Generar par de tokens
const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(usuario);

// Verificar access token (incluye validación de issuer)
const decoded = JwtService.verifyAccessToken(token);

// Verificar refresh token
const decoded = JwtService.verifyRefreshToken(refreshToken);

// Segundos hasta expiración (útil para blacklist)
const ttl = JwtService.getSecondsUntilExpiry(token);

// Extraer de header Authorization
const token = JwtService.extractFromHeader(req.headers.authorization);
```

**Payload del Access Token:**
```javascript
{
  userId: number,
  email: string,
  rolId: number,
  organizacionId: number | null,  // Eliminar si single-tenant
  sucursalId: number | null,       // Eliminar si single-tenant
  jti: string  // ID único para blacklist
}
```

### AuthModel

Lógica pura de autenticación, separada de gestión de usuarios.

```javascript
// Login
const resultado = await AuthModel.autenticar(email, password, ipAddress);
// → { usuario, accessToken, refreshToken, expiresIn, requiere_onboarding }

// Refresh token
const { accessToken, expiresIn } = await AuthModel.refrescarToken(refreshToken);

// Cambio de password (autenticado)
await AuthModel.cambiarPassword(userId, passwordAnterior, passwordNueva);

// Reset password (flujo completo)
await AuthModel.solicitarResetPassword(email, ipAddress);
const validacion = await AuthModel.validarTokenReset(token);
await AuthModel.confirmarResetPassword(token, passwordNueva, ipAddress);

// Verificar email
await AuthModel.verificarEmail(token);
```

### OnboardingService

Maneja creación de organizaciones post-registro. **Específico de Nexo**.

```javascript
// Completar onboarding (crea org, asigna rol, emite eventos)
const resultado = await OnboardingService.completar(userId, {
  nombre_negocio: 'Mi Empresa',
  industria: 'servicios',
  estado_id: 1,
  ciudad_id: 5,
  soy_profesional: true,
  modulos: { agendamiento: true, pos: true }
});

// El servicio emite evento para dogfooding
authEvents.emitOrganizacionCreada(organizacion, usuario);
```

---

## Flujos de Autenticación

### 1. Login Email + Password

```
POST /api/v1/auth/login
  ↓
AuthModel.autenticar(email, password, ip)
  ├─ Buscar usuario con datos de auth
  ├─ Verificar bloqueo por intentos fallidos
  ├─ Comparar password (bcrypt)
  ├─ Registrar intento (éxito/fallo)
  └─ Generar tokens JWT
  ↓
Response: { usuario, accessToken, expiresIn, requiere_onboarding }
Cookie: refreshToken (httpOnly, secure, sameSite)
```

### 2. Google OAuth

```
POST /api/v1/auth/oauth/google { credential }
  ↓
GoogleOAuthService.verifyToken(credential)
  ↓
¿Usuario existe por google_id?
  ├─ SÍ → Login directo
  └─ NO → ¿Usuario existe por email?
           ├─ SÍ → Vincular Google a cuenta existente
           └─ NO → Crear usuario nuevo (requiere onboarding)
  ↓
Response: { usuario, accessToken, es_nuevo, requiere_onboarding }
```

### 3. Magic Links

```
POST /api/v1/auth/magic-link { email }
  ↓
[Rate Limit: heavy + email (5/hora)]
  ↓
ActivacionModel.crearMagicLink({ email })
  ↓
emailService.enviarMagicLink()
  ↓
GET /api/v1/auth/magic-link/verify/:token
  ↓
ActivacionModel.verificarMagicLink(token)
  ↓
Response: { usuario, accessToken, requiere_onboarding }
```

### 4. Registro + Activación

```
POST /api/v1/auth/registrar { nombre, email }
  ↓
[Rate Limit: heavy + email (5/hora)]
  ↓
ActivacionModel.crear() → Token de activación
  ↓
emailService.enviarActivacionCuenta()
  ↓
GET /api/v1/auth/activar/:token → Validar token
  ↓
POST /api/v1/auth/activar/:token { password }
  ↓
ActivacionModel.activar() → Crear usuario
  ↓
Response: { usuario, accessToken, requiere_onboarding: true }
```

### 5. Onboarding (post-registro)

```
POST /api/v1/auth/onboarding/complete
{
  nombre_negocio: "Mi Empresa",
  industria: "servicios",
  soy_profesional: true,
  modulos: { agendamiento: true }
}
  ↓
OnboardingService.completar(userId, data)
  ├─ Crear organización
  ├─ Crear roles default
  ├─ Asignar rol admin al usuario
  ├─ Crear profesional (si aplica)
  └─ Emitir evento auth:organizacion.creada
  ↓
DogfoodingSubscriber (async)
  ├─ Crear cliente en Nexo Team
  └─ Crear suscripción trial
  ↓
Response: { usuario, organizacion, accessToken }
```

### 6. Validación de Fortaleza de Contraseña

```
POST /api/v1/auth/password-strength { password }
  ↓
Evaluar contra requisitos:
  ├─ Mínimo 8 caracteres
  ├─ Al menos una mayúscula
  ├─ Al menos una minúscula
  ├─ Al menos un número
  └─ (Opcional) Carácter especial
  ↓
Response: {
  puntuacion: 0-100,
  nivel: 'debil' | 'media' | 'fuerte' | 'muy_fuerte',
  cumple_requisitos: boolean,
  requisitos: { minLength, hasUpper, hasLower, hasNumber },
  sugerencias: string[]
}
```

**Uso típico**: Mostrar indicador de fortaleza mientras el usuario escribe.

---

## Sistema de Eventos

El onboarding emite eventos para desacoplar efectos secundarios:

```javascript
// backend/app/events/authEvents.js
authEvents.emitOrganizacionCreada(organizacion, usuario);

// backend/app/events/subscribers/dogfoodingSubscriber.js
authEvents.on('auth:organizacion.creada', async (data) => {
  // Ejecuta async con setImmediate (no bloquea)
  await DogfoodingService.vincularOrganizacionComoCliente(organizacion);
});
```

**Subscribers registrados:**
- `dogfoodingSubscriber` - Crea cliente + trial en Nexo Team
- `inventarioSubscriber` - Crea rutas de operación default

---

## Página Mi Cuenta (Frontend)

Página de gestión de cuenta del usuario autenticado. Accesible para todos los usuarios sin requerir `profesional_id`.

### Ruta

```
/mi-cuenta → MiCuentaPage.jsx
```

### Componentes

| Componente | Descripción |
|------------|-------------|
| `MiCuentaPage` | Página principal con info de cuenta y seguridad |
| `CambiarPasswordForm` | Formulario con validación Zod + indicador de fortaleza |

### Características

- **Información de cuenta**: Nombre, email, rol, organización, fecha de registro
- **Cambio de contraseña**: Validación cliente + servidor
  - Mínimo 8 caracteres
  - Al menos una mayúscula, minúscula y número
  - No puede ser igual a la anterior
  - Indicador de fortaleza en tiempo real

### Componentes UI Utilizados

```jsx
import { BackButton, Card } from '@/components/ui';

// BackButton - Navegación consistente
<BackButton to="/home" label="Inicio" />

// Card - Contenedores de secciones
<Card padding="none">
  {/* Header con border-b */}
  {/* Content con padding propio */}
</Card>
```

### API Utilizada

```javascript
// Cambiar contraseña (autenticado)
authApi.cambiarPassword({ passwordAnterior, passwordNueva })
// POST /auth/change-password
```

---

## Seguridad

### Mejoras Feb 2026

| Feature | Descripción |
|---------|-------------|
| **Fail-Closed Blacklist** | Si Redis no está disponible, se rechazan todos los requests (503) |
| **JWT Issuer Validation** | Tokens verifican issuer en generación Y verificación |
| **Rate Limiting por Email** | 5 emails/hora/destinatario (magic-link, reset, registro, reenvío) |
| **Token Invalidation** | Cambios de rol/permisos invalidan tokens activos automáticamente |
| **Account Lockout** | Campo `bloqueado_hasta` en usuarios |
| **Timing-Safe Comparisons** | Prevención de timing attacks en validaciones |
| **Helmet CSP + HSTS** | Headers de seguridad completos |

### Rate Limiting por Email

```javascript
// Endpoints protegidos con doble rate limit:
// 1. heavyOperationRateLimit (por IP)
// 2. emailRateLimit (5 por hora por email destino)

router.post('/magic-link',
    rateLimiting.heavyOperationRateLimit,
    rateLimiting.emailRateLimit,  // ← 5/hora/email
    validation.validate(schema),
    AuthController.solicitarMagicLink
);

// Aplica a: /magic-link, /reset-password, /registrar, /reenviar-activacion
```

### Bloqueo por intentos fallidos

```sql
-- Función registrar_intento_login
-- 5 intentos fallidos → bloqueo 15 minutos
-- Se resetea al login exitoso
-- Campo bloqueado_hasta en tabla usuarios
```

### Token Blacklist (Redis DB 3)

```javascript
// Al hacer logout, el token se agrega a blacklist
const ttl = JwtService.getSecondsUntilExpiry(token);
await addToTokenBlacklist(token, ttl);

// SECURITY FIX (Feb 2026): Fail-Closed
// Si Redis falla, el middleware rechaza con 503
try {
    const isBlacklisted = await checkTokenBlacklist(token);
} catch (error) {
    return res.status(503).json({ code: 'BLACKLIST_SERVICE_UNAVAILABLE' });
}

// Invalidación por cambio de permisos
await tokenBlacklistService.invalidateUserTokens(userId, 'cambio_rol');
```

### Cookies de Refresh Token

```javascript
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,      // No accesible desde JS (XSS)
  secure: true,        // Solo HTTPS en producción
  sameSite: 'strict',  // Previene CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
};
```

### Comparación Timing-Safe

```javascript
// Previene timing attacks en comparación de emails/strings sensibles
function timingSafeStringCompare(str1, str2) {
    const buf1 = Buffer.from(str1.padEnd(maxLen, '\0'), 'utf8');
    const buf2 = Buffer.from(str2.padEnd(maxLen, '\0'), 'utf8');
    return crypto.timingSafeEqual(buf1, buf2);
}
```

---

## Endpoints

### Públicos

| Método | Ruta | Rate Limit | Descripción |
|--------|------|------------|-------------|
| POST | `/auth/login` | auth | Login email + password |
| POST | `/auth/registrar` | heavy + email | Iniciar registro |
| POST | `/auth/reenviar-activacion` | heavy + email | Reenviar email de activación |
| GET | `/auth/activar/:token` | api | Validar activación |
| POST | `/auth/activar/:token` | heavy | Activar cuenta |
| POST | `/auth/oauth/google` | heavy | Login con Google |
| POST | `/auth/magic-link` | heavy + email | Solicitar magic link |
| GET | `/auth/magic-link/verify/:token` | api | Verificar magic link |
| POST | `/auth/reset-password` | heavy + email | Solicitar reset |
| GET | `/auth/validate-reset-token/:token` | api | Validar token reset |
| POST | `/auth/reset-password/:token` | heavy | Confirmar reset |
| GET | `/auth/verificar-email/:token` | api | Verificar email |
| POST | `/auth/refresh` | api | Refrescar access token |
| POST | `/auth/password-strength` | api | Evaluar fortaleza de contraseña |

### Administrativos (Super Admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/crear-primer-admin` | Crear primer super admin (solo si no existen usuarios) |

### Autenticados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/me` | Info usuario actual |
| PUT | `/auth/profile` | Actualizar perfil |
| POST | `/auth/change-password` | Cambiar contraseña |
| POST | `/auth/cambiar-sucursal` | Cambiar sucursal activa |
| GET | `/auth/onboarding/status` | Estado onboarding |
| POST | `/auth/onboarding/complete` | Completar onboarding |

---

## Archivos

### Backend

| Archivo | Responsabilidad | Reutilizable |
|---------|-----------------|--------------|
| `routes/auth.js` | Router principal | ⚠️ Adaptar |
| `routes/auth-onboarding.js` | Registro, activación, onboarding | ⚠️ Adaptar |
| `routes/auth-oauth.js` | OAuth providers | ✅ Copiar |
| `routes/auth-recovery.js` | Reset, magic links | ⚠️ Adaptar |
| `controllers/auth.controller.js` | Orquestación de flujos | ⚠️ Adaptar |
| `models/auth.model.js` | Lógica de autenticación | ⚠️ Adaptar DB layer |
| `models/activacion.model.js` | Tokens de activación/magic link | ❌ Nexo-specific |
| `services/jwtService.js` | Generación/verificación JWT | ✅ Copiar |
| `services/onboardingService.js` | Creación de organizaciones | ❌ Nexo-specific |
| `services/oauth/google.service.js` | Verificación Google OAuth | ✅ Copiar |
| `events/authEvents.js` | Event emitter | ✅ Copiar |
| `events/subscribers/dogfoodingSubscriber.js` | Vinculación a Nexo Team | ❌ Nexo-specific |

### Frontend

| Archivo | Responsabilidad | Reutilizable |
|---------|-----------------|--------------|
| `services/api/modules/auth.api.js` | Cliente API de autenticación | ✅ Copiar |
| `pages/mi-cuenta/MiCuentaPage.jsx` | Página de gestión de cuenta | ⚠️ Adaptar UI |
| `pages/mi-cuenta/components/CambiarPasswordForm.jsx` | Formulario cambio de contraseña | ✅ Copiar |
| `components/auth/PasswordStrengthIndicator.jsx` | Indicador de fortaleza | ✅ Copiar |

---

## Pendientes

### Alta Prioridad

| Tarea | Estado | Descripción |
|-------|--------|-------------|
| Crear `SessionService` | Pendiente | Centralizar cambio de sucursal, cookie management |

### Media Prioridad

| Tarea | Estado | Descripción |
|-------|--------|-------------|
| Implementar Microsoft OAuth | Pendiente | Agregar provider |
| Implementar Apple OAuth | Pendiente | Agregar provider |
| Token rotation en refresh | Pendiente | Generar nuevo refresh en cada uso |

### Baja Prioridad

| Tarea | Estado | Descripción |
|-------|--------|-------------|
| 2FA/MFA | Pendiente | TOTP, SMS, email |
| Device tracking | Pendiente | Registrar dispositivos conocidos |
| Session list | Pendiente | Ver/cerrar sesiones activas |
| Audit log auth | Pendiente | Log detallado de eventos de auth |
| Bcrypt salt como constante | Pendiente | Extraer `12` a `BCRYPT_SALT_ROUNDS` |
| Migrar console.error a logger | Pendiente | 8 archivos relacionados |

---

## Diagrama de Dependencias Actual

```
auth.controller.js (thin controller ~95%)
├── AuthModel ✅ (autenticación pura)
├── JwtService ✅ (generación/verificación JWT)
├── OnboardingService ✅ (creación organizaciones + eventos)
├── UsuarioModel ✅ (CRUD usuarios, OAuth)
├── ActivacionModel ✅ (tokens activación/magic link)
├── GoogleOAuthService ✅ (provider pattern)
├── tokenBlacklistService ✅ (Redis fail-closed)
└── emailService (compartido)
```

### Acoplamiento Residual (~5%)

| Ubicación | Descripción | Prioridad |
|-----------|-------------|-----------|
| `AuthController.cambiarSucursal` | Acceso a SucursalesModel | Media |

### Objetivo Final

```
auth.controller.js (100% orquestación)
├── AuthModel ✅
├── JwtService ✅
├── OnboardingService ✅
├── ActivacionModel ✅
├── SessionService (nuevo - cambio sucursal, cookies)
├── OAuthService (agrupar providers)
└── emailService
```

---

**Estado**: Auditoría 10/10 | Producción Ready | ~70% Reutilizable

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| Feb 2026 | Auditoría final 10/10, rate limiting por email (5/hora/destinatario) |
| Feb 2026 | Fail-closed blacklist, JWT issuer validation, timing-safe comparisons |
| Feb 2026 | Página Mi Cuenta homologada con BackButton y Card |
| Ene 2026 | Endpoint cambiar sucursal activa, invalidación cache permisos |
| Ene 2026 | Tokens migrados a memoria (tokenManager.js), cookies httpOnly |
| Dic 2025 | Magic Links, Google OAuth, Onboarding Service |
| Dic 2025 | Flujo unificado: registro simplificado sin organización |
| Nov 2025 | ActivacionModel extraído, flujo activación con password |
