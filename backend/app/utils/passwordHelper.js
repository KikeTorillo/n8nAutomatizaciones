/**
 * @fileoverview Helper para manejo y validación de contraseñas
 * @description Utilidades reutilizables para evaluación de fortaleza de contraseñas
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

class PasswordHelper {
    /**
     * Evalúa la fortaleza de una contraseña
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
            caracteres_especiales: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Longitud
        if (requisitos.longitud_minima) score += 20;
        else feedback.push('Debe tener al menos 8 caracteres');

        if (password.length >= 12) score += 10;

        // Complejidad
        if (requisitos.minusculas) score += 15;
        else feedback.push('Debe incluir letras minúsculas');

        if (requisitos.mayusculas) score += 15;
        else feedback.push('Debe incluir letras mayúsculas');

        if (requisitos.numeros) score += 15;
        else feedback.push('Debe incluir números');

        if (requisitos.caracteres_especiales) score += 25;
        else feedback.push('Debe incluir caracteres especiales');

        // Nivel de fortaleza
        let nivel;
        if (score < 40) nivel = 'muy débil';
        else if (score < 60) nivel = 'débil';
        else if (score < 80) nivel = 'moderada';
        else if (score < 90) nivel = 'fuerte';
        else nivel = 'muy fuerte';

        return {
            score: score,
            nivel: nivel,
            requisitos: requisitos,
            cumple_requisitos: score >= 65,
            feedback: feedback,
            recomendaciones: score < 65 ? [
                'Usa al menos 12 caracteres',
                'Combina mayúsculas, minúsculas, números y símbolos',
                'Evita patrones obvios o información personal'
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
     * @param {number} length - Longitud de la contraseña (default: 12)
     * @returns {string} Contraseña generada
     */
    static generarPasswordSegura(length = 12) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*(),.?":{}|<>';

        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';

        // Garantizar al menos un caracter de cada tipo
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Rellenar el resto
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Mezclar caracteres
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
}

module.exports = PasswordHelper;
