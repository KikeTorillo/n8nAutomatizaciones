# 🎨 PLAN FRONTEND - MARKETPLACE DE CLIENTES

**Fecha Creación:** 18 Noviembre 2025
**Estado:** 📋 Planificación Completa
**Duración Estimada:** 10-12 días (~88 horas)

---

## 📊 ANÁLISIS DEL FRONTEND EXISTENTE

### Arquitectura y Patrones Identificados

#### **1. Estructura de Directorios**

```
frontend/src/
├── app/
│   ├── App.jsx              # QueryClientProvider + SetupGuard + ToastContainer
│   └── router.jsx           # React Router v6 con lazy loading
├── components/
│   ├── ui/                  # ✅ Componentes base reutilizables
│   ├── auth/                # Componentes de autenticación
│   ├── citas/               # Componentes de citas
│   ├── clientes/            # Componentes de clientes
│   ├── comisiones/          # 9 componentes comisiones
│   ├── dashboard/           # SetupChecklist, TrialStatusWidget
│   └── [otros módulos]/
├── hooks/
│   ├── useProfesionales.js  # ✅ Patrón TanStack Query
│   ├── useServicios.js      # ✅ Referencia completa
│   ├── useComisiones.js     # 11 hooks
│   └── [14 hooks totales]
├── pages/
│   ├── dashboard/           # Dashboard.jsx
│   ├── comisiones/          # 3 páginas
│   ├── citas/               # Páginas de citas
│   └── [otros módulos]/
├── services/api/
│   ├── client.js            # Axios + interceptors JWT
│   └── endpoints.js         # ✅ 910 líneas - API centralizada
└── lib/
    └── utils.js             # cn() helper para Tailwind
```

#### **2. Componentes UI Reutilizables Disponibles**

**✅ USAR DIRECTAMENTE (no crear duplicados):**

| Componente | Características | Uso Marketplace |
|------------|----------------|-----------------|
| **Button** | 6 variantes, 4 tamaños, loading state | CTAs, formularios |
| **Modal** | 4 tamaños, Framer Motion, ESC close | Formularios, confirmaciones |
| **Input** | Validación, error state, icons | Búsqueda, filtros |
| **Select** | Controlled, opciones dinámicas | Filtros (ciudad, categoría) |
| **MultiSelect** | Múltiple selección | Servicios en agendamiento |
| **Toast** | Notificaciones temporales | Feedback operaciones |
| **ConfirmDialog** | Confirmación acciones | Eliminar, desactivar |

**⚠️ CREAR NUEVOS (marketplace-específicos):**
- `EstrellaRating.jsx` - Sistema de 5 estrellas (reseñas)
- `MapaUbicacion.jsx` - Google Maps embebido
- `SelectorFechaHora.jsx` - Calendario + slots horarios

#### **3. Patrón de Hooks (TanStack Query)**

**Estructura estandarizada (basada en useServicios.js):**

```javascript
// ✅ QUERY - Listar con filtros
export function usePerfilesMarketplace(params = {}) {
  return useQuery({
    queryKey: ['perfiles-marketplace', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params (eliminar "", null, undefined)
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await marketplaceApi.getPerfiles(sanitizedParams);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    keepPreviousData: true,    // Evita flash durante paginación
  });
}

// ✅ MUTATION - Crear con invalidación múltiple
export function useCrearPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = { ...data, /* sanitizar opcionales */ };
      const response = await marketplaceApi.crearPerfil(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['perfiles-marketplace']);
      queryClient.invalidateQueries(['mi-perfil-marketplace']);
      queryClient.invalidateQueries(['organizacion-setup-progress']);
    },
    onError: (error) => {
      // ⚠️ PRIORIZAR mensaje del backend
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      // Fallback a mensajes por código
      const errorMessages = {
        409: 'Ya existe un perfil para esta organización',
        400: 'Datos inválidos',
        403: 'Sin permisos',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error inesperado');
    },
  });
}
```

#### **4. Patrón de API Client (endpoints.js)**

**Estructura modular por recurso:**

```javascript
// ==================== MARKETPLACE ====================
export const marketplaceApi = {
  // ========== Públicas (sin auth) ==========

  /**
   * Buscar perfiles en directorio
   * @param {Object} params - { ciudad, categoria, rating_min, busqueda, pagina, limite }
   * @returns {Promise<Object>} { perfiles, paginacion }
   */
  getPerfiles: (params = {}) => apiClient.get('/marketplace/perfiles/buscar', { params }),

  /**
   * Obtener perfil público por slug
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  getPerfilPorSlug: (slug) => apiClient.get(`/marketplace/perfiles/slug/${slug}`),

  /**
   * Registrar evento de analytics (fire-and-forget)
   * @param {Object} data - { perfil_id, tipo_evento, metadata }
   */
  registrarEvento: (data) => apiClient.post('/marketplace/analytics', data),

  // ========== Privadas (requieren auth) ==========

  /**
   * Crear perfil de marketplace
   * @param {Object} data
   */
  crearPerfil: (data) => apiClient.post('/marketplace/perfiles', data),

  /**
   * Actualizar mi perfil
   * @param {number} id
   * @param {Object} data
   */
  actualizarPerfil: (id, data) => apiClient.put(`/marketplace/perfiles/${id}`, data),

  /**
   * Obtener mi perfil (admin/propietario)
   */
  getMiPerfil: () => apiClient.get('/marketplace/perfiles/mi-perfil'),

  /**
   * Activar/desactivar perfil (super_admin)
   * @param {number} id
   * @param {boolean} activo
   */
  activarPerfil: (id, activo) => apiClient.patch(`/marketplace/perfiles/${id}/activar`, { activo }),

  /**
   * Obtener estadísticas del perfil
   * @param {number} id
   * @param {Object} params - { fecha_desde, fecha_hasta }
   */
  getEstadisticasPerfil: (id, params = {}) =>
    apiClient.get(`/marketplace/perfiles/${id}/estadisticas`, { params }),

  // ========== Reseñas ==========

  /**
   * Listar reseñas de un negocio (público)
   * @param {string} slug
   * @param {Object} params - { pagina, limite, orden }
   */
  getReseñas: (slug, params = {}) =>
    apiClient.get(`/marketplace/resenas/negocio/${slug}`, { params }),

  /**
   * Crear reseña (autenticado - cliente con cita completada)
   * @param {Object} data - { cita_id, rating, comentario }
   */
  crearReseña: (data) => apiClient.post('/marketplace/resenas', data),

  /**
   * Responder reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { respuesta }
   */
  responderReseña: (id, data) => apiClient.post(`/marketplace/resenas/${id}/responder`, data),

  /**
   * Moderar reseña (admin/propietario)
   * @param {number} id
   * @param {Object} data - { estado, motivo_moderacion }
   */
  moderarReseña: (id, data) => apiClient.patch(`/marketplace/resenas/${id}/moderar`, data),
};

// Agregar a export default
export default {
  // ... otros módulos
  marketplace: marketplaceApi,
};
```

#### **5. Patrón de Routing (router.jsx)**

**Lazy Loading con Suspense:**

```javascript
import { lazy } from 'react';

// ✅ Lazy loading de páginas
const DirectorioMarketplacePage = lazy(() => import('@/pages/marketplace/DirectorioMarketplacePage'));
const PerfilPublicoPage = lazy(() => import('@/pages/marketplace/PerfilPublicoPage'));

// ✅ Rutas públicas (sin ProtectedRoute)
{
  path: '/marketplace',
  element: <DirectorioMarketplacePage />
},
{
  path: '/:slug',  // ⚠️ Debe ser la última ruta para no colisionar
  element: <PerfilPublicoPage />
},

// ✅ Rutas protegidas (con ProtectedRoute + requiredRole)
{
  path: '/mi-marketplace',
  element: (
    <ProtectedRoute requiredRole={['admin', 'propietario']}>
      <MiMarketplacePage />
    </ProtectedRoute>
  ),
},
```

---

## 🎯 ESTRATEGIA UX/NAVEGACIÓN

### Flujos de Usuario

#### **A. Cliente Potencial (No Autenticado) - PÚBLICO**

```
1. Landing/Google → /marketplace (Directorio)
   ├─ Búsqueda por ciudad/categoría/rating
   ├─ Grid de tarjetas de negocios
   └─ Clic en negocio → /:slug (Perfil Público)

2. Perfil Público (/:slug)
   ├─ Header: Portada, logo, rating, info básica
   ├─ Tabs: Servicios | Profesionales | Reseñas | Ubicación
   ├─ Sidebar: Contacto, redes, horarios, mapa
   └─ CTA Principal: "Agendar Cita" → /agendar/:slug

3. Agendamiento Público (/agendar/:slug)
   ├─ Stepper 4 pasos:
   │  1. Seleccionar servicios (multi-select)
   │  2. Fecha/hora (calendario + slots)
   │  3. Datos personales (nombre, teléfono, email)
   │  4. Confirmación + creación automática de cliente
   └─ Éxito → Página confirmación + email
```

**⚠️ CRÍTICO - Tracking Analytics (Fire-and-Forget):**
- `vista_perfil` - Al cargar PerfilPublicoPage
- `clic_agendar` - Al hacer clic en botón "Agendar"
- `clic_telefono`, `clic_sitio_web`, `clic_instagram`, `clic_facebook` - Clics en contacto
- **NO bloquear UI** - Usar `marketplaceApi.registrarEvento()` sin await

#### **B. Admin/Propietario (Autenticado) - PANEL INTERNO**

```
Dashboard (/dashboard)
  └─ Card "Mi Marketplace" (si tiene_perfil_marketplace = true)
     └─ Clic → /mi-marketplace

Mi Marketplace (/mi-marketplace)
  ├─ Tabs: Perfil | Reseñas | Analytics
  │
  ├─ Tab "Perfil"
  │  ├─ Formulario CRUD (nombre, descripción, contacto, redes)
  │  ├─ Galería de fotos (logo, portada, galería)
  │  ├─ Preview en tiempo real (iframe o componente)
  │  └─ Botón: Activar/Desactivar publicación
  │
  ├─ Tab "Reseñas" → /mi-marketplace/resenas
  │  ├─ Lista de reseñas con filtros (rating, fecha, respondidas)
  │  ├─ Responder reseñas (modal)
  │  └─ Moderación (ocultar/reportar)
  │
  └─ Tab "Analytics" → /mi-marketplace/analytics
     ├─ Métricas: Vistas, clics, conversión
     ├─ Gráfica de vistas (Chart.js - Bar graph)
     ├─ Fuentes de tráfico
     └─ Filtro por fechas (última semana, mes, trimestre, custom)
```

**Navegación en Dashboard:**
```jsx
// Dashboard.jsx - Agregar Card de Marketplace
{usuario.organizacion.tiene_perfil_marketplace && (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => navigate('/mi-marketplace')}>
    <div className="flex items-center gap-4">
      <Store className="w-12 h-12 text-primary-600" />
      <div>
        <h3 className="text-lg font-semibold">Mi Marketplace</h3>
        <p className="text-sm text-gray-600">
          Gestiona tu perfil público y reseñas
        </p>
      </div>
    </div>
  </Card>
)}
```

#### **C. Super Admin (Autenticado) - GESTIÓN GLOBAL**

```
Panel Super Admin (/superadmin/marketplace)
  ├─ Lista de todos los perfiles (con filtros)
  ├─ Aprobar/rechazar perfiles nuevos
  ├─ Activar/desactivar perfiles
  └─ Ver analytics globales
```

---

## 📦 IMPLEMENTACIÓN DETALLADA

### FASE 1: Configuración Base (Día 1 - 4h)

#### **1.1 Crear estructura de directorios**

```bash
mkdir -p frontend/src/pages/marketplace
mkdir -p frontend/src/components/marketplace
mkdir -p frontend/src/hooks
```

#### **1.2 Extender API Client**

**Archivo:** `frontend/src/services/api/endpoints.js`

```javascript
// Agregar marketplaceApi como se mostró arriba (líneas 910+)
// Total: ~150 líneas adicionales
```

#### **1.3 Crear hook base useMarketplace.js**

**Archivo:** `frontend/src/hooks/useMarketplace.js` (~400 líneas)

**Hooks a implementar (10 hooks):**

```javascript
// ========== QUERIES (7) ==========
usePerfilesMarketplace(params)        // Listar perfiles públicos (directorio)
usePerfilPublico(slug)                 // Detalle perfil por slug (público)
useMiPerfilMarketplace()               // Mi perfil (admin)
useEstadisticasPerfil(id, params)      // Analytics del perfil

useReseñasNegocio(slug, params)        // Listar reseñas (público)

useDisponibilidadPublica(slug, params) // Slots libres para agendar (público)
                                        // ⚠️ Reutiliza endpoint existente

// ========== MUTATIONS (3) ==========
useCrearPerfil()                       // Crear perfil
useActualizarPerfil()                  // CRUD perfil
useCrearReseña()                       // Crear reseña (cliente)
useResponderReseña()                   // Responder reseña (admin)
```

**Ejemplo de implementación completa:**

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/api/endpoints';

/**
 * Hook para listar perfiles del marketplace (público)
 * @param {Object} params - { ciudad, categoria, rating_min, busqueda, pagina, limite }
 */
export function usePerfilesMarketplace(params = {}) {
  return useQuery({
    queryKey: ['perfiles-marketplace', params],
    queryFn: async () => {
      // Sanitizar params
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          // Validar rating_min (1-5)
          if (key === 'rating_min') {
            const num = parseInt(value);
            if (!isNaN(num) && num >= 1 && num <= 5) acc[key] = num;
          } else {
            acc[key] = value;
          }
        }
        return acc;
      }, {});

      const response = await marketplaceApi.getPerfiles(sanitizedParams);
      return {
        perfiles: response.data.data.perfiles || [],
        paginacion: response.data.data.paginacion || null,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (contenido público cambia poco)
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener perfil público por slug
 * @param {string} slug
 */
export function usePerfilPublico(slug) {
  return useQuery({
    queryKey: ['perfil-publico', slug],
    queryFn: async () => {
      const response = await marketplaceApi.getPerfilPorSlug(slug);
      return response.data.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para crear perfil de marketplace
 */
export function useCrearPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar opcionales
      const sanitized = {
        ...data,
        descripcion_larga: data.descripcion_larga?.trim() || undefined,
        email_publico: data.email_publico?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
      };
      const response = await marketplaceApi.crearPerfil(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['perfiles-marketplace']);
      queryClient.invalidateQueries(['mi-perfil-marketplace']);
      queryClient.invalidateQueries(['organizacion-setup-progress']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        409: 'Ya existe un perfil para esta organización',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear perfiles',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al crear perfil');
    },
  });
}

// ... resto de hooks (ver estructura completa en archivo)
```

---

### FASE 2: Páginas Públicas (Días 2-4 - 24h)

#### **2.1 DirectorioMarketplacePage** (~280 líneas)

**Ruta:** `/marketplace`
**Archivo:** `frontend/src/pages/marketplace/DirectorioMarketplacePage.jsx`

**Componentes usados:**
- ✅ `Input` (búsqueda)
- ✅ `Select` (filtros ciudad/categoría)
- ✅ `Button` (limpiar filtros, paginación)
- 🆕 `DirectorioFiltros` (sidebar)
- 🆕 `DirectorioGrid` (grid de tarjetas)
- 🆕 `NegocioCard` (tarjeta de negocio)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Hero Section                                │
│  ┌─────────────────────────────────────┐    │
│  │ Encuentra el negocio perfecto        │    │
│  │ [Buscar por nombre o categoría...]   │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

┌─────────┬───────────────────────────────────┐
│ Filtros │  Grid de Negocios                 │
│         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│ Ciudad  │  │ N1 │ │ N2 │ │ N3 │ │ N4 │      │
│ ├─CDMX  │  └────┘ └────┘ └────┘ └────┘      │
│ └─GDL   │                                    │
│         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
│ Categ.  │  │ N5 │ │ N6 │ │ N7 │ │ N8 │      │
│ ├─Belleza│ └────┘ └────┘ └────┘ └────┘      │
│ └─Salud │                                    │
│         │  [<] Página 1 de 5 [>]             │
│ Rating  │                                    │
│ ★★★★★+  │                                    │
└─────────┴───────────────────────────────────┘
```

**Código estructura:**

```jsx
import { useState } from 'react';
import { usePerfilesMarketplace } from '@/hooks/useMarketplace';
import DirectorioFiltros from '@/components/marketplace/DirectorioFiltros';
import DirectorioGrid from '@/components/marketplace/DirectorioGrid';
import Input from '@/components/ui/Input';
import { Search } from 'lucide-react';

function DirectorioMarketplacePage() {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    ciudad: '',
    categoria: '',
    rating_min: '',
    pagina: 1,
    limite: 12,
  });

  const { data, isLoading, error } = usePerfilesMarketplace(filtros);

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value, pagina: 1 })); // Reset página
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ busqueda: '', ciudad: '', categoria: '', rating_min: '', pagina: 1, limite: 12 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Encuentra el negocio perfecto</h1>
          <p className="text-xl mb-8">
            Descubre los mejores profesionales cerca de ti
          </p>

          {/* Búsqueda principal */}
          <div className="max-w-2xl">
            <Input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              icon={<Search />}
              className="bg-white"
            />
          </div>
        </div>
      </section>

      {/* Directorio */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filtros */}
          <aside className="w-64 flex-shrink-0">
            <DirectorioFiltros
              filtros={filtros}
              onChange={handleFiltroChange}
              onLimpiar={handleLimpiarFiltros}
            />
          </aside>

          {/* Grid de Negocios */}
          <main className="flex-1">
            <DirectorioGrid
              perfiles={data?.perfiles}
              paginacion={data?.paginacion}
              isLoading={isLoading}
              error={error}
              onPageChange={(page) => handleFiltroChange('pagina', page)}
            />
          </main>
        </div>
      </section>
    </div>
  );
}

export default DirectorioMarketplacePage;
```

#### **2.2 PerfilPublicoPage** (~350 líneas)

**Ruta:** `/:slug`
**Archivo:** `frontend/src/pages/marketplace/PerfilPublicoPage.jsx`

**⚠️ CRÍTICO - SEO Meta Tags:**
- Usar `react-helmet-async` para meta tags dinámicos
- Title: `{nombre_negocio} - {ciudad} | Marketplace`
- Description: `descripcion_corta` (160 caracteres)
- Open Graph + Twitter Cards
- Schema.org LocalBusiness (JSON-LD)

**Componentes usados:**
- ✅ `Button` (CTAs)
- ✅ `Modal` (galería de fotos)
- 🆕 `SEOHead` (meta tags dinámicos)
- 🆕 `ReseñasSection` (lista reseñas)
- 🆕 `ReseñaCard` (tarjeta reseña)
- 🆕 `EstrellaRating` (5 estrellas)
- 🆕 `MapaUbicacion` (Google Maps)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [Foto Portada Full Width]                  │
│  ┌────┐                                      │
│  │Logo│  Nombre Negocio                      │
│  └────┘  ★★★★☆ 4.5 (23 reseñas)             │
└─────────────────────────────────────────────┘

┌─────────────────────┬───────────────────────┐
│ Contenido Principal │ Sidebar Contacto      │
│                     │                       │
│ Tabs:               │ 📞 (555) 123-4567     │
│ [Servicios] Info... │ 📧 contacto@negocio   │
│ [Profesionales]...  │ 🌐 sitio-web.com      │
│ [Reseñas]...        │ 📷 Instagram          │
│ [Ubicación]...      │ 📘 Facebook           │
│                     │                       │
│                     │ Horarios:             │
│                     │ Lun-Vie: 9AM - 6PM    │
│                     │                       │
│                     │ [Mapa Google Maps]    │
│                     │                       │
│ [📅 Agendar Cita]   │                       │
└─────────────────────┴───────────────────────┘
```

**Tracking Analytics:**

```jsx
import { useEffect } from 'react';
import { marketplaceApi } from '@/services/api/endpoints';

function PerfilPublicoPage() {
  const { slug } = useParams();
  const { data: perfil, isLoading } = usePerfilPublico(slug);

  // ✅ Tracking de vista (fire-and-forget)
  useEffect(() => {
    if (perfil?.id) {
      // NO usar await - fire-and-forget
      marketplaceApi.registrarEvento({
        perfil_id: perfil.id,
        tipo_evento: 'vista_perfil',
      }).catch(() => {}); // Ignorar errores de tracking
    }
  }, [perfil?.id]);

  const handleClickContacto = (tipo) => {
    // Tracking de clics en contacto
    marketplaceApi.registrarEvento({
      perfil_id: perfil.id,
      tipo_evento: `clic_${tipo}`, // clic_telefono, clic_sitio_web, etc.
    }).catch(() => {});
  };

  const handleClickAgendar = () => {
    marketplaceApi.registrarEvento({
      perfil_id: perfil.id,
      tipo_evento: 'clic_agendar',
    }).catch(() => {});

    navigate(`/agendar/${slug}`);
  };

  // ... resto del componente
}
```

#### **2.3 AgendarPublicoPage** (~400 líneas)

**Ruta:** `/agendar/:slug`
**Archivo:** `frontend/src/pages/marketplace/AgendarPublicoPage.jsx`

**Componentes usados:**
- ✅ `Button` (navegación stepper)
- ✅ `MultiSelect` (servicios)
- 🆕 `SelectorServicios` (grid de servicios con precios)
- 🆕 `SelectorFechaHora` (calendario + slots)
- 🆕 `FormularioDatosCliente` (nombre, teléfono, email)
- 🆕 `ResumenCita` (confirmación)

**Stepper 4 pasos:**

```
Paso 1: Servicios
┌─────────────────────────────────────┐
│ ¿Qué servicios necesitas?           │
│ ☑ Corte de Cabello      $150        │
│ ☐ Barba                 $80         │
│ ☑ Tinte                 $200        │
│                                     │
│ Total: $350 | Duración: 90 min      │
│ [Continuar →]                       │
└─────────────────────────────────────┘

Paso 2: Fecha/Hora
┌─────────────────────────────────────┐
│ Calendario    | Horarios Disponibles│
│ [Nov 2025]    | ┌──────────────┐    │
│  L  M  M  J  V│ │ 09:00 - 10:30│    │
│        1  2  3│ │ 11:00 - 12:30│    │
│  4  5 [6] 7  8│ │ 14:00 - 15:30│    │
│               │ │ 16:00 - 17:30│    │
│               │ └──────────────┘    │
│ [← Atrás] [Continuar →]             │
└─────────────────────────────────────┘

Paso 3: Tus Datos
┌─────────────────────────────────────┐
│ Nombre: [____________]              │
│ Teléfono: [____________]            │
│ Email: [____________]               │
│                                     │
│ [← Atrás] [Confirmar Cita]          │
└─────────────────────────────────────┘

Paso 4: Confirmación
┌─────────────────────────────────────┐
│ ✅ ¡Cita Agendada!                  │
│                                     │
│ Código: ABCD1234                    │
│ Fecha: 06/11/2025 09:00             │
│ Servicios: Corte + Tinte            │
│ Total: $350                         │
│                                     │
│ Te enviamos confirmación por email  │
│ [Volver al inicio]                  │
└─────────────────────────────────────┘
```

**⚠️ CRÍTICO - Creación Automática de Cliente:**

```jsx
const handleConfirmarCita = async () => {
  // Crear cliente automáticamente si no existe
  const clienteData = {
    nombre: formData.nombre,
    telefono: formData.telefono,
    email: formData.email,
  };

  // Backend crea cliente si no existe (por teléfono)
  const citaData = {
    profesional_id: selectedProfesional,
    servicios_ids: selectedServicios,
    fecha_cita: selectedFecha,
    hora_inicio: selectedHora,
    cliente: clienteData, // ⚠️ Backend busca/crea cliente
    notas: formData.notas,
  };

  await crearCitaMutation.mutateAsync(citaData);
};
```

---

### FASE 3: Panel Admin (Días 5-7 - 24h)

#### **3.1 MiMarketplacePage** (~320 líneas)

**Ruta:** `/mi-marketplace`
**Archivo:** `frontend/src/pages/marketplace/MiMarketplacePage.jsx`

**Componentes usados:**
- ✅ `Button` (guardar, preview)
- ✅ `Input`, `Select` (formulario)
- ✅ `Modal` (galería fotos)
- 🆕 `PerfilFormulario` (CRUD perfil)
- 🆕 `GaleriaFotos` (logo, portada, galería)
- 🆕 `PreviewPerfil` (iframe o componente)

**Tabs:**
```
┌─────────────────────────────────────┐
│ [Perfil] [Reseñas] [Analytics]      │
└─────────────────────────────────────┘

Tab "Perfil":
┌─────────────────────┬───────────────┐
│ Formulario          │ Preview       │
│                     │               │
│ Nombre Comercial:   │ [Simulación]  │
│ [___________]       │ ┌───────────┐ │
│                     │ │ Portada   │ │
│ Descripción Corta:  │ └───────────┘ │
│ [___________]       │ Nombre...     │
│                     │ ★★★★☆         │
│ Descripción Larga:  │               │
│ [___________]       │ Servicios...  │
│                     │               │
│ Ciudad: [CDMX ▼]    │               │
│ Categoría: [Belleza▼]│              │
│                     │               │
│ Contacto Público:   │               │
│ ☑ Teléfono          │               │
│ ☑ Email             │               │
│ ☑ Sitio Web         │               │
│                     │               │
│ Redes Sociales:     │               │
│ Instagram: [@___]   │               │
│ Facebook: [___]     │               │
│                     │               │
│ [Guardar Cambios]   │               │
│ [Vista Previa →]    │               │
└─────────────────────┴───────────────┘
```

#### **3.2 ReseñasMarketplacePage** (~250 líneas)

**Ruta:** `/mi-marketplace/resenas`
**Archivo:** `frontend/src/pages/marketplace/ReseñasMarketplacePage.jsx`

**Componentes usados:**
- ✅ `Button` (responder, moderar)
- ✅ `Select` (filtros)
- ✅ `Modal` (responder)
- 🆕 `ReseñaCard` (tarjeta reseña con respuesta)
- 🆕 `EstrellaRating` (readonly)

**Layout:**
```
┌─────────────────────────────────────┐
│ Filtros:                            │
│ Rating: [Todas ▼] | [Sin responder ▼]│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ★★★★★ Juan Pérez - 15/11/2025      │
│ "Excelente servicio, muy profesional"│
│                                     │
│ Tu respuesta: "¡Gracias Juan!"      │
│ [Moderar ▼]                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ★★★☆☆ María López - 14/11/2025     │
│ "Buen servicio pero caro"           │
│                                     │
│ [Responder]                         │
└─────────────────────────────────────┘
```

#### **3.3 AnalyticsMarketplacePage** (~280 líneas)

**Ruta:** `/mi-marketplace/analytics`
**Archivo:** `frontend/src/pages/marketplace/AnalyticsMarketplacePage.jsx`

**Dependencia:** `npm install chart.js react-chartjs-2`

**Componentes usados:**
- ✅ `Button` (exportar)
- ✅ `Select` (filtro fechas)
- 🆕 Componentes Chart.js (Bar, Line)

**Layout:**
```
┌──────────────────────────────────────┐
│ Filtro: [Última semana ▼] [Exportar]│
└──────────────────────────────────────┘

┌─────┬─────┬─────┬─────┬─────┬───────┐
│ 👁  │ 🖱  │ 📞 │ 📧 │ 🌐 │ 📅    │
│ 1.2K│ 45  │ 12 │ 8  │ 15 │ 5     │
│Vista│Clics│Tel │Mail│Web │Agendas│
└─────┴─────┴─────┴─────┴─────┴───────┘

┌──────────────────────────────────────┐
│ Vistas por Día                       │
│ [Gráfica de Barras Chart.js]         │
│   ┃                                  │
│200┃    ██                            │
│   ┃    ██  ██                        │
│100┃ ██ ██  ██ ██                     │
│   ┃ ██ ██  ██ ██ ██                  │
│  0┃─────────────────────────         │
│   └─L──M──X──J──V──S──D             │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Fuentes de Tráfico                   │
│ • Google: 45%                        │
│ • Directo: 30%                       │
│ • Redes Sociales: 15%                │
│ • Otros: 10%                         │
└──────────────────────────────────────┘
```

**⚠️ Datos de Gráfica (Chart.js):**

```jsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function GraficaVistas({ datos }) {
  const chartData = {
    labels: datos.map(d => d.fecha),
    datasets: [
      {
        label: 'Vistas',
        data: datos.map(d => d.total_vistas),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Vistas por Día' },
    },
  };

  return <Bar data={chartData} options={options} />;
}
```

---

### FASE 4: Componentes Marketplace (Días 8-10 - 24h)

#### **Lista de Componentes (15 totales)**

| Componente | Descripción | Líneas | Prioridad |
|------------|-------------|--------|-----------|
| **DirectorioFiltros** | Sidebar filtros (ciudad, categoría, rating) | ~120 | Alta |
| **DirectorioGrid** | Grid de tarjetas + paginación | ~180 | Alta |
| **NegocioCard** | Tarjeta de negocio (foto, nombre, rating) | ~100 | Alta |
| **SEOHead** | Meta tags dinámicos (react-helmet-async) | ~80 | Alta |
| **EstrellaRating** | Sistema 5 estrellas (readonly + editable) | ~90 | Alta |
| **ReseñasSection** | Lista de reseñas con paginación | ~150 | Media |
| **ReseñaCard** | Tarjeta reseña + respuesta | ~120 | Media |
| **MapaUbicacion** | Google Maps embebido | ~70 | Media |
| **SelectorServicios** | Grid servicios con multi-select | ~160 | Alta |
| **SelectorFechaHora** | Calendario + slots disponibles | ~250 | Alta |
| **FormularioDatosCliente** | Datos personales (nombre, tel, email) | ~110 | Alta |
| **ResumenCita** | Resumen confirmación cita | ~100 | Alta |
| **PerfilFormulario** | CRUD perfil marketplace | ~200 | Media |
| **GaleriaFotos** | Upload logo, portada, galería | ~180 | Baja |
| **PreviewPerfil** | Preview en tiempo real | ~140 | Baja |

**Total estimado:** ~1,850 líneas de componentes

#### **Componentes Clave - Ejemplos**

**EstrellaRating.jsx** (~90 líneas):

```jsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente de rating con estrellas
 * @param {number} rating - Rating actual (1-5)
 * @param {number} maxRating - Máximo rating (default: 5)
 * @param {boolean} readonly - Solo lectura (default: true)
 * @param {function} onChange - Callback al cambiar (solo si !readonly)
 * @param {string} size - Tamaño (sm, md, lg)
 */
function EstrellaRating({
  rating = 0,
  maxRating = 5,
  readonly = true,
  onChange,
  size = 'md'
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (index) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starIndex = index + 1;
        const isFilled = (hoverRating || rating) >= starIndex;

        return (
          <Star
            key={index}
            className={cn(
              sizes[size],
              'transition-colors',
              isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300',
              !readonly && 'cursor-pointer hover:scale-110'
            )}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => !readonly && setHoverRating(starIndex)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
          />
        );
      })}
      {rating > 0 && <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>}
    </div>
  );
}

export default EstrellaRating;
```

**SEOHead.jsx** (~80 líneas):

```jsx
import { Helmet } from 'react-helmet-async';

/**
 * Componente para meta tags SEO dinámicos
 * @param {Object} perfil - Datos del perfil
 */
function SEOHead({ perfil }) {
  const title = `${perfil.meta_titulo || perfil.nombre_comercial} - ${perfil.ciudad}`;
  const description = perfil.descripcion_corta || '';
  const url = `${window.location.origin}/${perfil.slug}`;
  const imageUrl = perfil.foto_portada || perfil.logo_url || '';

  // Schema.org LocalBusiness
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: perfil.nombre_comercial,
    description: perfil.descripcion_larga,
    image: imageUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: perfil.ciudad,
      addressCountry: perfil.pais,
    },
    telephone: perfil.telefono_publico,
    email: perfil.email_publico,
    url: perfil.sitio_web,
    aggregateRating: perfil.rating_promedio && {
      '@type': 'AggregateRating',
      ratingValue: perfil.rating_promedio,
      reviewCount: perfil.total_reseñas,
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="business.business" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}

export default SEOHead;
```

---

### FASE 5: Integración y Testing (Días 11-12 - 16h)

#### **5.1 Actualizar Router**

**Archivo:** `frontend/src/app/router.jsx`

```javascript
import { lazy } from 'react';

// ✅ Lazy loading marketplace pages
const DirectorioMarketplacePage = lazy(() => import('@/pages/marketplace/DirectorioMarketplacePage'));
const PerfilPublicoPage = lazy(() => import('@/pages/marketplace/PerfilPublicoPage'));
const AgendarPublicoPage = lazy(() => import('@/pages/marketplace/AgendarPublicoPage'));
const MiMarketplacePage = lazy(() => import('@/pages/marketplace/MiMarketplacePage'));

// ... en routes
const routes = [
  // ... rutas existentes

  // ========== MARKETPLACE - RUTAS PÚBLICAS ==========
  {
    path: '/marketplace',
    element: <DirectorioMarketplacePage />,
  },
  {
    path: '/agendar/:slug',
    element: <AgendarPublicoPage />,
  },

  // ========== MARKETPLACE - RUTAS PROTEGIDAS ==========
  {
    path: '/mi-marketplace',
    element: (
      <ProtectedRoute requiredRole={['admin', 'propietario']}>
        <MiMarketplacePage />
      </ProtectedRoute>
    ),
  },

  // ⚠️ IMPORTANTE: Ruta dinámica /:slug DEBE IR AL FINAL
  // para evitar colisiones con otras rutas
  {
    path: '/:slug',
    element: <PerfilPublicoPage />,
  },
];
```

#### **5.2 Actualizar Dashboard**

**Archivo:** `frontend/src/pages/dashboard/Dashboard.jsx`

```jsx
import { Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const { data: usuario } = useAuth(); // Hook existente

  // ... código existente

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cards existentes */}

      {/* ✅ Nuevo Card: Mi Marketplace */}
      {usuario?.organizacion?.tiene_perfil_marketplace && (
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/mi-marketplace')}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Store className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mi Marketplace</h3>
              <p className="text-sm text-gray-600">
                Gestiona tu perfil público
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

#### **5.3 Testing Manual (Checklist)**

**Rutas Públicas:**
- [ ] `/marketplace` - Directorio carga correctamente
- [ ] Filtros funcionan (ciudad, categoría, rating, búsqueda)
- [ ] Paginación funciona
- [ ] Clic en tarjeta → redirige a `/:slug`
- [ ] `/:slug` - Perfil carga con datos correctos
- [ ] SEO meta tags se renderizan (inspeccionar HTML)
- [ ] Analytics tracking se dispara (verificar en backend logs)
- [ ] Clics en contacto trackean correctamente
- [ ] `/agendar/:slug` - Stepper 4 pasos funciona
- [ ] Selección de servicios calcula total correcto
- [ ] Calendario muestra slots disponibles
- [ ] Formulario de datos valida campos
- [ ] Confirmación crea cita + cliente automáticamente

**Rutas Protegidas:**
- [ ] `/mi-marketplace` requiere autenticación
- [ ] Formulario CRUD carga datos existentes
- [ ] Actualizar perfil funciona (invalidación cache)
- [ ] Preview en tiempo real funciona
- [ ] Tab Reseñas lista reseñas correctas
- [ ] Responder reseña funciona
- [ ] Tab Analytics muestra métricas
- [ ] Gráfica Chart.js renderiza correctamente
- [ ] Filtro de fechas actualiza datos

**Casos Edge:**
- [ ] Perfil sin reseñas muestra mensaje vacío
- [ ] Perfil sin servicios muestra advertencia
- [ ] Error 404 si slug no existe
- [ ] Loading states en todas las queries
- [ ] Error states muestran mensajes amigables

---

## 📦 DEPENDENCIAS NPM

```bash
# Instalar dependencias necesarias
npm install react-helmet-async chart.js react-chartjs-2

# Ya instaladas (verificar):
# - @tanstack/react-query
# - axios
# - react-router-dom
# - framer-motion
# - lucide-react
```

---

## 🎯 MÉTRICAS DE ÉXITO

### Técnicas
- [ ] 0 errores de linting/TypeScript
- [ ] Todas las queries TanStack funcionan
- [ ] Invalidación de cache correcta
- [ ] Loading/error states en todos los componentes
- [ ] Responsive mobile-first
- [ ] Accesibilidad básica (ARIA labels)

### UX/Navegación
- [ ] Flujo público → agendamiento en ≤3 clics
- [ ] Breadcrumbs claros en panel admin
- [ ] Feedback visual en todas las acciones
- [ ] Tiempos de carga ≤2s (con cache)
- [ ] Mobile-friendly (touch targets ≥44px)

### SEO
- [ ] Meta tags dinámicos en todos los perfiles
- [ ] Schema.org LocalBusiness válido
- [ ] URLs canónicas configuradas
- [ ] Lighthouse SEO score ≥90

---

## 🚀 SIGUIENTE PASO INMEDIATO

### Día 1 - Configuración Base (4 horas)

1. **Crear estructura de directorios** (10 min)
   ```bash
   cd frontend/src
   mkdir -p pages/marketplace components/marketplace
   ```

2. **Extender API Client** (1h)
   - Editar `services/api/endpoints.js`
   - Agregar `marketplaceApi` (~150 líneas)
   - Actualizar export default

3. **Crear hook base** (2h)
   - Crear `hooks/useMarketplace.js`
   - Implementar 10 hooks (queries + mutations)
   - Testing básico con Postman

4. **Instalar dependencias** (10 min)
   ```bash
   npm install react-helmet-async chart.js react-chartjs-2
   ```

5. **Validación** (40 min)
   - Probar hooks con datos del backend
   - Verificar sanitización de params
   - Verificar invalidación de cache

**Output esperado:** API client + hooks funcionando, listos para consumir en páginas.

---

**Versión:** 1.0
**Última Actualización:** 18 Noviembre 2025
**Estado:** ✅ Plan Completo - Listo para Implementación
