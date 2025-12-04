# Plan: Manejo de Errores de Output Parser en n8n AI Agent

## Problema Identificado

Cuando el AI Agent de n8n procesa respuestas del LLM (deepseek-chat / Qwen3-32B), ocasionalmente ocurre el error:

```
Failed to parse tool arguments
```

### Causa Raíz

El LLM no siempre formatea correctamente los argumentos de las herramientas MCP en formato JSON válido. Esto es un problema **transiente** del modelo, no del código.

### Ejemplo del Error

```json
// El LLM debería retornar:
{"cita_id": 123}

// Pero a veces retorna:
{cita_id: 123}  // Sin comillas en la key
// O
{"cita_id": "123"}  // Tipo incorrecto
// O formato malformado
```

---

## Soluciones Propuestas

### Opción 1: Retry Automático en n8n (Recomendada)

**Complejidad:** Baja
**Impacto:** Alto

Configurar el nodo AI Agent en n8n para reintentar automáticamente cuando falle el parsing.

**Pasos:**
1. En el workflow de n8n, seleccionar el nodo "AI Agent"
2. Ir a Settings → On Error
3. Configurar: `Continue (using error output)` o `Retry`
4. Si es Retry, configurar:
   - Max Tries: 3
   - Wait Between Tries: 1000ms

**Pros:**
- No requiere cambios de código
- Funciona para todos los errores transitorios
- Fácil de implementar

**Contras:**
- Agrega latencia en caso de error
- Consume tokens adicionales

---

### Opción 2: Output Parser Personalizado

**Complejidad:** Media
**Impacto:** Alto

Crear un parser más tolerante que corrija errores comunes de formato.

**Implementación:**

```javascript
// En un nodo Code antes del AI Agent output
function parseToolArguments(rawOutput) {
  try {
    // Intento 1: Parse directo
    return JSON.parse(rawOutput);
  } catch (e) {
    // Intento 2: Corregir keys sin comillas
    const fixed = rawOutput.replace(/(\w+):/g, '"$1":');
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      // Intento 3: Extraer JSON con regex
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No se pudo parsear los argumentos');
    }
  }
}
```

**Pros:**
- Maneja múltiples formatos incorrectos
- Reduce fallos significativamente

**Contras:**
- Requiere nodo adicional en workflow
- Puede enmascarar problemas reales

---

### Opción 3: Mejorar Prompts del Sistema

**Complejidad:** Baja
**Impacto:** Medio

Agregar instrucciones explícitas en el system prompt para que el LLM formatee correctamente.

**Agregar al system prompt:**

```
=== FORMATO DE HERRAMIENTAS ===

CRÍTICO: Cuando uses herramientas, los argumentos DEBEN ser JSON válido:
- Todas las keys deben tener comillas dobles: {"cita_id": 123}
- Los strings deben tener comillas dobles: {"nombre": "Juan"}
- Los números NO llevan comillas: {"id": 123}
- NO uses comillas simples
- NO omitas las comillas en las keys

Ejemplo CORRECTO:
{"cita_id": 123, "nueva_fecha": "2025-12-05"}

Ejemplo INCORRECTO:
{cita_id: 123, nueva_fecha: '2025-12-05'}
```

**Pros:**
- Sin cambios de infraestructura
- Educa al modelo

**Contras:**
- No garantiza 100% de éxito
- Consume tokens del contexto

---

### Opción 4: Cambiar Modelo LLM

**Complejidad:** Baja
**Impacto:** Variable

Algunos modelos son más consistentes con el formato de output.

**Modelos recomendados para tool calling:**
1. **Claude 3.5 Sonnet** - Excelente formato JSON
2. **GPT-4o** - Muy consistente
3. **Qwen3-32B** - Bueno pero ocasionalmente falla
4. **DeepSeek Chat** - Económico pero menos consistente

**Configuración actual:**
- Primary: OpenRouter (Qwen3-32B)
- Fallback: DeepSeek Chat

**Pros:**
- Solución definitiva si el modelo es el problema

**Contras:**
- Puede aumentar costos
- Requiere pruebas de compatibilidad

---

### Opción 5: Wrapper de MCP Tools con Validación

**Complejidad:** Alta
**Impacto:** Alto

Modificar el MCP Server para validar y corregir argumentos antes de ejecutar.

**Implementación en `mcp-server/index.js`:**

```javascript
// Antes de ejecutar cualquier tool
function validateAndFixArguments(toolName, args) {
  const schema = toolSchemas[toolName];

  // Intentar corregir tipos
  for (const [key, value] of Object.entries(args)) {
    const expectedType = schema.properties[key]?.type;

    if (expectedType === 'number' && typeof value === 'string') {
      args[key] = parseInt(value, 10);
    }
    if (expectedType === 'string' && typeof value === 'number') {
      args[key] = String(value);
    }
  }

  return args;
}
```

**Pros:**
- Validación centralizada
- Corrección automática de tipos

**Contras:**
- Requiere mantenimiento por cada tool
- Complejidad adicional

---

## Recomendación

### Implementar en Fases:

**Fase 1 (Inmediata):**
- Opción 1: Configurar retry en n8n
- Opción 3: Agregar instrucciones de formato al prompt

**Fase 2 (Si persisten errores):**
- Opción 2: Output parser personalizado

**Fase 3 (Optimización):**
- Opción 4: Evaluar cambio de modelo
- Opción 5: Validación en MCP Server

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tasa de error parsing | ~5-10% | < 1% |
| Tiempo promedio respuesta | ~3s | < 4s (con retry) |
| Reintentos por conversación | N/A | < 0.5 |

---

## Archivos Relacionados

- `backend/mcp-server/index.js` - Servidor MCP
- `backend/mcp-server/tools/*.js` - Herramientas MCP
- `backend/app/modules/agendamiento/controllers/chatbot.controller.js` - System prompt
- `backend/app/flows/generator/workflowGenerator.js` - Generador de workflows n8n

---

## Referencias

- [n8n AI Agent Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [LangChain Output Parsers](https://js.langchain.com/docs/modules/model_io/output_parsers/)
- [JSON Schema Validation](https://json-schema.org/)

---

**Creado:** 2025-12-03
**Estado:** Pendiente
**Prioridad:** Media
