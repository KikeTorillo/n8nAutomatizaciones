# Plan de Automatización - Barbería con n8n + Google Sheets

## 📋 Resumen Ejecutivo

**Cliente**: Barbería con 2 barberos  
**Problema**: Gestión manual de citas por WhatsApp en libreta física  
**Solución**: Sistema automatizado con n8n + Evolution API + Google Sheets + IA

## 🎯 Objetivos del Proyecto

### Objetivos Principales
- ✅ Automatizar la recepción de citas por WhatsApp
- ✅ Eliminar conflictos de horarios entre barberos
- ✅ Crear recordatorios automáticos para clientes
- ✅ Mantener historial digital de citas y clientes
- ✅ Reducir trabajo manual de agendado

### Métricas de Éxito
- 📈 Reducir tiempo de agendado en 80%
- 📉 Eliminar dobles reservas (0% conflictos)
- 📱 100% de citas confirmadas automáticamente
- ⏰ 90% de clientes reciben recordatorios

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Plataforma**: n8n (ya disponible)
- **Mensajería**: Evolution API + WhatsApp (ya configurado)
- **IA**: DeepSeek (ya integrado)
- **Almacenamiento**: Google Sheets
- **Base de Datos**: PostgreSQL (backup y logs)

### Flujo Principal
```
WhatsApp Mensaje
    ↓
Webhook n8n
    ↓
DeepSeek AI (Extracción de datos)
    ↓
Google Sheets (Validar disponibilidad)
    ↓
Switch (¿Disponible?)
    ├─ SÍ → Insertar cita ordenada → Confirmar
    └─ NO → Proponer alternativas
    ↓
Schedule (Recordatorios automáticos)
```

## 📊 Diseño de Google Sheets

### Hoja 1: "Citas_Agendadas"
| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| A - Fecha | Date | Fecha de la cita | 15/01/2025 |
| B - Hora | Time | Hora de inicio | 10:00 |
| C - Barbero | Text | Nombre del barbero | José |
| D - Cliente | Text | Nombre del cliente | Juan Pérez |
| E - Teléfono | Text | Número WhatsApp | +52155... |
| F - Servicio | Text | Tipo de servicio | Corte + Barba |
| G - Estado | Text | Estado de la cita | Activa/Cancelada/Completada |
| H - Notas | Text | Observaciones | Cliente VIP |
| I - Timestamp | Number | Unix timestamp | 1736948400 |
| J - Duración | Number | Minutos del servicio | 45 |

### Hoja 2: "Configuracion"
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| Barbero1_Nombre | José | Nombre completo barbero 1 |
| Barbero2_Nombre | Carlos | Nombre completo barbero 2 |
| Horario_Inicio | 09:00 | Hora de apertura |
| Horario_Fin | 18:00 | Hora de cierre |
| Duracion_Corte | 30 | Minutos para corte básico |
| Duracion_Corte_Barba | 45 | Minutos para corte + barba |
| Dias_Trabajo | L,M,M,J,V,S | Días laborales |
| Tiempo_Buffer | 15 | Minutos entre citas |

### Hoja 3: "Horarios_Disponibles"
| Barbero | Día | Hora_Inicio | Hora_Fin | Disponible |
|---------|-----|-------------|----------|------------|
| José | Lunes | 09:00 | 18:00 | TRUE |
| Carlos | Lunes | 10:00 | 17:00 | TRUE |

## 🔧 Configuración de n8n - Workflows

### Workflow 1: "Agendado_Principal"

#### Nodo 1: Webhook Trigger
```json
{
  "httpMethod": "POST",
  "path": "/barberia/nueva-cita",
  "responseMode": "onReceived"
}
```

#### Nodo 2: HTTP Request (DeepSeek AI)
```json
{
  "method": "POST",
  "url": "{{ $vars.DEEPSEEK_API_URL }}",
  "headers": {
    "Authorization": "Bearer {{ $vars.DEEPSEEK_API_KEY }}",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "deepseek-chat",
    "messages": [{
      "role": "system",
      "content": "Extrae datos de cita: barbero (José/Carlos), fecha (DD/MM/YYYY), hora (HH:MM), cliente, servicio. Responde solo JSON válido."
    }, {
      "role": "user", 
      "content": "{{ $json.message }}"
    }]
  }
}
```

#### Nodo 3: Code - Procesar Respuesta IA
```javascript
// Parsear respuesta de DeepSeek y validar datos
const respuestaIA = JSON.parse($json.choices[0].message.content);

// Validar barbero
const barberosValidos = ['José', 'Carlos', 'jose', 'carlos'];
const barbero = barberosValidos.find(b => 
  b.toLowerCase() === respuestaIA.barbero?.toLowerCase()
) || 'José'; // Default

// Validar y formatear fecha
let fecha = new Date(respuestaIA.fecha);
if (isNaN(fecha.getTime())) {
  // Si no es válida, usar mañana
  fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
}

// Crear timestamp para ordenamiento
const horaCompleta = new Date(`${fecha.toDateString()} ${respuestaIA.hora}`);
const timestamp = horaCompleta.getTime();

return [{
  json: {
    barbero: barbero,
    fecha: fecha.toLocaleDateString('es-MX'),
    hora: respuestaIA.hora,
    cliente: respuestaIA.cliente || 'Cliente',
    telefono: $json.phone || '',
    servicio: respuestaIA.servicio || 'Corte',
    timestamp: timestamp,
    duracion: respuestaIA.servicio?.includes('barba') ? 45 : 30
  }
}];
```

#### Nodo 4: Google Sheets (Read) - Validar Disponibilidad
```json
{
  "authentication": "googleSheetsOAuth2",
  "operation": "read",
  "sheetId": "{{ $vars.SHEET_ID }}",
  "range": "Citas_Agendadas!A:J",
  "options": {
    "valueRenderOption": "FORMATTED_VALUE"
  }
}
```

#### Nodo 5: Code - Verificar Conflictos
```javascript
// Obtener citas existentes del barbero en la fecha
const citasExistentes = $input.all()[1].json.values || [];
const nuevaCita = $input.all()[0].json;

// Filtrar citas del mismo barbero y fecha
const citasMismoDia = citasExistentes.filter(fila => {
  return fila[0] === nuevaCita.fecha && 
         fila[2] === nuevaCita.barbero && 
         fila[6] === 'Activa'; // Solo citas activas
});

// Verificar conflictos de horario
const horaNueva = new Date(`2024-01-01 ${nuevaCita.hora}`);
let conflicto = false;
let horariosOcupados = [];

citasMismoDia.forEach(cita => {
  const horaExistente = new Date(`2024-01-01 ${cita[1]}`);
  const duracionExistente = parseInt(cita[9]) || 30;
  
  // Calcular ventana ocupada
  const inicioOcupado = new Date(horaExistente.getTime() - 15*60000); // 15min buffer antes
  const finOcupado = new Date(horaExistente.getTime() + (duracionExistente + 15)*60000); // duración + 15min buffer
  
  horariosOcupados.push(`${cita[1]} (${duracionExistente}min)`);
  
  // Verificar si la nueva cita interfiere
  if (horaNueva >= inicioOcupado && horaNueva <= finOcupado) {
    conflicto = true;
  }
});

// Generar horarios alternativos si hay conflicto
let alternativas = [];
if (conflicto) {
  const horaBase = 9; // 9 AM
  for (let h = horaBase; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      const horaAlternativa = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const horaTest = new Date(`2024-01-01 ${horaAlternativa}`);
      
      // Verificar si esta hora está libre
      let libre = true;
      citasMismoDia.forEach(cita => {
        const horaOcupada = new Date(`2024-01-01 ${cita[1]}`);
        const duracion = parseInt(cita[9]) || 30;
        const diferencia = Math.abs(horaTest - horaOcupada) / (1000 * 60);
        
        if (diferencia < (duracion + 15)) {
          libre = false;
        }
      });
      
      if (libre && alternativas.length < 3) {
        alternativas.push(horaAlternativa);
      }
    }
  }
}

return [{
  json: {
    ...nuevaCita,
    disponible: !conflicto,
    conflicto: conflicto,
    horariosOcupados: horariosOcupados,
    alternativas: alternativas,
    mensaje: conflicto ? 
      `Horario ocupado. Alternativas: ${alternativas.join(', ')}` : 
      'Horario disponible'
  }
}];
```

#### Nodo 6: Switch - Decisión por Disponibilidad
```json
{
  "rules": {
    "0": {
      "operation": "boolean",
      "value1": "={{ $json.disponible }}",
      "value2": true
    }
  }
}
```

#### Nodo 7A: Google Sheets (Insert) - Insertar Cita Ordenada
```javascript
// Encontrar posición correcta para insertar
const todasLasCitas = $input.all();
const nuevaCita = $json;
let filaPosicion = 2; // Después del header

// Buscar posición correcta basada en timestamp
todasLasCitas.forEach((cita, index) => {
  if (cita.json.values && cita.json.values.length > 0) {
    const timestampExistente = parseInt(cita.json.values[8]) || 0;
    if (nuevaCita.timestamp < timestampExistente) {
      return;
    }
    filaPosicion = index + 3; // +3 porque: index base 0, header en 1, siguiente fila
  }
});

return [{
  json: {
    operation: "insert",
    sheetId: "{{ $vars.SHEET_ID }}",
    range: `Citas_Agendadas!A${filaPosicion}:J${filaPosicion}`,
    values: [[
      nuevaCita.fecha,
      nuevaCita.hora, 
      nuevaCita.barbero,
      nuevaCita.cliente,
      nuevaCita.telefono,
      nuevaCita.servicio,
      "Activa",
      "Agendada por WhatsApp",
      nuevaCita.timestamp,
      nuevaCita.duracion
    ]]
  }
}];
```

#### Nodo 8A: HTTP Request - Confirmación WhatsApp
```json
{
  "method": "POST", 
  "url": "{{ $vars.EVOLUTION_API_URL }}/message/sendText/{{ $vars.INSTANCE_NAME }}",
  "headers": {
    "Content-Type": "application/json",
    "apikey": "{{ $vars.EVOLUTION_API_KEY }}"
  },
  "body": {
    "number": "{{ $json.telefono }}",
    "text": "✅ *Cita Confirmada*\n\n📅 *Fecha:* {{ $json.fecha }}\n⏰ *Hora:* {{ $json.hora }}\n✂️ *Barbero:* {{ $json.barbero }}\n👤 *Servicio:* {{ $json.servicio }}\n⏱️ *Duración:* {{ $json.duracion }} minutos\n\n📱 Te recordaré 2 horas antes de tu cita.\n\n¡Gracias por elegirnos! 💈"
  }
}
```

#### Nodo 7B: HTTP Request - Horario Ocupado 
```json
{
  "method": "POST",
  "url": "{{ $vars.EVOLUTION_API_URL }}/message/sendText/{{ $vars.INSTANCE_NAME }}",
  "headers": {
    "Content-Type": "application/json", 
    "apikey": "{{ $vars.EVOLUTION_API_KEY }}"
  },
  "body": {
    "number": "{{ $json.telefono }}",
    "text": "❌ *Horario Ocupado*\n\n⏰ {{ $json.hora }} con {{ $json.barbero }} ya está reservado.\n\n🕐 *Horarios disponibles:*\n{{ $json.alternativas.map(h => '• ' + h).join('\n') }}\n\n📱 Responde con el horario que prefieres."
  }
}
```

### Workflow 2: "Recordatorios_Automaticos"

#### Nodo 1: Schedule Trigger
```json
{
  "rule": {
    "interval": [{
      "field": "hour",
      "triggerAtHour": [8, 12, 16]
    }]
  }
}
```

#### Nodo 2: Google Sheets (Read) - Citas Próximas
```json
{
  "operation": "read",
  "range": "Citas_Agendadas!A:J",
  "filters": {
    "estado": "Activa"
  }
}
```

#### Nodo 3: Code - Filtrar Citas para Recordar
```javascript
const ahora = new Date();
const dosHorasAdelante = new Date(ahora.getTime() + 2*60*60*1000);

const citasParaRecordar = $input.all().filter(cita => {
  const fechaCita = new Date(`${cita.json.fecha} ${cita.json.hora}`);
  const diferencia = fechaCita - ahora;
  const enDosHoras = diferencia <= 2*60*60*1000 && diferencia > 1.5*60*60*1000;
  
  return enDosHoras;
});

return citasParaRecordar.map(cita => ({
  json: cita.json
}));
```

#### Nodo 4: HTTP Request - Enviar Recordatorio
```json
{
  "method": "POST",
  "url": "{{ $vars.EVOLUTION_API_URL }}/message/sendText/{{ $vars.INSTANCE_NAME }}",
  "headers": {
    "Content-Type": "application/json",
    "apikey": "{{ $vars.EVOLUTION_API_KEY }}"
  },
  "body": {
    "number": "{{ $json.telefono }}",
    "text": "🔔 *Recordatorio de Cita*\n\n📅 {{ $json.fecha }} a las {{ $json.hora }}\n✂️ Con {{ $json.barbero }}\n👤 Servicio: {{ $json.servicio }}\n\n📍 Te esperamos en la barbería en 2 horas.\n\n💈 Si necesitas cancelar o reprogramar, responde a este mensaje."
  }
}
```

## 📅 Plan de Implementación

### Fase 1: Configuración Base ✅ COMPLETADA
**Duración**: 3-5 días (COMPLETADO)  
**Tareas**:
- [x] Configurar Google Sheets con estructura definida (3 hojas: Citas_Agendadas, Configuracion, Horarios_Disponibles)
- [x] Crear credenciales Google Sheets OAuth2 en n8n
- [x] Configurar webhook Evolution API 
- [x] Probar integración DeepSeek con AI Agent
- [x] Crear workflow básico con arquitectura AI Agent + Tools

**Entregables**:
- ✅ Google Sheets funcional con ID: 1y8ctyXaM0E0qibXl4z0693UFZQwi54xDsmO97PVx7-Y
- ✅ Webhook recibiendo mensajes de WhatsApp
- ✅ AI Agent respondiendo con DeepSeek + PostgreSQL Memory

### Fase 2: Lógica de Negocio 🔄 EN PROGRESO  
**Duración**: 5-7 días (EN DESARROLLO)
**Tareas**:
- [x] Implementar 3 herramientas Google Sheets (verificar_disponibilidad_barberia, agendar_nueva_cita, actualizar_estado_cita)
- [x] Crear prompt especializado BARBERO_BOT con lógica de negocio
- [x] Configurar validación de disponibilidad con AI Agent
- [x] Implementar agendado de citas nuevas automatizado
- [x] Configurar identificación inteligente de clientes por teléfono
- [x] Resolver ciclos en reagendado de citas
- [ ] Optimizar manejo de conflictos de horario
- [ ] Implementar cálculo automático de timestamp
- [ ] Pruebas exhaustivas de todos los flujos

**Entregables**:
- ✅ AI Agent con 3 herramientas funcionando
- ✅ Sistema de agendado básico operativo  
- ✅ Reagendado de citas funcionando
- 🔄 Validación de conflictos en desarrollo
- ⏳ Inserción cronológica automática pendiente

### Fase 3: Recordatorios y Optimización ⏳ PENDIENTE
**Duración**: 3-5 días  
**Tareas**:
- [x] Diseñar workflow de recordatorios automáticos (JSON creado)
- [ ] Implementar recordatorios cada 4 horas (8am, 12pm, 4pm)
- [ ] Configurar filtrado de citas próximas (2 horas antes)
- [ ] Implementar manejo completo de cancelaciones
- [ ] Optimizar performance del AI Agent
- [ ] Crear documentación de usuario final
- [ ] Capacitación a Luis Enrique y Diego

**Entregables**:
- ✅ Workflow de recordatorios diseñado
- ⏳ Sistema de recordatorios automáticos pendiente
- ⏳ Manual de usuario pendiente
- ⏳ Capacitación pendiente

### Fase 4: Monitoreo y Mejoras ⏳ PENDIENTE
**Duración**: Continuo  
**Tareas**:
- [ ] Implementar logs de actividad en PostgreSQL
- [ ] Crear dashboard de métricas de uso
- [ ] Monitoreo de errores y performance
- [ ] Ajustes basados en uso real de barberos
- [ ] Optimizaciones de performance del AI Agent
- [ ] Documentación técnica completa
- [ ] Backup automático de datos

**Entregables**:
- ⏳ Sistema de monitoreo pendiente
- ⏳ Dashboard de métricas pendiente
- ⏳ Documentación técnica pendiente

## 🔧 Configuración de Entorno

### Variables de Entorno (.env)
```bash
# Evolution API
EVOLUTION_API_URL=http://localhost:8000
EVOLUTION_API_KEY=your_evolution_api_key
INSTANCE_NAME=barberia_bot

# DeepSeek AI
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_API_KEY=your_deepseek_api_key

# Google Sheets
GOOGLE_SHEETS_CLIENT_ID=your_google_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_google_client_secret
SHEET_ID=1y8ctyXaM0E0qibXl4z0693UFZQwi54xDsmO97PVx7-Y

# Configuración de Negocio  
BARBERO1_NOMBRE=Luis Enrique Arellanes
BARBERO2_NOMBRE=Diego Torillo
HORARIO_INICIO=09:00
HORARIO_FIN=18:00
DURACION_CORTE=30
DURACION_CORTE_BARBA=45
```

### Credenciales en n8n
1. **Google Sheets OAuth2**
   - Scope: https://www.googleapis.com/auth/spreadsheets
   - Client ID/Secret desde Google Cloud Console

2. **HTTP Authentication** (Evolution API)
   - Type: Header Auth
   - Name: apikey
   - Value: {{ $vars.EVOLUTION_API_KEY }}

## 📊 Métricas y KPIs

### Métricas Operacionales
- **Citas Agendadas/Día**: Target 15-20
- **Tiempo de Respuesta**: < 30 segundos
- **Tasa de Confirmación**: > 95%
- **Conflictos de Horario**: 0%

### Métricas de Usuario
- **Satisfacción del Cliente**: Encuesta post-cita
- **No-shows**: < 10%
- **Cancelaciones de Último Momento**: < 15%

### Métricas Técnicas
- **Uptime del Sistema**: > 99.5%
- **Tiempo de Procesamiento**: < 5 segundos
- **Errores de API**: < 1%

## 🚨 Manejo de Errores

### Errores Comunes y Soluciones

**1. Error de Formato de Fecha**
```javascript
// Validación robusta
function parseDate(fechaTexto) {
  const formatos = [
    'DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 
    'YYYY-MM-DD', 'mañana', 'hoy'
  ];
  
  if (fechaTexto === 'mañana') {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana;
  }
  
  // Más lógica de parsing...
}
```

**2. API Evolution Caída**
```javascript
// Retry con backoff exponencial
const maxRetries = 3;
let retry = 0;

while (retry < maxRetries) {
  try {
    const response = await $http.request(options);
    return response;
  } catch (error) {
    retry++;
    await new Promise(resolve => 
      setTimeout(resolve, Math.pow(2, retry) * 1000)
    );
  }
}
```

**3. Google Sheets API Límites**
```javascript
// Batch requests y cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let lastFetch = 0;
let cachedData = null;

if (Date.now() - lastFetch > CACHE_TTL) {
  cachedData = await fetchFromSheets();
  lastFetch = Date.now();
}
```

## 🔐 Seguridad y Privacidad

### Medidas de Seguridad
- ✅ Encriptación de credenciales en n8n
- ✅ Validación de números de WhatsApp
- ✅ Rate limiting en webhooks
- ✅ Logs de auditoría
- ✅ Backup automático de datos

### Privacidad de Datos
- ✅ Solo almacenar datos necesarios
- ✅ Política de retención de 2 años
- ✅ Acceso restringido a datos sensibles
- ✅ Cumplimiento GDPR básico

## 🎓 Capacitación de Usuarios

### Para Barberos
1. **Acceso a Google Sheets**
   - Cómo ver citas del día
   - Marcar citas como completadas
   - Agregar notas post-servicio

2. **Interpretación de Estados**
   - Activa: Cliente confirmó
   - Completada: Servicio terminado
   - Cancelada: Cliente canceló

3. **Gestión Manual**
   - Cuándo intervenir manualmente
   - Cómo manejar casos especiales

### Para Administrador
1. **Monitoreo del Sistema**
   - Dashboard de n8n
   - Logs de errores
   - Métricas de rendimiento

2. **Configuración Avanzada**
   - Ajustar horarios
   - Modificar plantillas de mensajes
   - Gestionar credenciales

## 💰 Costos y ROI

### Costos Menstuales Estimados
- **Google Workspace**: $6 USD/mes
- **n8n Cloud** (opcional): $20 USD/mes  
- **DeepSeek API**: $5 USD/mes
- **Evolution API**: Incluido en servidor
- **Total**: ~$31 USD/mes

### ROI Esperado
- **Tiempo Ahorrado**: 2 horas/día × $15/hora = $30/día
- **Ahorro Mensual**: $900 USD
- **ROI**: 2,800% (primer mes)

### Beneficios Intangibles
- ✅ Menos estrés para barberos
- ✅ Mejor experiencia del cliente  
- ✅ Imagen más profesional
- ✅ Datos para tomar decisiones

## 🔄 Mantenimiento y Actualizaciones

### Mantenimiento Semanal
- [ ] Revisar logs de errores
- [ ] Verificar métricas de rendimiento
- [ ] Limpiar datos antiguos (>2 años)
- [ ] Backup de configuraciones

### Actualizaciones Trimestrales
- [ ] Revisar y optimizar workflows
- [ ] Actualizar plantillas de mensajes
- [ ] Análisis de nuevas funcionalidades
- [ ] Capacitación de refuerzo

### Evoluciones Futuras
- 🚀 Integración con sistema de pagos
- 🚀 App móvil para barberos
- 🚀 Sistema de fidelización
- 🚀 Análisis predictivo de demanda

## 📞 Soporte y Contacto

### Niveles de Soporte
**Nivel 1 - Usuario**: Issues básicos de uso
**Nivel 2 - Técnico**: Problemas de configuración  
**Nivel 3 - Desarrollo**: Bugs y nuevas features

### Escalación
1. Barberos → Administrador local
2. Administrador → Soporte técnico
3. Soporte técnico → Equipo de desarrollo

---

*Este plan fue generado por el Agente Especialista en n8n - Versión 1.0*  
*Última actualización: Enero 2025*