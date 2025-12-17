# Plan: Autenticación con OAuth y Magic Links

**Fecha:** Diciembre 2025
**Estado:** Pendiente
**Prioridad:** Alta
**Última revisión:** Análisis arquitectónico Dic 2025

---

## Resumen Ejecutivo

Migrar el sistema de autenticación actual (email + password con verificación) a un modelo moderno basado en:

- **OAuth**: Google como provider principal
- **Magic Links**: Para usuarios que prefieran email sin password
- **Login tradicional**: Mantenido como fallback (usuarios existentes y enterprise)
- **Onboarding Post-Auth**: Wizard de 1 paso para datos del negocio

---

## Decisiones de Diseño

| Aspecto | Decisión |
|---------|----------|
| Password tradicional | ✅ Mantenido como fallback |
| OAuth Provider | Google únicamente (Apple descartado por complejidad) |
| Wizard de onboarding | 1 paso (todo junto) |
| Plan por defecto | `trial` (automático) |
| Selección de plan | Post-registro en configuración |
| Providers por cuenta | Múltiples permitidos (Google + password) |
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
│     ┌───────────────────────────────────────────────────────────┐      │
│     │          ¿Ya tienes cuenta? Inicia sesión                 │      │
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
        └─── Ingresa email + click "Email" ───┤
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
   desde Google                 con link                          │
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

> **NOTA**: No hay migraciones. Cambios directos en archivos SQL ya que se levanta desde cero.

### Modificaciones a Tabla: `usuarios` (01-tablas-core.sql)

Agregar columnas para OAuth y onboarding:

```sql
-- OAuth Google
google_id VARCHAR(255) UNIQUE,        -- ID único del usuario en Google
avatar_url TEXT,                      -- URL del avatar (de Google o subido)

-- Estado de onboarding
onboarding_completado BOOLEAN DEFAULT FALSE,

-- Cambiar password_hash a nullable (usuarios OAuth no tienen password)
password_hash VARCHAR(255),           -- ANTES: NOT NULL, AHORA: nullable
```

### Modificaciones a Tabla: `activaciones_cuenta` (10-activaciones-cuenta.sql)

Agregar soporte para magic links (reutilizando infraestructura existente):

```sql
-- Tipo de activación
tipo VARCHAR(20) DEFAULT 'registro'
    CHECK (tipo IN ('registro', 'magic_link')),

-- Para magic links: expiración más corta (15 min vs 24h de registro)
-- La columna expira_en ya existe, se manejará en código
```

### Nueva Tabla: `magic_links` (OPCIONAL - usar activaciones_cuenta)

> **Decisión arquitectónica**: Reutilizar `activaciones_cuenta` agregando columna `tipo` en lugar de crear tabla nueva. Reduce complejidad y aprovecha infraestructura existente.

---

## Nuevos Endpoints API

### Autenticación OAuth

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/oauth/google` | Recibe token de Google, crea/autentica usuario |

### Magic Links

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/magic-link` | Solicitar magic link (envía email) |
| `GET` | `/auth/magic-link/verify/:token` | Verificar y autenticar con magic link |

### Onboarding

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/auth/onboarding/status` | Verificar si completó onboarding |
| `POST` | `/auth/onboarding/complete` | Completar onboarding (crear org + datos) |

### Login Tradicional (mantener)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login email + password (existente) |
| `POST` | `/auth/registrar` | Registro simplificado (existente) |

---

## Estructura de Archivos

### Backend

```
backend/app/modules/core/
├── controllers/
│   ├── auth.controller.js        # MODIFICAR: agregar OAuth + magic links
│   └── onboarding.controller.js  # NUEVO
├── models/
│   ├── usuario.model.js          # MODIFICAR: métodos OAuth
│   └── activacion.model.js       # MODIFICAR: soporte magic_link
├── routes/
│   └── auth.js                   # MODIFICAR: nuevas rutas
├── services/
│   └── oauth/
│       └── google.service.js     # NUEVO
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
│       ├── LoginPage.jsx         # MANTENER: fallback login tradicional
│       └── RegistroPage.jsx      # MANTENER: fallback registro tradicional
├── components/
│   └── auth/
│       ├── GoogleButton.jsx      # NUEVO
│       ├── OnboardingGuard.jsx   # NUEVO: redirigir si no completó onboarding
│       └── MagicLinkForm.jsx     # NUEVO
├── hooks/
│   └── useGoogleAuth.js          # NUEVO
└── services/api/
    └── endpoints.js              # MODIFICAR: agregar nuevos endpoints
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

  <GoogleButton />

  <Divider>"o"</Divider>

  <MagicLinkForm />

  <Link to="/auth/login">"¿Ya tienes cuenta? Inicia sesión"</Link>

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

## Configuración OAuth - Google

### Google Cloud Console

```
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Identity Services API
3. Configurar OAuth consent screen:
   - Tipo: Externo
   - Nombre de app: Nexo
   - Dominios autorizados: nexo.com (prod)
   - Scopes: email, profile, openid
4. Crear OAuth 2.0 Client ID (Web application)
5. Agregar URIs de redirección:
   - http://localhost:5173 (dev frontend)
   - https://app.nexo.com (prod)
6. Agregar orígenes JavaScript autorizados:
   - http://localhost:5173 (dev)
   - https://app.nexo.com (prod)
```

### Variables de Entorno

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Magic Links
MAGIC_LINK_EXPIRY_MINUTES=15

# Frontend
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## Dependencias Nuevas

### Backend

```json
{
  "google-auth-library": "^9.0.0"
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

### Fase 1: Base de Datos

- [ ] Modificar `sql/nucleo/01-tablas-core.sql`:
  - [ ] Agregar `google_id VARCHAR(255) UNIQUE`
  - [ ] Agregar `avatar_url TEXT`
  - [ ] Agregar `onboarding_completado BOOLEAN DEFAULT FALSE`
  - [ ] Cambiar `password_hash` a nullable
- [ ] Modificar `sql/nucleo/10-activaciones-cuenta.sql`:
  - [ ] Agregar columna `tipo` para diferenciar registro vs magic_link

### Fase 2: Backend - Magic Links

- [ ] Modificar `activacion.model.js`:
  - [ ] Agregar soporte para tipo 'magic_link'
  - [ ] Método para crear magic link (15 min expiración)
  - [ ] Método para verificar y autenticar
- [ ] Modificar `auth.controller.js`:
  - [ ] Endpoint `POST /auth/magic-link`
  - [ ] Endpoint `GET /auth/magic-link/verify/:token`
- [ ] Crear template de email para magic link
- [ ] Actualizar rutas en `routes/auth.js`

### Fase 3: Backend - OAuth Google

- [ ] Crear `services/oauth/google.service.js`:
  - [ ] Verificar token ID de Google
  - [ ] Extraer datos del usuario (email, nombre, avatar)
- [ ] Modificar `usuario.model.js`:
  - [ ] Método `buscarPorGoogleId()`
  - [ ] Método `crearDesdeGoogle()`
  - [ ] Método `vincularGoogle()`
- [ ] Modificar `auth.controller.js`:
  - [ ] Endpoint `POST /auth/oauth/google`
- [ ] Actualizar rutas en `routes/auth.js`

### Fase 4: Backend - Onboarding

- [ ] Crear `onboarding.controller.js`:
  - [ ] Endpoint `GET /auth/onboarding/status`
  - [ ] Endpoint `POST /auth/onboarding/complete`
- [ ] Crear `middleware/onboarding.middleware.js`:
  - [ ] Verificar `onboarding_completado` en rutas protegidas
- [ ] Actualizar rutas

### Fase 5: Frontend

- [ ] Instalar `@react-oauth/google`
- [ ] Configurar `GoogleOAuthProvider` en `App.jsx`
- [ ] Crear `AuthPage.jsx` (unificada)
- [ ] Crear `GoogleButton.jsx`
- [ ] Crear `MagicLinkForm.jsx`
- [ ] Crear `MagicLinkSent.jsx`
- [ ] Crear `MagicLinkVerify.jsx`
- [ ] Crear `OnboardingPage.jsx` (wizard 1 paso)
- [ ] Crear `OnboardingGuard.jsx`
- [ ] Actualizar `router.jsx` con nuevas rutas
- [ ] Actualizar `endpoints.js`

### Fase 6: Integración y Testing

- [ ] Configurar Google Cloud Console (credenciales)
- [ ] Agregar variables de entorno
- [ ] Pruebas de flujo completo:
  - [ ] Nuevo usuario con Google → onboarding → /home
  - [ ] Nuevo usuario con Magic Link → onboarding → /home
  - [ ] Usuario existente con Google → /home
  - [ ] Usuario existente con Magic Link → /home
  - [ ] Usuario existente con password → /home
  - [ ] Magic link expirado → mensaje + opción reenviar

---

## Seguridad

### Magic Links

- Token: 64 caracteres aleatorios (crypto.randomBytes) - reutiliza TokenManager existente
- Expiración: 15 minutos
- Uso único: se invalida después de usar
- Rate limiting: máximo 3 solicitudes por email cada 5 minutos

### OAuth Google

- Validar token ID con `google-auth-library`
- Verificar `aud` (audience) coincide con CLIENT_ID
- Verificar `iss` (issuer) es accounts.google.com
- Extraer email verificado (`email_verified: true`)

### Sesiones

- JWT con refresh tokens (sistema actual, sin cambios)
- Misma lógica de blacklist en Redis

---

## Testing

### Casos de Prueba

1. **Nuevo usuario con Google**
   - Click Google → autorizar → onboarding → /home
   - Verificar: usuario creado, google_id guardado, onboarding_completado=false→true

2. **Nuevo usuario con Magic Link**
   - Ingresar email → recibir email → click link → onboarding → /home
   - Verificar: activación tipo='magic_link', usuario creado sin password

3. **Usuario existente con Google**
   - Click Google → /home (sin onboarding)
   - Verificar: mismo usuario, actualizar último_login

4. **Usuario existente con Magic Link**
   - Ingresar email → recibir email → click link → /home
   - Verificar: no crear nuevo usuario, solo autenticar

5. **Usuario existente con Password**
   - /auth/login → email + password → /home
   - Verificar: flujo existente sin cambios

6. **Magic link expirado**
   - Esperar 15+ min → click link → error + opción reenviar

7. **Email ya registrado con Google**
   - Intentar magic link con email de usuario Google
   - Comportamiento: enviar magic link (permite acceso alternativo)

---

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tasa de conversión registro | +20% vs actual |
| Tiempo promedio de registro | < 60 segundos |
| Tasa de abandono en onboarding | < 15% |
| Usuarios usando Google vs Email | 60% / 40% |

---

## Notas de Implementación

### Reutilización de Código Existente

1. **TokenManager** (`utils/tokenManager.js`): Usar para generar tokens de magic link
2. **emailService**: Usar para enviar emails de magic link
3. **activaciones_cuenta**: Extender para magic links (agregar tipo)
4. **RLSContextManager**: Usar withBypass para operaciones de auth

### Compatibilidad con Flujo Actual

- El registro actual (`/registro` → activación → crear password) sigue funcionando
- El login actual (`/auth/login`) sigue funcionando
- Nuevos usuarios pueden elegir: Google, Magic Link, o registro tradicional

### Consideraciones UX

- Google es la opción principal (botón más prominente)
- Magic Link como alternativa sin password
- Link a login tradicional para usuarios existentes
- Onboarding solo se muestra una vez (flag `onboarding_completado`)

---

## Referencias

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library](https://www.npmjs.com/package/google-auth-library)
