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
const verificarDisponibilidadTool = require('./tools/verificarDisponibilidad');
const listarServiciosTool = require('./tools/listarServicios');
const buscarClienteTool = require('./tools/buscarCliente');

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
  verificarDisponibilidad: verificarDisponibilidadTool,
  listarServicios: listarServiciosTool,
  buscarCliente: buscarClienteTool,
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
 * Ejecuta una herramienta
 * POST /mcp/execute
 * Headers: Authorization: Bearer <jwt-token>
 * Body: { tool: string, arguments: object }
 */
app.post('/mcp/execute', async (req, res) => {
  const startTime = Date.now();
  const { tool: toolName, arguments: toolArgs } = req.body;

  // ====================================================================
  // EXTRAER TOKEN JWT DEL HEADER (MULTI-TENANT)
  // ====================================================================
  const authHeader = req.headers.authorization;
  const jwtToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  // Validar que se proporcionó el token
  if (!jwtToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token JWT no proporcionado. Header Authorization: Bearer <token> es requerido.',
    });
  }

  // Validar que se proporcionó el nombre de la herramienta
  if (!toolName) {
    return res.status(400).json({
      error: 'Missing tool name',
      message: 'El campo "tool" es requerido',
    });
  }

  // Validar que la herramienta existe
  const tool = tools[toolName];
  if (!tool) {
    return res.status(404).json({
      error: 'Tool not found',
      message: `La herramienta "${toolName}" no existe`,
      availableTools: Object.keys(tools),
    });
  }

  try {
    logger.info(`Ejecutando tool: ${toolName}`, {
      arguments: toolArgs,
      hasToken: !!jwtToken
    });

    // Ejecutar la herramienta con el token JWT
    const result = await tool.execute(toolArgs, jwtToken);

    const duration = Date.now() - startTime;

    logger.info(`Tool ${toolName} ejecutado exitosamente`, {
      duration: `${duration}ms`,
      success: result.success,
    });

    res.json({
      tool: toolName,
      success: result.success,
      data: result.data,
      message: result.message,
      duration: `${duration}ms`,
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`Error ejecutando tool ${toolName}:`, {
      error: error.message,
      duration: `${duration}ms`,
      arguments: toolArgs,
    });

    res.status(500).json({
      tool: toolName,
      success: false,
      error: error.message,
      duration: `${duration}ms`,
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
