/**
 * ====================================================================
 * CONFIGURACIÓN MERCADO PAGO
 * ====================================================================
 *
 * Archivo de configuración centralizado para la integración con Mercado Pago.
 *
 * AMBIENTES:
 * - sandbox: Para pruebas (usa credenciales TEST-)
 * - production: Para producción (usa credenciales APP_USR-)
 *
 * SEGURIDAD:
 * - Todas las credenciales vienen de variables de entorno
 * - NUNCA hardcodear credenciales en el código
 * - Usar MERCADOPAGO_WEBHOOK_SECRET para validar webhooks
 *
 * @module config/mercadopago
 */

require('dotenv').config();

const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox';
const isSandbox = environment === 'sandbox';

module.exports = {
  // ====================================================================
  // CREDENCIALES
  // ====================================================================
  accessToken: isSandbox
    ? process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN
    : process.env.MERCADOPAGO_ACCESS_TOKEN,

  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,

  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,

  // ====================================================================
  // AMBIENTE
  // ====================================================================
  environment: environment,
  isSandbox: isSandbox,
  isProduction: !isSandbox,

  // ====================================================================
  // URLS
  // ====================================================================
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',

  // URL de retorno después del pago
  returnUrl: (process.env.FRONTEND_URL || 'http://localhost:8080') + '/payment/callback',

  // ====================================================================
  // CONFIGURACIÓN MÉXICO
  // ====================================================================
  country: 'MX',
  currency: 'MXN',
  locale: 'es-MX',

  // ====================================================================
  // TIMEOUTS Y REINTENTOS
  // ====================================================================
  timeout: 5000, // 5 segundos
  maxRetries: 3,

  // ====================================================================
  // VALIDACIÓN
  // ====================================================================
  /**
   * Valida que todas las variables de entorno requeridas estén configuradas
   * @throws {Error} Si falta alguna variable crítica
   */
  validate() {
    const requiredVars = [
      isSandbox ? 'MERCADOPAGO_SANDBOX_ACCESS_TOKEN' : 'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_PUBLIC_KEY',
      'MERCADOPAGO_WEBHOOK_SECRET',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `❌ Faltan variables de entorno requeridas para Mercado Pago: ${missing.join(', ')}\n` +
        `   Asegúrate de configurar estas variables en tu archivo .env`
      );
    }

    // Validar que el access token no esté vacío
    if (!this.accessToken || this.accessToken.trim() === '') {
      throw new Error('❌ MERCADOPAGO_ACCESS_TOKEN está vacío');
    }

    // Validar formato del access token (debe empezar con TEST- o APP_USR-)
    if (isSandbox && !this.accessToken.startsWith('TEST-')) {
      console.warn(
        '⚠️  ADVERTENCIA: Estás en modo sandbox pero el access token no empieza con TEST-'
      );
    }

    if (!isSandbox && !this.accessToken.startsWith('APP_USR-')) {
      console.warn(
        '⚠️  ADVERTENCIA: Estás en modo production pero el access token no empieza con APP_USR-'
      );
    }

    console.log('✅ Configuración de Mercado Pago validada correctamente');
    console.log(`   Ambiente: ${this.environment}`);
    console.log(`   País: ${this.country}`);
    console.log(`   Moneda: ${this.currency}`);
  }
};
