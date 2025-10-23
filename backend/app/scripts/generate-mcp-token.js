/**
 * ====================================================================
 * SCRIPT: GENERAR TOKEN JWT PARA MCP SERVER
 * ====================================================================
 *
 * Genera un token JWT de larga duración (180 días) para que el
 * MCP Server pueda autenticarse con el backend API.
 *
 * Uso:
 * node scripts/generate-mcp-token.js <organizacion_id>
 *
 * Ejemplo:
 * node scripts/generate-mcp-token.js 1
 */

const jwt = require('jsonwebtoken');
const pool = require('../database/db');
const logger = require('../utils/logger');

/**
 * Obtiene el usuario bot de una organización
 */
async function obtenerUsuarioBot(organizacionId) {
  const query = `
    SELECT id, email, rol
    FROM usuarios
    WHERE organizacion_id = $1 AND rol = 'bot'
    LIMIT 1
  `;

  const result = await pool.query(query, [organizacionId]);

  if (result.rows.length === 0) {
    throw new Error(`No se encontró usuario bot para organización ${organizacionId}`);
  }

  return result.rows[0];
}

/**
 * Genera token JWT de larga duración
 */
function generarToken(usuario, organizacionId) {
  const payload = {
    userId: usuario.id,
    organizacionId: organizacionId,
    rol: usuario.rol,
    type: 'mcp_service',
    email: usuario.email,
  };

  const options = {
    expiresIn: '180d', // 180 días (6 meses)
    issuer: 'saas-backend',
    audience: 'mcp-server',
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, options);

  return token;
}

/**
 * Función principal
 */
async function main() {
  try {
    // Obtener organizacion_id del primer argumento
    const organizacionId = parseInt(process.argv[2]);

    if (!organizacionId || isNaN(organizacionId)) {
      console.error('❌ Error: Debes proporcionar un organizacion_id válido');
      console.log('\nUso:');
      console.log('  node scripts/generate-mcp-token.js <organizacion_id>');
      console.log('\nEjemplo:');
      console.log('  node scripts/generate-mcp-token.js 1');
      process.exit(1);
    }

    console.log(`\n🔐 Generando token JWT para MCP Server...`);
    console.log(`📋 Organización ID: ${organizacionId}\n`);

    // Obtener usuario bot
    const usuarioBot = await obtenerUsuarioBot(organizacionId);

    console.log(`✅ Usuario bot encontrado:`);
    console.log(`   - ID: ${usuarioBot.id}`);
    console.log(`   - Email: ${usuarioBot.email}`);
    console.log(`   - Rol: ${usuarioBot.rol}\n`);

    // Generar token
    const token = generarToken(usuarioBot, organizacionId);

    console.log(`✅ Token JWT generado exitosamente!\n`);
    console.log(`📝 Agrega esta línea a tu archivo .env:\n`);
    console.log(`MCP_JWT_TOKEN=${token}\n`);

    // Información adicional
    console.log(`ℹ️  Información del token:`);
    console.log(`   - Validez: 180 días (6 meses)`);
    console.log(`   - Issuer: saas-backend`);
    console.log(`   - Audience: mcp-server`);
    console.log(`   - Type: mcp_service\n`);

    console.log(`⚠️  IMPORTANTE:`);
    console.log(`   - Guarda este token de forma segura`);
    console.log(`   - No lo compartas públicamente`);
    console.log(`   - Renueva el token antes de los 180 días\n`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error generando token:', error.message);
    logger.error('Error en generate-mcp-token:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();
