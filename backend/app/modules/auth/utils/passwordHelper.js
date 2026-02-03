/**
 * @fileoverview Helper para manejo y validación de contraseñas
 * @description Utilidades reutilizables para evaluación de fortaleza de contraseñas
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

class PasswordHelper {
    /**
     * Evalúa la fortaleza de una contraseña
     *
     * POLÍTICA DE CONTRASEÑAS (homologada con frontend):
     * - Mínimo 8 caracteres (OBLIGATORIO)
     * - Al menos 1 mayúscula (OBLIGATORIO)
     * - Al menos 1 minúscula (OBLIGATORIO)
     * - Al menos 1 número (OBLIGATORIO)
     * - Caracteres especiales: OPCIONALES (mejoran score)
     *
     * @param {string} password - Contraseña a evaluar
     * @returns {Object} Resultado de la evaluación con score, nivel, feedback y recomendaciones
     */
    static evaluarFortaleza(password) {
        let score = 0;
        let feedback = [];

        // Validar requisitos individuales
        const requisitos = {
            longitud_minima: password.length >= 8,
            mayusculas: /[A-Z]/.test(password),
            minusculas: /[a-z]/.test(password),
            numeros: /\d/.test(password),
        };

        // Caracteres especiales son OPCIONALES (no se incluyen en requisitos base)
        const tieneCaracteresEspeciales = /[^A-Za-z0-9]/.test(password);

        // Requisitos OBLIGATORIOS (25 puntos cada uno = 100 puntos total)
        if (requisitos.longitud_minima) score += 25;
        else feedback.push('Debe tener al menos 8 caracteres');

        if (requisitos.minusculas) score += 25;
        else feedback.push('Debe incluir letras minúsculas');

        if (requisitos.mayusculas) score += 25;
        else feedback.push('Debe incluir letras mayúsculas');

        if (requisitos.numeros) score += 25;
        else feedback.push('Debe incluir números');

        // BONIFICACIONES OPCIONALES (mejoran la puntuación)
        // Longitud extra: +10 puntos
        if (password.length >= 12) score += 10;

        // Caracteres especiales: +10 puntos (OPCIONAL, no requerido)
        if (tieneCaracteresEspeciales) score += 10;

        // Nivel de fortaleza basado en requisitos obligatorios
        let nivel;
        if (score < 25) nivel = 'muy débil';      // 0 requisitos
        else if (score < 50) nivel = 'débil';     // 1 requisito
        else if (score < 75) nivel = 'media';     // 2 requisitos
        else if (score < 100) nivel = 'fuerte';   // 3 requisitos
        else nivel = 'muy fuerte';                // 4 requisitos (100+ con bonificaciones)

        // Calcular requisitos cumplidos (solo los 4 obligatorios)
        const requisitosCumplidos = Object.values(requisitos).filter(Boolean).length;
        const cumpleTodos = requisitosCumplidos === 4;

        return {
            score: Math.min(score, 120), // Máximo 120 (100 base + 20 bonificaciones)
            nivel: nivel,
            requisitos: requisitos,
            cumple_requisitos: cumpleTodos,
            feedback: feedback,
            recomendaciones: !cumpleTodos ? [
                'Asegúrate de cumplir los 4 requisitos obligatorios',
                'Usa al menos 12 caracteres para mayor seguridad',
                'Los caracteres especiales son opcionales pero mejoran la seguridad'
            ] : []
        };
    }

    /**
     * Verifica si una contraseña cumple con los requisitos mínimos
     * @param {string} password - Contraseña a verificar
     * @returns {boolean} True si cumple los requisitos
     */
    static cumpleRequisitosMinimos(password) {
        const resultado = this.evaluarFortaleza(password);
        return resultado.cumple_requisitos;
    }

    /**
     * Genera una contraseña aleatoria segura
     * Usa SecureRandom para seguridad criptográfica
     * @param {number} length - Longitud de la contraseña (default: 12)
     * @returns {string} Contraseña generada
     */
    static generarPasswordSegura(length = 12) {
        const SecureRandom = require('../../../utils/helpers/SecureRandom');

        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*(),.?":{}|<>';

        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';

        // Garantizar al menos un caracter de cada tipo (crypto-secure)
        password += SecureRandom.char(lowercase);
        password += SecureRandom.char(uppercase);
        password += SecureRandom.char(numbers);
        password += SecureRandom.char(symbols);

        // Rellenar el resto (crypto-secure)
        for (let i = password.length; i < length; i++) {
            password += SecureRandom.char(allChars);
        }

        // Mezclar caracteres con Fisher-Yates (crypto-secure)
        const chars = password.split('');
        SecureRandom.shuffle(chars);
        return chars.join('');
    }
}

module.exports = PasswordHelper;
