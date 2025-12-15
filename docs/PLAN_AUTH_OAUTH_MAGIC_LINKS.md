# Plan: Autenticación con OAuth y Magic Links

**Fecha:** Diciembre 2025
**Estado:** Pendiente
**Prioridad:** Alta

---

## Resumen Ejecutivo

Migrar el sistema de autenticación actual (email + password con verificación) a un modelo moderno basado en:

- **OAuth**: Google y Apple como providers
- **Magic Links**: Para usuarios que prefieran email
- **Onboarding Post-Auth**: Wizard de 1 paso para datos del negocio

---

## Decisiones de Diseño

| Aspecto | Decisión |
|---------|----------|
| Password tradicional | ❌ Eliminado - Solo magic links |
| Wizard de onboarding | 1 paso (todo junto) |
| Plan por defecto | `trial` (automático) |
| Selección de plan | Post-registro en configuración |
| Providers por cuenta | 1 (no vincular múltiples) |
| Destino post-onboarding | `/home` |

---

## Arquitectura

### Flujo General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         /auth (nueva página)                            │
│                         Login + Registro unificado                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│     ┌───────────────────────────────────────────────────────────┐      │
│     │          Continuar con Google  (Recomendado)              │      │
│     └───────────────────────────────────────────────────────────┘      │
│     ┌───────────────────────────────────────────────────────────┐      │
│     │          Continuar con Apple                              │      │
│     └───────────────────────────────────────────────────────────┘      │
│                                                                         │
│                         ─────── o ───────                               │
│                                                                         │
│     ┌─────────────────────────────────────────┐                        │
│     │  tucorreo@ejemplo.com                   │                        │
│     └─────────────────────────────────────────┘                        │
│     ┌───────────────────────────────────────────────────────────┐      │
│     │          Continuar con email                              │      │
│     └───────────────────────────────────────────────────────────┘      │
│                                                                         │
│     Al continuar aceptas los Términos y Política de Privacidad         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Flujo Detallado

```
Usuario entra a /auth
        │
        ├─── Click "Google" ──────────────────┐
        │                                     │
        ├─── Click "Apple" ───────────────────┤
        │                                     │
        └─── Ingresa email + click "Email" ───┼──► Backend procesa
                                              │
                                              ▼
                               ┌──────────────────────────┐
                               │   ¿Usuario existe?       │
                               └──────────────────────────┘
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        │                                           │
                        ▼                                           ▼
               ┌────────────────┐                          ┌────────────────┐
               │      NO        │                          │       SÍ       │
               │  (nuevo user)  │                          │   (existente)  │
               └───────┬────────┘                          └───────┬────────┘
                       │                                           │
                       │                                           │
        ┌──────────────┴──────────────┐                           │
        │                             │                           │
        ▼                             ▼                           │
   [OAuth]                      [Magic Link]                      │
   Crear usuario                Enviar email                      │
   desde provider               con link                          │
        │                             │                           │
        │                        Click link                       │
        │                             │                           │
        └──────────────┬──────────────┘                           │
                       │                                          │
                       ▼                                          │
              ┌─────────────────┐                                 │
              │ onboarding_     │                                 │
              │ completado?     │◄────────────────────────────────┘
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
    ┌───────────┐             ┌───────────┐
    │    NO     │             │    SÍ     │
    └─────┬─────┘             └─────┬─────┘
          │                         │
          ▼                         │
┌─────────────────────┐             │
│  /onboarding        │             │
│  (wizard 1 paso)    │             │
└──────────┬──────────┘             │
           │                        │
           └────────────┬───────────┘
                        │
                        ▼
                  ┌───────────┐
                  │   /home   │
                  └───────────┘
```

---

## Cambios en Base de Datos

### Nueva Tabla: `auth_providers`

```sql
CREATE TABLE auth_providers (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL, -- 'google', 'apple', 'email'
    provider_user_id VARCHAR(255), -- ID del usuario en el provider (null para email)
    email VARCHAR(150) NOT NULL,
    nombre VARCHAR(150),
    avatar_url TEXT,
    access_token TEXT, -- Token de acceso (encriptado)
    refresh_token TEXT, -- Refresh token (encriptado)
    token_expira_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_provider_email UNIQUE (provider, email),
    CONSTRAINT unique_usuario_provider UNIQUE (usuario_id) -- Solo 1 provider por usuario
);

CREATE INDEX idx_auth_providers_email ON auth_providers(email);
CREATE INDEX idx_auth_providers_usuario ON auth_providers(usuario_id);
```

### Nueva Tabla: `magic_links`

```sql
CREATE TABLE magic_links (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    tipo VARCHAR(20) DEFAULT 'login', -- 'login', 'registro'
    usado BOOLEAN DEFAULT FALSE,
    expira_en TIMESTAMP NOT NULL,
    usado_en TIMESTAMP,
    ip_solicitante VARCHAR(45),
    user_agent TEXT,
    creado_en TIMESTAMP DEFAULT NOW(),

    CONSTRAINT magic_links_token_key UNIQUE (token)
);

CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expira ON magic_links(expira_en);
```

### Modificaciones a Tabla: `usuarios`

```sql
ALTER TABLE usuarios
    ADD COLUMN onboarding_completado BOOLEAN DEFAULT FALSE,
    ADD COLUMN avatar_url TEXT,
    ALTER COLUMN password_hash DROP NOT NULL; -- Nullable para usuarios OAuth
```

---

## Nuevos Endpoints API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/oauth/google` | Iniciar flujo OAuth Google |
| `GET` | `/auth/oauth/google/callback` | Callback de Google |
| `POST` | `/auth/oauth/apple` | Iniciar flujo OAuth Apple |
| `GET` | `/auth/oauth/apple/callback` | Callback de Apple |
| `POST` | `/auth/magic-link` | Solicitar magic link |
| `GET` | `/auth/magic-link/verify/:token` | Verificar magic link |

### Onboarding

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/auth/onboarding/status` | Verificar si completó onboarding |
| `POST` | `/auth/onboarding/complete` | Completar onboarding |

---

## Estructura de Archivos

### Backend

```
backend/app/modules/core/
├── controllers/
│   ├── auth.controller.js        # Modificar: agregar OAuth + magic links
│   └── onboarding.controller.js  # NUEVO
├── models/
│   ├── auth-provider.model.js    # NUEVO
│   └── magic-link.model.js       # NUEVO
├── routes/
│   └── auth.js                   # Modificar: nuevas rutas
├── services/
│   ├── oauth/
│   │   ├── google.service.js     # NUEVO
│   │   └── apple.service.js      # NUEVO
│   └── magic-link.service.js     # NUEVO
└── middleware/
    └── onboarding.middleware.js  # NUEVO: verificar onboarding completado
```

### Frontend

```
frontend/src/
├── pages/
│   └── auth/
│       ├── AuthPage.jsx          # NUEVO: página unificada login/registro
│       ├── OnboardingPage.jsx    # NUEVO: wizard de 1 paso
│       ├── MagicLinkSent.jsx     # NUEVO: pantalla "revisa tu email"
│       ├── MagicLinkVerify.jsx   # NUEVO: verificación del link
│       ├── LoginPage.jsx         # DEPRECAR
│       └── RegistroPage.jsx      # DEPRECAR
├── components/
│   └── auth/
│       ├── OAuthButton.jsx       # NUEVO
│       ├── OnboardingGuard.jsx   # NUEVO: redirigir si no completó onboarding
│       └── MagicLinkForm.jsx     # NUEVO
├── hooks/
│   └── useOAuth.js               # NUEVO
└── services/api/
    └── endpoints.js              # Modificar: agregar nuevos endpoints
```

---

## Componentes UI

### AuthPage (página principal)

```jsx
// Estructura del componente
<AuthPage>
  <Logo />
  <Título>"Bienvenido a Nexo"</Título>
  <Subtítulo>"Inicia sesión o crea tu cuenta"</Subtítulo>

  <OAuthButton provider="google" />
  <OAuthButton provider="apple" />

  <Divider>"o"</Divider>

  <MagicLinkForm />

  <LegalLinks />
</AuthPage>
```

### OnboardingPage (wizard 1 paso)

```jsx
// Campos del formulario único
<OnboardingPage>
  <ProgressIndicator step={1} total={1} />

  <Section title="Tu negocio">
    <Input name="nombre_negocio" label="Nombre de tu negocio" required />
    <Select name="industria" label="Industria" options={INDUSTRIAS} required />
  </Section>

  <Section title="Ubicación">
    <SelectorUbicacion /> {/* Componente existente: estado + ciudad */}
  </Section>

  <Section title="Tu rol">
    <Checkbox name="soy_profesional" label="Yo atiendo clientes personalmente" />
  </Section>

  <Button type="submit">Comenzar</Button>
</OnboardingPage>
```

---

## Configuración OAuth

### Google Cloud Console

```
1. Crear proyecto en Google Cloud Console
2. Habilitar Google+ API y Google Identity
3. Configurar OAuth consent screen
4. Crear OAuth 2.0 Client ID
5. Agregar URIs de redirección:
   - http://localhost:5173/auth/oauth/google/callback (dev)
   - https://app.nexo.com/auth/oauth/google/callback (prod)
```

### Apple Developer

```
1. Registrar App ID con Sign in with Apple
2. Crear Services ID
3. Configurar dominio y return URL
4. Generar clave privada para JWT
```

### Variables de Entorno

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/oauth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=xxx
APPLE_TEAM_ID=xxx
APPLE_KEY_ID=xxx
APPLE_PRIVATE_KEY=xxx
APPLE_REDIRECT_URI=http://localhost:3001/api/auth/oauth/apple/callback

# Magic Links
MAGIC_LINK_SECRET=xxx
MAGIC_LINK_EXPIRY_MINUTES=15
```

---

## Dependencias Nuevas

### Backend

```json
{
  "passport": "^0.7.0",
  "passport-google-oauth20": "^2.0.0",
  "apple-signin-auth": "^1.7.6"
}
```

### Frontend

```json
{
  "@react-oauth/google": "^0.12.1"
}
```

---

## Plan de Implementación

### Fase 1: Infraestructura (Backend)

- [ ] Crear migraciones de base de datos
  - [ ] Tabla `auth_providers`
  - [ ] Tabla `magic_links`
  - [ ] Modificar tabla `usuarios`
- [ ] Crear modelos
  - [ ] `auth-provider.model.js`
  - [ ] `magic-link.model.js`
- [ ] Crear servicios OAuth
  - [ ] `google.service.js`
  - [ ] `apple.service.js`
  - [ ] `magic-link.service.js`

### Fase 2: Endpoints (Backend)

- [ ] Implementar rutas OAuth Google
- [ ] Implementar rutas OAuth Apple
- [ ] Implementar rutas Magic Link
- [ ] Implementar endpoint de onboarding
- [ ] Crear middleware `onboarding.middleware.js`

### Fase 3: Frontend

- [ ] Crear `AuthPage.jsx` (unificada)
- [ ] Crear `OnboardingPage.jsx` (wizard 1 paso)
- [ ] Crear `MagicLinkSent.jsx`
- [ ] Crear `MagicLinkVerify.jsx`
- [ ] Crear componente `OAuthButton.jsx`
- [ ] Crear componente `OnboardingGuard.jsx`
- [ ] Actualizar rutas en `router.jsx`
- [ ] Actualizar `endpoints.js`

### Fase 4: Integración

- [ ] Configurar Google Cloud Console
- [ ] Configurar Apple Developer
- [ ] Agregar variables de entorno
- [ ] Pruebas end-to-end
- [ ] Deprecar páginas antiguas (`LoginPage`, `RegistroPage`)

### Fase 5: Limpieza

- [ ] Eliminar código de activaciones antiguo
- [ ] Actualizar documentación
- [ ] Eliminar tabla `activaciones_cuenta` (después de migración)

---

## Migración de Usuarios Existentes

Los usuarios existentes con password:
1. Mantienen acceso con su email/password actual
2. Se les permite vincular OAuth en su perfil
3. Gradualmente migrar a magic links

```sql
-- Marcar usuarios existentes como onboarding completado
UPDATE usuarios
SET onboarding_completado = TRUE
WHERE organizacion_id IS NOT NULL;
```

---

## Seguridad

### Magic Links

- Token: 64 caracteres aleatorios (crypto.randomBytes)
- Expiración: 15 minutos
- Uso único: se invalida después de usar
- Rate limiting: máximo 3 solicitudes por email cada 5 minutos

### OAuth

- Validar tokens con el provider
- No almacenar tokens sensibles sin encriptar
- Verificar email del provider
- CSRF protection en callbacks

### Sesiones

- JWT con refresh tokens (ya implementado)
- Mantener sistema actual de tokens

---

## Testing

### Casos de Prueba

1. **Nuevo usuario con Google**
   - Flujo completo → onboarding → /home

2. **Nuevo usuario con Apple**
   - Flujo completo → onboarding → /home

3. **Nuevo usuario con Magic Link**
   - Solicitar → email → click → onboarding → /home

4. **Usuario existente con Google**
   - Login → /home (sin onboarding)

5. **Usuario existente con Magic Link**
   - Solicitar → email → click → /home

6. **Magic link expirado**
   - Error mensaje claro + opción reenviar

7. **Email ya registrado con otro provider**
   - Mensaje: "Este email ya está registrado con Google"

---

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tasa de conversión registro | +20% vs actual |
| Tiempo promedio de registro | < 60 segundos |
| Tasa de abandono en onboarding | < 15% |
| Usuarios usando OAuth vs Email | 70% / 30% |

---

## Referencias

- [Google Identity Services](https://developers.google.com/identity)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Magic Links Best Practices](https://postmarkapp.com/guides/password-reset-email-best-practices)
