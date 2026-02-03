# Módulo de Autenticación

Sistema de login multi-método para Nexo ERP.

---

## Resumen

| Aspecto | Valor |
|---------|-------|
| **Ubicación Backend** | `backend/app/modules/auth/` |
| **Ubicación Frontend** | `frontend/src/features/auth/` |
| **Métodos de login** | Email+Password, Google OAuth, Magic Links |
| **Tokens** | JWT (access 1h, refresh 7d) con issuer validado |
| **Blacklist** | Redis DB 3 (fail-closed) |
| **Rate Limiting** | Por IP + Por Email (5/hora/destinatario) |

---

## Estructura

### Backend (`modules/auth/`)

```
modules/auth/
├── controllers/auth.controller.js    # Orquestación de flujos
├── models/
│   ├── auth.model.js                 # Login, refresh, reset password
│   └── activacion.model.js           # Tokens activación/magic link
├── routes/
│   ├── auth.js                       # Router principal
│   ├── auth-oauth.js                 # Google OAuth
│   ├── auth-onboarding.js            # Registro, activación
│   └── auth-recovery.js              # Reset, magic links
├── schemas/
│   ├── auth.schemas.js               # Joi validations
│   └── activacion.schemas.js
├── services/
│   ├── jwtService.js                 # JWT generate/verify
│   ├── tokenBlacklistService.js      # Redis blacklist
│   ├── onboardingService.js          # Creación de organizaciones
│   └── oauth/google.service.js       # Google OAuth
├── middleware/
│   ├── auth.js                       # authenticateToken
│   └── onboarding.js                 # requireOnboardingComplete
├── events/authEvents.js              # Event emitter
├── email-templates/                  # Templates de email
├── utils/
│   ├── passwordHelper.js             # Evaluación fortaleza
│   └── tokenManager.js               # Token utilities
├── config/auth.js                    # Configuración
└── manifest.json                     # Definición del módulo
```

### Frontend (`features/auth/`)

```
features/auth/
├── api/auth.api.js                   # Cliente API
├── store/authStore.js                # Zustand store
├── services/tokenManager.js          # Access token en memoria
├── components/
│   ├── AuthLayout.jsx                # Layout páginas auth
│   ├── ProtectedRoute.jsx            # Guard de rutas
│   ├── SetupGuard.jsx                # Guard de setup
│   ├── GoogleSignInButton.jsx
│   └── PasswordStrengthIndicator.jsx
├── pages/
│   ├── Login.jsx
│   ├── RegistroPage.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── ActivarCuentaPage.jsx
│   ├── MagicLinkVerifyPage.jsx
│   ├── OnboardingPage.jsx
│   └── RegistroInvitacionPage.jsx
├── routes/auth.routes.jsx
└── index.js                          # Barrel export
```

### Re-exports de Compatibilidad (Backend)

Archivos puente para imports legacy:
- `middleware/auth.js` → re-exporta desde `modules/auth/`
- `services/jwtService.js` → re-exporta desde `modules/auth/`
- `services/tokenBlacklistService.js` → re-exporta desde `modules/auth/`
- `services/onboardingService.js` → re-exporta desde `modules/auth/`
- `events/authEvents.js` → re-exporta desde `modules/auth/`

---

## Flujos Principales

### Login Email + Password

```
POST /api/v1/auth/login
  → AuthModel.autenticar(email, password, ip)
  → Response: { usuario, accessToken, expiresIn }
  → Cookie: refreshToken (httpOnly)
```

### Google OAuth

```
POST /api/v1/auth/oauth/google { credential }
  → GoogleOAuthService.verifyToken()
  → Usuario existe? Login : Crear + requiere_onboarding
```

### Magic Links

```
POST /api/v1/auth/magic-link { email }
  → [Rate Limit: 5/hora/email]
  → ActivacionModel.crearMagicLink()
  → emailService.enviarMagicLink()

GET /api/v1/auth/magic-link/verify/:token
  → Login automático
```

### Registro + Activación

```
POST /api/v1/auth/registrar { nombre, email }
  → ActivacionModel.crear() → Token
  → emailService.enviarActivacionCuenta()

POST /api/v1/auth/activar/:token { password }
  → Crear usuario → requiere_onboarding: true
```

### Onboarding

```
POST /api/v1/auth/onboarding/complete
  → OnboardingService.completar()
  → Crea org, roles, profesional
  → Emite auth:organizacion.creada
```

---

## Seguridad

| Feature | Descripción |
|---------|-------------|
| **Fail-Closed Blacklist** | Redis falla → 503 (rechaza request) |
| **JWT Issuer Validation** | Verifica issuer en generación y verificación |
| **Rate Limiting Email** | 5 emails/hora/destinatario |
| **AccessToken en memoria** | No localStorage, solo variable JS |
| **RefreshToken httpOnly** | Cookie segura, sameSite strict |
| **Account Lockout** | 5 intentos fallidos → bloqueo 15 min |
| **Timing-Safe Comparisons** | crypto.timingSafeEqual en validaciones |

---

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login email + password |
| POST | `/auth/registrar` | Iniciar registro |
| POST | `/auth/reenviar-activacion` | Reenviar email |
| GET/POST | `/auth/activar/:token` | Validar/activar cuenta |
| POST | `/auth/oauth/google` | Login con Google |
| POST | `/auth/magic-link` | Solicitar magic link |
| GET | `/auth/magic-link/verify/:token` | Verificar magic link |
| POST | `/auth/reset-password` | Solicitar reset |
| GET | `/auth/validate-reset-token/:token` | Validar token |
| POST | `/auth/reset-password/:token` | Confirmar reset |
| POST | `/auth/refresh` | Refrescar access token |
| POST | `/auth/password-strength` | Evaluar fortaleza |

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

## Imports

### Backend

```javascript
// Desde otros módulos
const AuthController = require('../../auth/controllers/auth.controller');
const { authSchemas } = require('../../auth/schemas/auth.schemas');
const JwtService = require('../../auth/services/jwtService');

// Compatibilidad (re-exports)
const auth = require('../middleware/auth');
const JwtService = require('../services/jwtService');
```

### Frontend

```javascript
// Desde barrel export
import { useAuthStore, authApi, ProtectedRoute } from '@/features/auth';

// Desde store index (re-export)
import { useAuthStore, selectUser } from '@/store';

// Desde api modules (re-export)
import { authApi } from '@/services/api/modules';
```

---

## Pendientes

| Prioridad | Tarea |
|-----------|-------|
| Media | Microsoft/Apple OAuth |
| Media | Token rotation en refresh |
| Baja | 2FA/MFA (TOTP, SMS) |
| Baja | Device tracking |
| Baja | Session list (ver/cerrar sesiones) |

---

**Migración completada**: Feb 2026 - Módulo desacoplado a `modules/auth/` y `features/auth/`
