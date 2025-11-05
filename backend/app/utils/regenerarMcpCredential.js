/**
 * Script temporal para regenerar MCP credential con email correcto
 */

const { generarTokenMCP } = require('./mcpTokenGenerator');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const configService = require('../services/configService');

/**
 * Crear cliente n8n con API Key dinámica desde BD
 */
async function createN8nClient() {
    const apiKey = await configService.getN8nApiKey();

    if (!apiKey) {
        throw new Error(
            'N8N_API_KEY no configurado. ' +
            'Ejecuta setup inicial: POST /api/v1/setup/unified-setup'
        );
    }

    return axios.create({
        baseURL: process.env.N8N_API_URL || 'http://n8n-main:5678',
        headers: {
            'X-N8N-API-KEY': apiKey,
            'Content-Type': 'application/json'
        }
    });
}

async function regenerarCredential() {
    try {
        const organizacionId = 1;
        const credentialId = 'QFF4vmT3UBDDIjIN'; // De la BD

        console.log('🔄 Regenerando token MCP para organización', organizacionId);

        // 1. Generar nuevo token con email correcto
        const nuevoToken = await generarTokenMCP(organizacionId);
        const decoded = jwt.decode(nuevoToken);

        console.log('\n✅ Nuevo token generado');
        console.log('Payload:', JSON.stringify(decoded, null, 2));

        // Verificar que tiene todos los campos requeridos
        if (!decoded.email) {
            throw new Error('❌ Token no contiene email');
        }
        if (!decoded.userId) {
            throw new Error('❌ Token no contiene userId');
        }
        if (!decoded.rol) {
            throw new Error('❌ Token no contiene rol');
        }

        console.log('\n✅ Token contiene todos los campos requeridos (userId, email, rol)');

        // 2. Actualizar credential en n8n (usando API Key dinámica)
        const n8nClient = await createN8nClient();

        console.log('\n🔄 Actualizando credential en n8n...');

        // Obtener credential actual
        const credentialActual = await n8nClient.get(`/api/v1/credentials/${credentialId}`);

        // Actualizar con nuevo token
        await n8nClient.patch(`/api/v1/credentials/${credentialId}`, {
            name: credentialActual.data.data.name,
            type: credentialActual.data.data.type,
            data: {
                name: 'Authorization',
                value: `Bearer ${nuevoToken}`
            }
        });

        console.log('\n✅ Credential actualizada exitosamente en n8n');
        console.log('\n🔄 Probando endpoint con nuevo token...');

        // 3. Probar endpoint con nuevo token
        const backendClient = axios.create({
            baseURL: 'http://localhost:3000',
            headers: {
                'Authorization': `Bearer ${nuevoToken}`,
                'Content-Type': 'application/json'
            }
        });

        const response = await backendClient.get('/api/v1/servicios', {
            params: { activo: true }
        });

        console.log('\n✅ Endpoint funciona correctamente!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        process.exit(1);
    }
}

regenerarCredential();
