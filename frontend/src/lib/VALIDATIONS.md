# Validaciones Zod - Guía de Uso

**Última actualización**: Enero 2026

Esta documentación cubre los helpers de validación centralizados en `validations.js` y las constantes de mensajes en `validationMessages.js`.

---

## Índice

1. [Helpers Disponibles](#helpers-disponibles)
2. [Mensajes de Validación](#mensajes-de-validación)
3. [Ejemplos de Uso](#ejemplos-de-uso)
4. [Patrones Comunes](#patrones-comunes)
5. [Migración de Schemas Locales](#migración-de-schemas-locales)

---

## Helpers Disponibles

### Strings

| Helper | Descripción | Ejemplo |
|--------|-------------|---------|
| `requiredString(label, min, max)` | String requerido con trim | `requiredString('Nombre', 2, 100)` |
| `optionalString(label, min, max)` | String opcional, convierte "" a undefined | `optionalString('Descripción', 0, 500)` |
| `categoryField(label, min, max)` | Nombre corto con trim (default 2-50) | `categoryField('Categoría')` |
| `longDescriptionField(label, max)` | Descripción larga opcional (default 1000) | `longDescriptionField('Notas', 2000)` |

### Números

| Helper | Descripción | Ejemplo |
|--------|-------------|---------|
| `optionalNumber()` | Número opcional (maneja "" como undefined) | `optionalNumber()` |
| `requiredPositiveNumber(label)` | Número requerido > 0 | `requiredPositiveNumber('Cantidad')` |
| `requiredNonNegativeNumber(label)` | Número requerido >= 0 | `requiredNonNegativeNumber('Stock')` |
| `priceField(label, required)` | Precio con 2 decimales, no negativo | `priceField('Precio', true)` |
| `percentageField(label, required)` | Porcentaje 0-100 | `percentageField('Descuento')` |
| `stockQuantityField(label)` | Entero no negativo para stock | `stockQuantityField('Stock inicial')` |
| `durationMinutesField(label, min, max)` | Duración en minutos | `durationMinutesField('Duración', 10, 480)` |

### IDs y Relaciones

| Helper | Descripción | Ejemplo |
|--------|-------------|---------|
| `optionalId()` | ID opcional para selects | `optionalId()` |
| `requiredId(label)` | ID requerido para selects | `requiredId('Cliente')` |
| `idsArray(optional)` | Array de IDs para multi-selects | `idsArray(true)` |

### Formatos Específicos

| Helper | Descripción | Ejemplo |
|--------|-------------|---------|
| `optionalEmail()` | Email opcional | `optionalEmail()` |
| `optionalDate()` | Fecha YYYY-MM-DD opcional | `optionalDate()` |
| `requiredDate(label)` | Fecha requerida | `requiredDate('Fecha nacimiento')` |
| `timeField(label, required)` | Hora HH:mm | `timeField('Hora inicio')` |
| `phoneField(label, required)` | Teléfono 10 dígitos | `phoneField('Teléfono')` |
| `rfcField(label, required)` | RFC mexicano | `rfcField('RFC', true)` |
| `optionalUrl(label)` | URL opcional | `optionalUrl('Sitio web')` |
| `colorField(label, default)` | Color hexadecimal | `colorField('Color', '#3B82F6')` |
| `booleanField(default)` | Boolean desde string/number | `booleanField(false)` |

---

## Mensajes de Validación

Importar desde `@/lib/validationMessages`:

```javascript
import { VALIDATION_MESSAGES as VM } from '@/lib/validationMessages';

// Uso con funciones
VM.REQUIRED('Email')           // "Email es requerido"
VM.MIN_LENGTH('Nombre', 2)     // "Nombre debe tener al menos 2 caracteres"
VM.MAX_VALUE('Precio', 10000)  // "Precio no puede exceder 10000"

// Constantes
VM.INVALID_EMAIL               // "Email inválido"
VM.INVALID_PHONE               // "Teléfono inválido (10 dígitos)"
VM.PASSWORDS_DONT_MATCH        // "Las contraseñas no coinciden"
```

### Grupos de Mensajes por Módulo

```javascript
import { INVENTORY_MESSAGES, APPOINTMENT_MESSAGES, SALES_MESSAGES, AUTH_MESSAGES } from '@/lib/validationMessages';

// Inventario
INVENTORY_MESSAGES.SKU_REQUIRED
INVENTORY_MESSAGES.STOCK_NEGATIVE

// Citas
APPOINTMENT_MESSAGES.TIME_SLOT_UNAVAILABLE
APPOINTMENT_MESSAGES.DURATION_MIN(10)

// Ventas
SALES_MESSAGES.CART_EMPTY
SALES_MESSAGES.COUPON_EXPIRED

// Auth
AUTH_MESSAGES.PASSWORD_POLICY
AUTH_MESSAGES.SESSION_EXPIRED
```

---

## Ejemplos de Uso

### Schema Básico

```javascript
import { z } from 'zod';
import {
  requiredString,
  optionalString,
  optionalEmail,
  phoneField,
  priceField
} from '@/lib/validations';

const productoSchema = z.object({
  nombre: requiredString('Nombre', 2, 100),
  descripcion: optionalString('Descripción', 0, 500),
  sku: optionalString('SKU', 0, 50),
  precio_venta: priceField('Precio de venta'),
  email_proveedor: optionalEmail(),
  telefono_proveedor: phoneField('Teléfono', false),
});
```

### Schema con Relaciones

```javascript
import {
  requiredId,
  optionalId,
  idsArray,
  requiredDate,
  timeField
} from '@/lib/validations';

const citaSchema = z.object({
  cliente_id: requiredId('Cliente'),
  profesional_id: optionalId(),
  servicios_ids: idsArray(false), // Requerido
  fecha_cita: requiredDate('Fecha'),
  hora_inicio: timeField('Hora de inicio'),
});
```

### Schema con Validación Cruzada

```javascript
const ventaSchema = z.object({
  precio: priceField('Precio'),
  descuento: priceField('Descuento', false),
}).refine(data => (data.descuento || 0) <= data.precio, {
  message: 'El descuento no puede ser mayor al precio',
  path: ['descuento'],
});
```

### Uso con React Hook Form

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(productoSchema),
  defaultValues: {
    nombre: '',
    descripcion: '',
    precio_venta: 0,
  },
});
```

---

## Patrones Comunes

### 1. Sanitizar Campos Opcionales

Los helpers ya manejan la conversión de `""` a `undefined`:

```javascript
// ❌ Antes (manual)
const data = {
  descripcion: formData.descripcion?.trim() || undefined,
};

// ✅ Ahora (automático con helpers)
const schema = z.object({
  descripcion: optionalString('Descripción'),
});
// El transform ya convierte "" a undefined
```

### 2. Precios con Decimales

```javascript
// El helper redondea a 2 decimales automáticamente
precio_venta: priceField('Precio'),
// Input: 99.999 → Output: 100.00
```

### 3. IDs desde Selects HTML

```javascript
// Los selects HTML envían strings, optionalId/requiredId los convierte
categoria_id: optionalId(),
// Input: "5" → Output: 5 (number)
// Input: "" o "0" → Output: undefined
```

### 4. Arrays de Servicios/Profesionales

```javascript
servicios_ids: idsArray(false), // Al menos 1 requerido
profesionales_ids: idsArray(true), // Opcional, default []
```

---

## Migración de Schemas Locales

### Paso 1: Identificar Schema Local

```javascript
// ❌ Schema inline en componente
const schema = z.object({
  nombre: z.string().min(2, 'Min 2 chars').max(100).trim(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  precio: z.coerce.number().min(0, 'No negativo'),
});
```

### Paso 2: Migrar a Helpers

```javascript
// ✅ Usando helpers centralizados
import { requiredString, optionalEmail, priceField } from '@/lib/validations';

const schema = z.object({
  nombre: requiredString('Nombre', 2, 100),
  email: optionalEmail(),
  precio: priceField('Precio'),
});
```

### Paso 3: Mantener Validaciones de Dominio

Los schemas centralizados son **base**, extiende con `.refine()` para reglas específicas:

```javascript
import { citaCreateSchema } from '@/lib/validations';

// Extender con validaciones específicas del componente
const citaFormSchema = citaCreateSchema
  .refine(data => data.fecha_cita >= hoy, {
    message: 'No se permiten fechas pasadas',
    path: ['fecha_cita'],
  })
  .refine(data => validarHorario(data.hora_inicio, data.duracion), {
    message: 'Horario fuera del rango permitido',
    path: ['hora_inicio'],
  });
```

---

## Schemas Centralizados Disponibles

| Schema | Descripción | Ubicación |
|--------|-------------|-----------|
| `businessInfoSchema` | Onboarding paso 1 | `validations.js` |
| `planSelectionSchema` | Onboarding paso 2 | `validations.js` |
| `accountSetupSchema` | Onboarding paso 3 | `validations.js` |
| `professionalSchema` | Onboarding profesionales | `validations.js` |
| `serviceSchema` | Onboarding servicios | `validations.js` |
| `loginSchema` | Login | `validations.js` |
| `forgotPasswordSchema` | Recuperar contraseña | `validations.js` |
| `resetPasswordSchema` | Restablecer contraseña | `validations.js` |
| `clienteSchema` | Cliente completo | `validations.js` |
| `clienteRapidoSchema` | Cliente walk-in | `validations.js` |
| `citaCreateSchema` | Crear cita (base) | `validations.js` |
| `citaEditSchema` | Editar cita (base) | `validations.js` |

---

## Tips

1. **Prefiere helpers sobre schemas inline** - Reduce duplicación y mejora consistencia
2. **Usa VALIDATION_MESSAGES para mensajes custom** - Mantiene consistencia de tono
3. **Extiende con .refine() para reglas de dominio** - Los schemas base son genéricos
4. **Sanitiza en el schema, no en el handler** - Los transforms de Zod lo hacen automático
5. **Revisa la documentación de Zod v4** - Algunos métodos han cambiado desde v3
