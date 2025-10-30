/**
 * ====================================================================
 * MCP SERVER - Servidor de Model Context Protocol
 * ====================================================================
 *
 * Servidor que expone herramientas (tools) para que el AI Agent de n8n
 * pueda interactuar con el backend del SaaS y realizar acciones reales.
 *
 * Arquitectura:
 * n8n AI Agent → MCP Client (n8n) → MCP Server → Backend API → PostgreSQL
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');

// Importar tools
const crearCitaTool = require('./tools/crearCita');
const reagendarCitaTool = require('./tools/reagendarCita');
const verificarDisponibilidadTool = require('./tools/verificarDisponibilidad');
const listarServiciosTool = require('./tools/listarServicios');
const buscarClienteTool = require('./tools/buscarCliente');
const buscarCitasClienteTool = require('./tools/buscarCitasCliente');

// ====================================================================
// CONFIGURACIÓN EXPRESS
// ====================================================================

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ====================================================================
// HEALTH CHECK ENDPOINT
// ====================================================================

app.get('/health', async (req, res) => {
  const { baseClient } = require('./utils/apiClient');

  let backendStatus = 'unknown';
  try {
    await baseClient.get('/health', { timeout: 2000 });
    backendStatus = 'connected';
  } catch (error) {
    backendStatus = 'disconnected';
  }

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    connections: {
      backend: backendStatus,
    },
    environment: config.nodeEnv,
  };

  res.json(health);
});

// ====================================================================
// MCP TOOLS REGISTRY
// ====================================================================

const tools = {
  crearCita: crearCitaTool,
  reagendarCita: reagendarCitaTool,
  verificarDisponibilidad: verificarDisponibilidadTool,
  listarServicios: listarServiciosTool,
  buscarCliente: buscarClienteTool,
  buscarCitasCliente: buscarCitasClienteTool,
};

// ====================================================================
// MCP ENDPOINTS
// ====================================================================

/**
 * Lista todas las herramientas disponibles
 * GET /mcp/tools
 */
app.get('/mcp/tools', (req, res) => {
  const toolsList = Object.keys(tools).map(toolName => ({
    name: toolName,
    description: tools[toolName].description,
    inputSchema: tools[toolName].inputSchema,
  }));

  res.json({
    tools: toolsList,
    total: toolsList.length,
  });
});

/**
 * Obtiene información de una herramienta específica
 * GET /mcp/tools/:toolName
 */
app.get('/mcp/tools/:toolName', (req, res) => {
  const { toolName } = req.params;

  const tool = tools[toolName];

  if (!tool) {
    return res.status(404).json({
      error: 'Tool not found',
      message: `La herramienta "${toolName}" no existe`,
      availableTools: Object.keys(tools),
    });
  }

  res.json({
    name: toolName,
    description: tool.description,
    inputSchema: tool.inputSchema,
  });
});

/**
 * Endpoint JSON-RPC 2.0 para MCP (Model Context Protocol)
 * POST /mcp/execute
 * Headers: Authorization: Bearer <jwt-token>
 *
 * Implementa el protocolo oficial MCP basado en JSON-RPC 2.0:
 * - initialize: Handshake inicial
 * - tools/list: Listar herramientas disponibles
 * - tools/call: Ejecutar una herramienta
 */
app.post('/mcp/execute', async (req, res) => {
  const startTime = Date.now();
  const { jsonrpc, id, method, params } = req.body;

  // ====================================================================
  // LOGGING DETALLADO DE LA REQUEST
  // ====================================================================
  logger.info('📥 MCP Request recibida', {
    method,
    jsonrpc,
    id,
    hasParams: !!params,
    hasAuth: !!req.headers.authorization,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? '***REDACTED***' : undefined,
    },
    body: {
      jsonrpc,
      id,
      method,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined
    }
  });

  // ====================================================================
  // VALIDAR FORMATO JSON-RPC 2.0
  // ====================================================================
  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: 'jsonrpc debe ser "2.0"'
      }
    });
  }

  if (!method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid Request',
        data: 'method es requerido'
      }
    });
  }

  // ====================================================================
  // EXTRAER TOKEN JWT DEL HEADER (MULTI-TENANT)
  // ====================================================================
  const authHeader = req.headers.authorization;
  const jwtToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  // ====================================================================
  // ROUTER DE MÉTODOS JSON-RPC
  // ====================================================================

  try {
    // Método: initialize (handshake inicial)
    if (method === 'initialize') {
      logger.info('✅ MCP initialize request - enviando capabilities');
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'SaaS Agendamiento MCP Server',
            version: '1.0.0',
          }
        }
      };
      logger.info('📤 Response initialize:', { response });
      return res.json(response);
    }

    // Método: tools/list (listar herramientas)
    if (method === 'tools/list') {
      logger.info('✅ MCP tools/list request - listando herramientas');

      const toolsList = Object.keys(tools).map(toolName => ({
        name: toolName,
        description: tools[toolName].description,
        inputSchema: tools[toolName].inputSchema,
      }));

      logger.info('📤 Response tools/list:', { count: toolsList.length, tools: toolsList.map(t => t.name) });

      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: toolsList
        }
      });
    }

    // Método: notifications/initialized (notificación post-handshake)
    if (method === 'notifications/initialized') {
      logger.info('✅ MCP notifications/initialized - handshake completado');
      // Las notificaciones no requieren respuesta JSON-RPC
      return res.status(204).end();
    }

    // Método: tools/call (ejecutar herramienta)
    if (method === 'tools/call') {
      // Validar JWT token para ejecución
      if (!jwtToken) {
        return res.status(401).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: 'Unauthorized',
            data: 'Token JWT no proporcionado. Header Authorization: Bearer <token> es requerido.'
          }
        });
      }

      const { name: toolName, arguments: toolArgs = {} } = params || {};

      if (!toolName) {
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32602,
            message: 'Invalid params',
            data: 'params.name es requerido'
          }
        });
      }

      const tool = tools[toolName];
      if (!tool) {
        return res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found',
            data: {
              message: `La herramienta "${toolName}" no existe`,
              availableTools: Object.keys(tools)
            }
          }
        });
      }

      logger.info(`✅ Ejecutando tool: ${toolName}`, {
        arguments: toolArgs,
        hasToken: !!jwtToken
      });

      // Ejecutar la herramienta
      const result = await tool.execute(toolArgs, jwtToken);
      const duration = Date.now() - startTime;

      logger.info(`✅ Tool ${toolName} ejecutado exitosamente`, {
        duration: `${duration}ms`,
        success: result.success,
      });

      // Respuesta JSON-RPC con formato MCP
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: result.success,
                data: result.data,
                message: result.message,
                duration: `${duration}ms`
              })
            }
          ]
        }
      };

      logger.info('📤 Response tools/call:', {
        tool: toolName,
        success: result.success,
        hasData: !!result.data
      });

      return res.json(response);
    }

    // Método no soportado
    return res.status(404).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: 'Method not found',
        data: {
          method,
          supportedMethods: ['initialize', 'tools/list', 'tools/call']
        }
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`Error en método ${method}:`, {
      error: error.message,
      duration: `${duration}ms`,
      params,
    });

    return res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: {
          error: error.message,
          duration: `${duration}ms`
        }
      }
    });
  }
});

// ====================================================================
// ERROR HANDLERS
// ====================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `La ruta ${req.method} ${req.path} no existe`,
    availableEndpoints: [
      'GET /health',
      'GET /mcp/tools',
      'GET /mcp/tools/:toolName',
      'POST /mcp/execute',
    ],
  });
});

// Error handler global
app.use((err, req, res, next) => {
  logger.error('Error no manejado:', err);

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ====================================================================
// INICIO DEL SERVIDOR
// ====================================================================

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 MCP Server iniciado en puerto ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔧 Herramientas disponibles: ${Object.keys(tools).length}`);
  logger.info(`🌍 Entorno: ${config.nodeEnv}`);
  logger.info(`🔗 Backend API: ${config.backend.url}`);
});

// Manejo de señales para graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});
