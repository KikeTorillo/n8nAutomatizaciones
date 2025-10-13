# 🎯 Plan de Gestión de Clientes + Walk-in

**Fecha:** 12 Octubre 2025
**Estado:** 🚧 Por Implementar
**Responsable:** Equipo de Desarrollo
**Última Actualización:** 12 Octubre 2025 - 23:30h
**Versión:** 1.0

---

## 📋 Índice

1. [✅ Estado Actual del Backend](#-estado-actual-del-backend)
2. [🎯 Objetivos](#-objetivos)
3. [🗂 Arquitectura Frontend](#-arquitectura-frontend)
4. [👥 Módulo de Gestión de Clientes](#-módulo-de-gestión-de-clientes)
5. [⚡ Módulo de Walk-in](#-módulo-de-walk-in)
6. [💻 Guía de Implementación](#-guía-de-implementación)
7. [📋 Checklist de Implementación](#-checklist-de-implementación)
8. [✅ Criterios de Aceptación](#-criterios-de-aceptación)

---

## ✅ Estado Actual del Backend

### 🎉 Backend 100% Listo

**Endpoints de Clientes** (`/api/v1/clientes`):
- ✅ `POST /` - Crear cliente
- ✅ `GET /` - Listar clientes (con paginación, filtros, búsqueda)
- ✅ `GET /buscar` - Búsqueda general
- ✅ `GET /buscar-telefono` - Buscar por teléfono (útil para walk-in)
- ✅ `GET /buscar-nombre` - Buscar por nombre
- ✅ `GET /estadisticas` - Estadísticas de clientes
- ✅ `GET /:id` - Obtener cliente por ID
- ✅ `PUT /:id` - Actualizar cliente
- ✅ `PATCH /:id/estado` - Cambiar estado (activo/inactivo)
- ✅ `DELETE /:id` - Eliminar cliente (soft delete)

**Endpoints de Citas** (`/api/v1/citas`):
- ✅ `POST /walk-in` - 🌟 Crear cita walk-in (YA EXISTE)
- ✅ `GET /disponibilidad-inmediata` - Verificar disponibilidad inmediata
- ✅ `POST /` - Crear cita normal
- ✅ `GET /` - Listar citas
- ✅ `GET /:id` - Obtener cita
- ✅ `PUT /:id` - Actualizar cita
- ✅ `POST /:id/check-in` - Check-in del cliente
- ✅ `POST /:id/start-service` - Iniciar servicio
- ✅ `POST /:id/complete` - Completar cita

### 📊 Campos del Cliente (Schema)

**Campos Requeridos:**
- `nombre` (string, 2-150 caracteres)
- `telefono` (string, formato: +123 456-789, 7-20 dígitos)

**Campos Opcionales:**
- `email` (string, email válido)
- `fecha_nacimiento` (date, edad entre 5-120 años)
- `direccion` (string, max 500 caracteres)
- `notas_especiales` (string, max 1000 caracteres)
- `alergias` (string, max 1000 caracteres)
- `como_conocio` (string, max 100 caracteres)
- `marketing_permitido` (boolean, default: true)
- `profesional_preferido_id` (integer, ID del profesional)
- `activo` (boolean, default: true)

### 📊 Schema de Walk-in

**Campos esperados por `POST /walk-in`:**
```javascript
{
  cliente_id: number,          // ID de cliente existente
  servicio_id: number,         // ID del servicio
  profesional_id: number,      // ID del profesional
  fecha_cita: string,          // Fecha en formato YYYY-MM-DD
  hora_inicio: string,         // Hora en formato HH:mm
  notas: string,               // Opcional, notas de la cita
  origen: 'walk_in'            // Para identificar que es walk-in
}
```

### 🎯 Conclusión Backend

**Sin cambios necesarios en backend:**
- ✅ Todos los endpoints necesarios ya existen
- ✅ Tests backend: 481/482 (99.8%)
- ✅ Validaciones Joi completas
- ✅ RLS multi-tenant funcionando
- ✅ Búsqueda por teléfono optimizada para walk-in

---

## 🎯 Objetivos

### **Funcionalidades Clave**

1. **Gestión de Clientes (CRUD Completo)**
   - Lista de clientes con búsqueda y filtros
   - Crear nuevo cliente con formulario completo
   - Ver perfil detallado del cliente
   - Editar información del cliente
   - Desactivar/eliminar cliente
   - Estadísticas del cliente (total de citas, gasto promedio, etc.)

2. **Walk-in (Cita Rápida)**
   - Crear cita rápida en 3 pasos
   - Buscar cliente por teléfono o nombre
   - Opción: crear cliente nuevo en el mismo flujo
   - Seleccionar servicio y profesional
   - Ver disponibilidad inmediata
   - Crear cita y asignar al profesional

### **Flujos de Usuario**

#### **Flujo 1: Gestión de Clientes**
```
Usuario → Lista de Clientes → [Buscar/Filtrar] → Ver Perfil → [Editar/Eliminar]
                            ↓
                      [+ Nuevo Cliente] → Formulario → Guardar → Ver Perfil
```

#### **Flujo 2: Walk-in (Cliente Existente)**
```
Recepcionista → Walk-in → Buscar Cliente (por teléfono) → Cliente Encontrado
                                        ↓
                            Seleccionar Servicio → Seleccionar Profesional
                                        ↓
                            Ver Disponibilidad → Confirmar Cita → ✅ Cita Creada
```

#### **Flujo 3: Walk-in (Cliente Nuevo)**
```
Recepcionista → Walk-in → Buscar Cliente (por teléfono) → Cliente NO Encontrado
                                        ↓
                            [Crear Cliente Rápido] (solo nombre + teléfono)
                                        ↓
                            Seleccionar Servicio → Seleccionar Profesional
                                        ↓
                            Ver Disponibilidad → Confirmar Cita → ✅ Cita Creada
```

---

## 🗂 Arquitectura Frontend

### 📁 Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── clientes/
│   │   ├── ClientesPage.jsx              # Página principal con lista
│   │   ├── ClientePerfilPage.jsx         # Perfil detallado del cliente
│   │   ├── NuevoClientePage.jsx          # Formulario crear cliente
│   │   └── EditarClientePage.jsx         # Formulario editar cliente
│   │
│   └── walk-in/
│       ├── WalkInPage.jsx                # Página principal walk-in
│       └── components/
│           ├── BuscarClienteStep.jsx     # Paso 1: Buscar/Crear cliente
│           ├── SeleccionarServicioStep.jsx  # Paso 2: Seleccionar servicio
│           └── ConfirmarCitaStep.jsx     # Paso 3: Confirmar cita
│
├── components/
│   ├── clientes/
│   │   ├── ClienteCard.jsx               # Card de cliente en lista
│   │   ├── ClienteTable.jsx              # Tabla de clientes
│   │   ├── ClienteForm.jsx               # Formulario reutilizable
│   │   ├── ClienteSearchBar.jsx          # Barra de búsqueda
│   │   ├── ClienteFilters.jsx            # Filtros (activo, marketing, etc.)
│   │   ├── ClienteStats.jsx              # Estadísticas del cliente
│   │   └── ClienteHistorialCitas.jsx     # Historial de citas del cliente
│   │
│   └── walk-in/
│       ├── DisponibilidadInmediata.jsx   # Mostrar slots disponibles
│       ├── SeleccionRapida.jsx           # Selector rápido de profesional/servicio
│       └── ResumenCita.jsx               # Resumen antes de confirmar
│
├── hooks/
│   ├── useClientes.js                    # Hooks para clientes
│   ├── useWalkIn.js                      # Hooks para walk-in
│   └── useDisponibilidad.js              # Hook para verificar disponibilidad
│
├── services/api/
│   └── endpoints.js                      # Agregar endpoints de clientes y walk-in
│
└── lib/
    └── validations.js                    # Schemas Zod para validación
```

---

## 👥 Módulo de Gestión de Clientes

### 🎨 1. Página Principal: Lista de Clientes

**Componente:** `ClientesPage.jsx`

**Funcionalidades:**
- Tabla/lista de clientes con paginación
- Barra de búsqueda en tiempo real (nombre, email, teléfono)
- Filtros:
  - Activo/Inactivo
  - Marketing permitido
  - Profesional preferido
- Ordenamiento por: nombre, email, fecha creación
- Acciones rápidas: Ver perfil, Editar, Eliminar
- Botón "Nuevo Cliente"

**Estado visual:**
```
┌────────────────────────────────────────────────────────┐
│  Clientes (Total: 125)             [+ Nuevo Cliente]  │
├────────────────────────────────────────────────────────┤
│  🔍 Buscar clientes...                                 │
│  [Filtros: Todos ▼] [Ordenar: Nombre ▼]               │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │ 👤 Juan Pérez                                    │ │
│  │ 📧 juan@email.com  📞 +52 55 1234 5678           │ │
│  │ ℹ️  5 citas | Última: 10 Oct 2025                │ │
│  │ [Ver Perfil] [Editar] [Eliminar]                 │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 👤 María González                                │ │
│  │ 📧 maria@email.com  📞 +52 55 9876 5432          │ │
│  │ ℹ️  12 citas | Última: 09 Oct 2025               │ │
│  │ [Ver Perfil] [Editar] [Eliminar]                 │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ← Anterior    Página 1 de 10    Siguiente →         │
└────────────────────────────────────────────────────────┘
```

---

### 👤 2. Perfil del Cliente

**Componente:** `ClientePerfilPage.jsx`

**Funcionalidades:**
- Información personal completa
- Estadísticas del cliente:
  - Total de citas
  - Última cita
  - Servicios más solicitados
  - Profesional preferido
  - Total gastado
- Historial de citas (timeline)
- Notas especiales y alergias destacadas
- Botones: Editar, Eliminar, Nueva Cita

**Estado visual:**
```
┌────────────────────────────────────────────────────────┐
│  ← Volver a Clientes                    [Editar]      │
├────────────────────────────────────────────────────────┤
│  👤 Juan Pérez                                         │
│  📧 juan@email.com                                     │
│  📞 +52 55 1234 5678                                   │
│  🎂 35 años (15/03/1990)                               │
│  📍 Av. Insurgentes 123, CDMX                          │
│                                                        │
│  ⚠️  Alergias: Polen, fresas                          │
│  📝 Notas: Cliente VIP, prefiere horarios matutinos   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📊 Estadísticas                                │   │
│  │ • Total de Citas: 12                           │   │
│  │ • Última Cita: 10 Oct 2025                     │   │
│  │ • Servicio Favorito: Corte + Barba             │   │
│  │ • Profesional Preferido: Carlos Rodríguez      │   │
│  │ • Total Gastado: $1,800 MXN                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  📅 Historial de Citas (últimas 5)                    │
│  ┌────────────────────────────────────────────────┐   │
│  │ ✅ 10 Oct 2025 - Corte + Barba - Carlos        │   │
│  │ ✅ 25 Sep 2025 - Corte Clásico - Carlos        │   │
│  │ ❌ 12 Sep 2025 - Corte + Barba - Cancelada     │   │
│  │ ✅ 05 Sep 2025 - Corte Clásico - Carlos        │   │
│  │ ✅ 20 Ago 2025 - Corte + Barba - Carlos        │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [Nueva Cita]  [Editar Cliente]  [Eliminar Cliente]  │
└────────────────────────────────────────────────────────┘
```

---

### ✏️ 3. Formulario de Cliente

**Componentes:** `NuevoClientePage.jsx` / `EditarClientePage.jsx`

**Funcionalidades:**
- Formulario con validación en tiempo real (Zod)
- Campos requeridos marcados con *
- Validación de email único
- Validación de teléfono (formato internacional)
- Validación de edad (5-120 años)
- Checkbox: Marketing permitido
- Selector: Profesional preferido
- Botones: Guardar, Cancelar

**Estado visual:**
```
┌────────────────────────────────────────────────────────┐
│  ← Volver                                              │
│  Nuevo Cliente                                         │
├────────────────────────────────────────────────────────┤
│  Información Personal                                  │
│  ┌────────────────────────────────────────────────┐   │
│  │ Nombre Completo *                              │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Teléfono * (Formato: +52 55 1234 5678)        │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Email (Opcional)                               │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Fecha de Nacimiento (Opcional)                 │   │
│  │ [__/__/____]                                   │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Dirección (Opcional)                           │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Información Adicional                                 │
│  ┌────────────────────────────────────────────────┐   │
│  │ Notas Especiales                               │   │
│  │ [___________________________________]          │   │
│  │ [___________________________________]          │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Alergias                                       │   │
│  │ [___________________________________]          │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ ¿Cómo nos conoció?                             │   │
│  │ [Redes sociales ▼]                             │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Profesional Preferido (Opcional)               │   │
│  │ [Seleccionar profesional ▼]                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ☐ Acepto recibir información de marketing            │
│                                                        │
│  [Cancelar]                         [Guardar Cliente] │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Módulo de Walk-in

### 🎯 Objetivo del Walk-in

Permitir a recepcionistas crear citas rápidas para clientes que llegan sin cita previa, en **3 pasos simples**:
1. Buscar/Crear cliente
2. Seleccionar servicio y profesional
3. Confirmar cita

---

### 📱 Página Principal: Walk-in

**Componente:** `WalkInPage.jsx`

**Flujo de 3 Pasos:**

#### **Paso 1: Buscar Cliente**

**Componente:** `BuscarClienteStep.jsx`

```
┌────────────────────────────────────────────────────────┐
│  Walk-in: Nueva Cita Rápida               Paso 1 de 3 │
├────────────────────────────────────────────────────────┤
│  Buscar Cliente                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📞 Buscar por teléfono                         │   │
│  │ [+52 ___________________]       [Buscar]       │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  o                                                     │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ 👤 Buscar por nombre                           │   │
│  │ [________________________]      [Buscar]       │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ──────────────────────────────────────────────────   │
│                                                        │
│  Resultado de búsqueda:                                │
│  ┌────────────────────────────────────────────────┐   │
│  │ ✅ Cliente encontrado                          │   │
│  │ 👤 Juan Pérez                                  │   │
│  │ 📞 +52 55 1234 5678                            │   │
│  │ 📧 juan@email.com                              │   │
│  │ ℹ️  Última cita: 10 Oct 2025                   │   │
│  │                                                │   │
│  │ [Seleccionar este Cliente]                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  o                                                     │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ ❌ Cliente no encontrado                       │   │
│  │ ¿Deseas crear un nuevo cliente?               │   │
│  │                                                │   │
│  │ [+ Crear Cliente Nuevo]                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [Cancelar]                              [Continuar →]│
└────────────────────────────────────────────────────────┘
```

**Si cliente no existe, mostrar formulario rápido:**
```
┌────────────────────────────────────────────────────────┐
│  Crear Cliente Rápido                                  │
│  ┌────────────────────────────────────────────────┐   │
│  │ Nombre Completo *                              │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Teléfono * (ya precompletado)                  │   │
│  │ [+52 55 1234 5678]                             │   │
│  └────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────┐   │
│  │ Email (Opcional)                               │   │
│  │ [________________________]                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ℹ️  Podrás completar más información después         │
│                                                        │
│  [Cancelar]                    [Crear y Continuar →]  │
└────────────────────────────────────────────────────────┘
```

---

#### **Paso 2: Seleccionar Servicio y Profesional**

**Componente:** `SeleccionarServicioStep.jsx`

```
┌────────────────────────────────────────────────────────┐
│  Walk-in: Nueva Cita Rápida               Paso 2 de 3 │
├────────────────────────────────────────────────────────┤
│  Cliente: Juan Pérez (+52 55 1234 5678)               │
├────────────────────────────────────────────────────────┤
│  Seleccionar Servicio                                  │
│  ┌────────────────────────────────────────────────┐   │
│  │ [ ] Corte Clásico         $150 | 30 min       │   │
│  │ [ ] Corte + Barba         $250 | 45 min       │   │
│  │ [✓] Corte + Lavado        $200 | 40 min       │   │
│  │ [ ] Afeitado              $100 | 20 min       │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Seleccionar Profesional                               │
│  ┌────────────────────────────────────────────────┐   │
│  │ [ ] Carlos Rodríguez (Barbero)                │   │
│  │     ✅ Disponible ahora                        │   │
│  │                                                │   │
│  │ [✓] Miguel Ángel (Barbero)                    │   │
│  │     ✅ Disponible ahora                        │   │
│  │                                                │   │
│  │ [ ] Luis García (Barbero)                     │   │
│  │     ⏰ Disponible en 30 min                    │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [← Atrás]                             [Continuar →]  │
└────────────────────────────────────────────────────────┘
```

---

#### **Paso 3: Confirmar Cita**

**Componente:** `ConfirmarCitaStep.jsx`

```
┌────────────────────────────────────────────────────────┐
│  Walk-in: Nueva Cita Rápida               Paso 3 de 3 │
├────────────────────────────────────────────────────────┤
│  Confirmar Cita                                        │
│                                                        │
│  👤 Cliente:                                           │
│     Juan Pérez                                         │
│     +52 55 1234 5678                                   │
│                                                        │
│  ✂️  Servicio:                                         │
│     Corte + Lavado                                     │
│     Duración: 40 min                                   │
│     Precio: $200 MXN                                   │
│                                                        │
│  👨‍💼 Profesional:                                       │
│     Miguel Ángel                                       │
│                                                        │
│  📅 Fecha y Hora:                                      │
│     Hoy, 12 Octubre 2025                               │
│     14:30 - 15:10                                      │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ Notas de la cita (Opcional)                    │   │
│  │ [___________________________________]          │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ℹ️  La cita se creará inmediatamente                 │
│                                                        │
│  [← Atrás]                     [✅ Crear Cita Walk-in]│
└────────────────────────────────────────────────────────┘
```

**Después de crear:**
```
┌────────────────────────────────────────────────────────┐
│  ✅ ¡Cita Walk-in Creada Exitosamente!                │
├────────────────────────────────────────────────────────┤
│  Código de Cita: ORG001-20251012-042                  │
│                                                        │
│  Cliente: Juan Pérez                                   │
│  Servicio: Corte + Lavado                             │
│  Profesional: Miguel Ángel                            │
│  Hora: 14:30 - 15:10                                  │
│                                                        │
│  [Ver Cita en Calendario]      [Crear Otra Walk-in]   │
└────────────────────────────────────────────────────────┘
```

---

## 💻 Guía de Implementación

### 📝 1. Configuración de API Endpoints

**Archivo:** `services/api/endpoints.js`

```javascript
import apiClient from './client';

// ===== Clientes =====
export const clientesApi = {
  // Listar clientes con paginación y filtros
  listar: async (params = {}) => {
    const response = await apiClient.get('/clientes', { params });
    return response.data.data;
  },

  // Crear cliente
  crear: async (data) => {
    // ⚠️ Sanitizar campos opcionales
    const sanitizedData = {
      ...data,
      email: data.email?.trim() || undefined,
      direccion: data.direccion?.trim() || undefined,
      notas_especiales: data.notas_especiales?.trim() || undefined,
      alergias: data.alergias?.trim() || undefined,
      como_conocio: data.como_conocio?.trim() || undefined,
    };
    const response = await apiClient.post('/clientes', sanitizedData);
    return response.data.data;
  },

  // Obtener cliente por ID
  obtenerPorId: async (id) => {
    const response = await apiClient.get(`/clientes/${id}`);
    return response.data.data;
  },

  // Actualizar cliente
  actualizar: async (id, data) => {
    const sanitizedData = {
      ...data,
      email: data.email?.trim() || undefined,
      direccion: data.direccion?.trim() || undefined,
      notas_especiales: data.notas_especiales?.trim() || undefined,
      alergias: data.alergias?.trim() || undefined,
      como_conocio: data.como_conocio?.trim() || undefined,
    };
    const response = await apiClient.put(`/clientes/${id}`, sanitizedData);
    return response.data.data;
  },

  // Eliminar cliente
  eliminar: async (id) => {
    const response = await apiClient.delete(`/clientes/${id}`);
    return response.data;
  },

  // Buscar cliente por teléfono (para walk-in)
  buscarPorTelefono: async (telefono, params = {}) => {
    const response = await apiClient.get('/clientes/buscar-telefono', {
      params: { telefono, ...params }
    });
    return response.data.data;
  },

  // Buscar cliente por nombre
  buscarPorNombre: async (nombre, params = {}) => {
    const response = await apiClient.get('/clientes/buscar-nombre', {
      params: { nombre, ...params }
    });
    return response.data.data;
  },

  // Búsqueda general
  buscar: async (query, params = {}) => {
    const response = await apiClient.get('/clientes/buscar', {
      params: { q: query, ...params }
    });
    return response.data.data;
  },

  // Estadísticas del cliente
  estadisticas: async () => {
    const response = await apiClient.get('/clientes/estadisticas');
    return response.data.data;
  }
};

// ===== Walk-in =====
export const walkInApi = {
  // Crear cita walk-in
  crear: async (data) => {
    const response = await apiClient.post('/citas/walk-in', {
      ...data,
      origen: 'walk_in'
    });
    return response.data.data;
  },

  // Verificar disponibilidad inmediata
  disponibilidadInmediata: async (params) => {
    const response = await apiClient.get('/citas/disponibilidad-inmediata', {
      params
    });
    return response.data.data;
  }
};
```

---

### 🎣 2. Custom Hooks

#### **Hook: useClientes**

**Archivo:** `hooks/useClientes.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '@/services/api/endpoints';

export function useClientes(params = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => clientesApi.listar(params),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCliente(id) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.obtenerPorId(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientesApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useActualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => clientesApi.actualizar(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}

export function useEliminarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientesApi.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useBuscarClientePorTelefono() {
  return useMutation({
    mutationFn: (telefono) => clientesApi.buscarPorTelefono(telefono),
  });
}
```

---

#### **Hook: useWalkIn**

**Archivo:** `hooks/useWalkIn.js`

```javascript
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walkInApi, clientesApi } from '@/services/api/endpoints';

export function useWalkIn() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [walkInData, setWalkInData] = useState({
    cliente: null,
    servicio: null,
    profesional: null,
    fecha_cita: new Date().toISOString().split('T')[0], // Hoy
    hora_inicio: null,
    notas: ''
  });

  // Mutation para crear cliente rápido (en el flujo walk-in)
  const crearClienteMutation = useMutation({
    mutationFn: clientesApi.crear,
    onSuccess: (data) => {
      setWalkInData((prev) => ({ ...prev, cliente: data }));
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });

  // Mutation para crear cita walk-in
  const crearCitaMutation = useMutation({
    mutationFn: walkInApi.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      // Reset walk-in data
      resetWalkIn();
    }
  });

  const updateWalkInData = (key, value) => {
    setWalkInData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetWalkIn = () => {
    setCurrentStep(1);
    setWalkInData({
      cliente: null,
      servicio: null,
      profesional: null,
      fecha_cita: new Date().toISOString().split('T')[0],
      hora_inicio: null,
      notas: ''
    });
  };

  const confirmarCita = () => {
    return crearCitaMutation.mutate({
      cliente_id: walkInData.cliente.id,
      servicio_id: walkInData.servicio.id,
      profesional_id: walkInData.profesional.id,
      fecha_cita: walkInData.fecha_cita,
      hora_inicio: walkInData.hora_inicio,
      notas: walkInData.notas,
      origen: 'walk_in'
    });
  };

  return {
    currentStep,
    walkInData,
    updateWalkInData,
    nextStep,
    prevStep,
    resetWalkIn,
    confirmarCita,
    crearClienteMutation,
    crearCitaMutation
  };
}
```

---

### 📋 3. Validaciones con Zod

**Archivo:** `lib/validations.js`

```javascript
import { z } from 'zod';

// ===== Validación de Cliente =====
export const clienteSchema = z.object({
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(150, 'Nombre no puede exceder 150 caracteres')
    .trim(),

  telefono: z.string()
    .regex(/^[+]?[0-9\s\-\(\)]{7,20}$/, 'Teléfono debe ser un número válido (7-20 dígitos)'),

  email: z.string()
    .email('Email no válido')
    .max(150)
    .optional()
    .or(z.literal('')),

  fecha_nacimiento: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true;
      const fecha = new Date(val);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      return edad >= 5 && edad <= 120;
    }, 'Edad debe estar entre 5 y 120 años'),

  direccion: z.string()
    .max(500, 'Dirección no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),

  notas_especiales: z.string()
    .max(1000, 'Notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),

  alergias: z.string()
    .max(1000, 'Alergias no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),

  como_conocio: z.string()
    .max(100, 'Campo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  marketing_permitido: z.boolean().default(true),

  profesional_preferido_id: z.number().optional(),

  activo: z.boolean().default(true)
});

// ===== Validación de Walk-in (Cliente Rápido) =====
export const clienteRapidoSchema = z.object({
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(150)
    .trim(),

  telefono: z.string()
    .regex(/^[+]?[0-9\s\-\(\)]{7,20}$/, 'Teléfono debe ser un número válido'),

  email: z.string()
    .email('Email no válido')
    .optional()
    .or(z.literal('')),
});
```

---

## 📋 Checklist de Implementación

### 🎨 Frontend - Gestión de Clientes

#### Estructura y Navegación
- [ ] Crear página `ClientesPage.jsx` (lista principal)
- [ ] Crear página `ClientePerfilPage.jsx` (perfil detallado)
- [ ] Crear página `NuevoClientePage.jsx` (crear cliente)
- [ ] Crear página `EditarClientePage.jsx` (editar cliente)
- [ ] Agregar ruta `/clientes` en router
- [ ] Agregar ruta `/clientes/:id` en router
- [ ] Agregar ruta `/clientes/nuevo` en router
- [ ] Agregar ruta `/clientes/:id/editar` en router
- [ ] Agregar link "Clientes" en menú principal

#### Componentes
- [ ] Crear `ClienteCard.jsx` (card de cliente)
- [ ] Crear `ClienteTable.jsx` (tabla de clientes)
- [ ] Crear `ClienteForm.jsx` (formulario reutilizable)
- [ ] Crear `ClienteSearchBar.jsx` (barra de búsqueda)
- [ ] Crear `ClienteFilters.jsx` (filtros)
- [ ] Crear `ClienteStats.jsx` (estadísticas del cliente)
- [ ] Crear `ClienteHistorialCitas.jsx` (historial de citas)

#### API y Estado
- [ ] Agregar endpoints de clientes en `services/api/endpoints.js`
- [ ] Implementar `useClientes()` hook
- [ ] Implementar `useCliente(id)` hook
- [ ] Implementar `useCrearCliente()` hook
- [ ] Implementar `useActualizarCliente()` hook
- [ ] Implementar `useEliminarCliente()` hook
- [ ] Implementar `useBuscarClientePorTelefono()` hook

#### Funcionalidades
- [ ] Lista de clientes con paginación
- [ ] Búsqueda en tiempo real (nombre, email, teléfono)
- [ ] Filtros (activo, marketing permitido)
- [ ] Ordenamiento (nombre, fecha, etc.)
- [ ] Ver perfil completo del cliente
- [ ] Crear nuevo cliente con validación
- [ ] Editar cliente existente
- [ ] Eliminar cliente (soft delete)
- [ ] Mostrar estadísticas del cliente
- [ ] Mostrar historial de citas del cliente

#### Validaciones
- [ ] Crear `clienteSchema` en `lib/validations.js`
- [ ] Validar nombre (2-150 caracteres)
- [ ] Validar teléfono (formato internacional)
- [ ] Validar email único
- [ ] Validar edad (5-120 años)
- [ ] Sanitizar campos opcionales antes de enviar

---

### ⚡ Frontend - Walk-in

#### Estructura y Navegación
- [ ] Crear página `WalkInPage.jsx` (wizard de 3 pasos)
- [ ] Agregar ruta `/walk-in` en router
- [ ] Agregar botón "Walk-in" destacado en dashboard
- [ ] Agregar link "Walk-in" en menú principal

#### Componentes de Pasos
- [ ] Crear `BuscarClienteStep.jsx` (Paso 1)
  - [ ] Buscar por teléfono
  - [ ] Buscar por nombre
  - [ ] Mostrar resultados de búsqueda
  - [ ] Formulario crear cliente rápido (si no existe)
- [ ] Crear `SeleccionarServicioStep.jsx` (Paso 2)
  - [ ] Lista de servicios con radio buttons
  - [ ] Lista de profesionales disponibles
  - [ ] Indicador de disponibilidad inmediata
- [ ] Crear `ConfirmarCitaStep.jsx` (Paso 3)
  - [ ] Resumen de la cita
  - [ ] Campo de notas opcional
  - [ ] Botón confirmar

#### Componentes Auxiliares
- [ ] Crear `DisponibilidadInmediata.jsx` (slots disponibles)
- [ ] Crear `SeleccionRapida.jsx` (selector rápido)
- [ ] Crear `ResumenCita.jsx` (resumen antes de confirmar)

#### API y Estado
- [ ] Agregar endpoints de walk-in en `services/api/endpoints.js`
  - [ ] `POST /citas/walk-in`
  - [ ] `GET /citas/disponibilidad-inmediata`
- [ ] Implementar `useWalkIn()` hook
- [ ] Implementar `useDisponibilidad()` hook

#### Funcionalidades
- [ ] Paso 1: Buscar cliente por teléfono
- [ ] Paso 1: Buscar cliente por nombre
- [ ] Paso 1: Crear cliente rápido (solo nombre + teléfono)
- [ ] Paso 2: Listar servicios activos
- [ ] Paso 2: Listar profesionales disponibles
- [ ] Paso 2: Verificar disponibilidad inmediata
- [ ] Paso 3: Mostrar resumen completo
- [ ] Paso 3: Campo de notas opcionales
- [ ] Crear cita walk-in al confirmar
- [ ] Mostrar mensaje de éxito con código de cita
- [ ] Opción "Crear otra walk-in"
- [ ] Opción "Ver cita en calendario"

#### Validaciones
- [ ] Crear `clienteRapidoSchema` en `lib/validations.js`
- [ ] Validar selección de servicio
- [ ] Validar selección de profesional
- [ ] Validar disponibilidad antes de confirmar

---

### 🎨 UX/UI

#### Diseño
- [ ] Diseñar componentes con Tailwind CSS
- [ ] Estados de loading (skeletons)
- [ ] Estados de error (mensajes claros)
- [ ] Estados vacíos (empty states)
- [ ] Animaciones de transición entre pasos
- [ ] Responsive design (mobile-first)

#### Accesibilidad
- [ ] ARIA labels en formularios
- [ ] Navegación por teclado
- [ ] Contraste de colores WCAG AA
- [ ] Focus states visibles

#### Feedback Visual
- [ ] Toasts de éxito/error
- [ ] Confirmaciones de eliminación
- [ ] Loading spinners en botones
- [ ] Validación en tiempo real en formularios

---

### 🧪 Testing

#### Tests Unitarios (Vitest)
- [ ] Tests de `clienteSchema` validación
- [ ] Tests de `useClientes` hook
- [ ] Tests de `useWalkIn` hook
- [ ] Tests de componentes de formulario

#### Tests de Integración
- [ ] Test de flujo completo de crear cliente
- [ ] Test de flujo completo de walk-in (cliente existente)
- [ ] Test de flujo completo de walk-in (cliente nuevo)
- [ ] Test de búsqueda de clientes

#### Tests E2E (Cypress/Playwright)
- [ ] E2E: Crear cliente desde cero
- [ ] E2E: Walk-in con cliente existente
- [ ] E2E: Walk-in con cliente nuevo
- [ ] E2E: Editar cliente existente
- [ ] E2E: Eliminar cliente

---

## ✅ Criterios de Aceptación

### Gestión de Clientes

#### Lista de Clientes
- [ ] Usuario puede ver lista de clientes con paginación
- [ ] Usuario puede buscar clientes por nombre, email o teléfono
- [ ] Usuario puede filtrar por activo/inactivo
- [ ] Usuario puede ordenar por nombre, email, fecha creación
- [ ] Click en cliente abre perfil detallado

#### Crear Cliente
- [ ] Usuario puede acceder a formulario de nuevo cliente
- [ ] Validación en tiempo real de todos los campos
- [ ] Backend retorna 400 si email está duplicado
- [ ] Backend retorna 400 si teléfono está duplicado
- [ ] Éxito: redirige a perfil del cliente creado
- [ ] Toast de confirmación: "Cliente creado exitosamente"

#### Ver Perfil
- [ ] Muestra información personal completa
- [ ] Muestra estadísticas (total citas, última cita, gasto total)
- [ ] Muestra historial de citas (últimas 10)
- [ ] Muestra alergias destacadas (si existen)
- [ ] Muestra notas especiales (si existen)
- [ ] Botón "Editar" lleva a formulario de edición
- [ ] Botón "Nueva Cita" abre modal de crear cita

#### Editar Cliente
- [ ] Formulario precargado con datos actuales
- [ ] Validación en tiempo real
- [ ] Éxito: actualiza perfil y muestra toast
- [ ] Error: muestra mensaje de error claro

#### Eliminar Cliente
- [ ] Confirmación antes de eliminar
- [ ] Solo admin puede eliminar
- [ ] Soft delete (activo = false)
- [ ] Toast de confirmación: "Cliente eliminado"

---

### Walk-in

#### Paso 1: Buscar Cliente
- [ ] Usuario puede buscar por teléfono (formato internacional)
- [ ] Usuario puede buscar por nombre (min 2 caracteres)
- [ ] Si cliente existe: muestra tarjeta con info
- [ ] Si cliente NO existe: muestra opción de crear
- [ ] Formulario rápido solo pide nombre + teléfono + email (opcional)
- [ ] Crear cliente rápido guarda en BD y avanza a paso 2

#### Paso 2: Seleccionar Servicio y Profesional
- [ ] Muestra lista de servicios activos
- [ ] Muestra precio y duración de cada servicio
- [ ] Muestra lista de profesionales activos
- [ ] Indica disponibilidad inmediata de cada profesional
- [ ] No permite continuar sin seleccionar servicio y profesional

#### Paso 3: Confirmar Cita
- [ ] Muestra resumen completo (cliente, servicio, profesional, fecha/hora)
- [ ] Muestra precio total
- [ ] Permite agregar notas opcionales
- [ ] Botón "Crear Cita Walk-in" llama a endpoint
- [ ] Éxito: muestra mensaje con código de cita
- [ ] Opciones: "Ver en Calendario" o "Crear Otra Walk-in"

#### Flujo Completo
- [ ] Usuario puede retroceder en cualquier paso
- [ ] Datos se mantienen al retroceder
- [ ] Al cancelar: muestra confirmación
- [ ] Al completar: limpia wizard y permite crear otra

---

### Performance

- [ ] Lista de clientes carga en < 2 segundos
- [ ] Búsqueda de clientes es instantánea (< 500ms)
- [ ] Walk-in completo toma < 30 segundos
- [ ] Sin memory leaks en navegación entre páginas

---

### Accesibilidad

- [ ] Navegación por teclado funciona en todos los formularios
- [ ] Screen readers pueden leer toda la información
- [ ] Contraste de colores cumple WCAG AA
- [ ] Mensajes de error son claros y accesibles

---

## 🎉 Conclusión

### Resumen del Plan

Este plan proporciona una guía completa para implementar:

1. **Gestión de Clientes:**
   - CRUD completo con validaciones
   - Búsqueda y filtros avanzados
   - Perfil detallado con estadísticas
   - Historial de citas

2. **Walk-in:**
   - Wizard de 3 pasos intuitivo
   - Búsqueda rápida de clientes
   - Creación de cliente en el mismo flujo
   - Verificación de disponibilidad inmediata
   - Creación de cita walk-in

### Prioridades de Implementación

**Fase 1: Base (Semana 1)**
1. API endpoints en `services/api/endpoints.js`
2. Hooks: `useClientes`, `useWalkIn`
3. Validaciones con Zod
4. Lista básica de clientes
5. Formulario de crear cliente

**Fase 2: Funcionalidades Core (Semana 2)**
6. Perfil detallado del cliente
7. Editar/eliminar cliente
8. Walk-in Paso 1 (buscar/crear cliente)
9. Walk-in Paso 2 (seleccionar servicio/profesional)
10. Walk-in Paso 3 (confirmar cita)

**Fase 3: Polish y Tests (Semana 3)**
11. Estadísticas del cliente
12. Historial de citas
13. Filtros avanzados
14. Tests unitarios
15. Tests E2E

---

**Última actualización:** 12 Octubre 2025 - 23:45h
**Versión:** 1.0
**Estado:** 🚧 Listo para Implementar
**Siguiente Paso:** Comenzar con Fase 1 - Configuración de API y Hooks

**Documentos de Referencia:**
- Backend Tests Clientes: `/backend/app/__tests__/endpoints/clientes.test.js`
- Backend Tests Citas: `/backend/app/__tests__/endpoints/citas.test.js`
- CLAUDE.md: `/CLAUDE.md` (guía general del proyecto)
- Schemas Backend: `/backend/app/schemas/cliente.schemas.js`
