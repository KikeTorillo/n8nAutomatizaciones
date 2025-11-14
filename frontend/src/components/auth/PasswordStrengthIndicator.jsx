import { useEffect, useState } from 'react';
import { authApi } from '@/services/api/endpoints';

/**
 * Componente que muestra la fortaleza de una contraseña en tiempo real
 * Evalúa la contraseña usando el endpoint del backend y muestra:
 * - Barra de progreso visual
 * - Nivel de fortaleza (Muy débil, Débil, Media, Fuerte, Muy fuerte)
 * - Lista de requisitos con checkmarks
 *
 * @param {Object} props
 * @param {string} props.password - Contraseña a evaluar
 * @param {Function} props.onChange - Callback con resultado de evaluación (opcional)
 */
const PasswordStrengthIndicator = ({ password, onChange }) => {
  const [evaluacion, setEvaluacion] = useState(null);
  const [evaluando, setEvaluando] = useState(false);

  // Función de evaluación local como fallback
  const evaluarLocal = (pwd) => {
    const requisitos = {
      longitud: pwd.length >= 8,
      mayuscula: /[A-Z]/.test(pwd),
      minuscula: /[a-z]/.test(pwd),
      numero: /[0-9]/.test(pwd),
    };

    // Contar solo requisitos obligatorios (sin carácter especial)
    const cumplidos = Object.values(requisitos).filter(Boolean).length;
    const puntuacion = (cumplidos / 4) * 100;

    // Determinar nivel según cumplimiento
    let nivel = 'muy_debil';
    if (cumplidos === 4) nivel = 'muy_fuerte';      // 100% - Todos los requisitos
    else if (cumplidos === 3) nivel = 'fuerte';     // 75% - 3 de 4
    else if (cumplidos === 2) nivel = 'media';      // 50% - 2 de 4
    else if (cumplidos === 1) nivel = 'debil';      // 25% - 1 de 4

    return {
      puntuacion: Math.round(puntuacion),
      nivel,
      cumple_requisitos: cumplidos === 4,
      requisitos,
      sugerencias: [],
    };
  };

  // Debounce para evitar requests excesivos
  useEffect(() => {
    let timeoutId = null;

    const evaluarPasswordDebounced = async (pwd) => {
      if (!pwd || pwd.length === 0) {
        setEvaluacion(null);
        onChange?.(null);
        return;
      }

      setEvaluando(true);

      try {
        const response = await authApi.evaluarFortaleza({ password: pwd });

        // Transformar respuesta del backend al formato esperado
        const backendData = response.data?.data || response.data || response;
        const evaluacionTransformada = {
          puntuacion: backendData.score || 0,
          nivel: (backendData.nivel || 'muy débil').toLowerCase().replace(' ', '_'),
          cumple_requisitos: backendData.cumple_requisitos || false,
          requisitos: {
            longitud: backendData.requisitos?.longitud_minima || false,
            mayuscula: backendData.requisitos?.mayusculas || false,
            minuscula: backendData.requisitos?.minusculas || false,
            numero: backendData.requisitos?.numeros || false,
          },
          sugerencias: backendData.recomendaciones || backendData.feedback || [],
        };

        setEvaluacion(evaluacionTransformada);
        onChange?.(evaluacionTransformada);
      } catch (error) {
        console.error('Error al evaluar contraseña:', error);
        // Evaluación local básica como fallback
        const evaluacionLocal = evaluarLocal(pwd);
        setEvaluacion(evaluacionLocal);
        onChange?.(evaluacionLocal);
      } finally {
        setEvaluando(false);
      }
    };

    if (password) {
      timeoutId = setTimeout(() => {
        evaluarPasswordDebounced(password);
      }, 500);
    } else {
      setEvaluacion(null);
      onChange?.(null);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [password, onChange]);


  if (!password || password.length === 0) {
    return null;
  }

  // Configuración de colores según nivel
  const nivelesConfig = {
    muy_debil: {
      color: 'bg-red-500',
      textColor: 'text-red-600',
      label: 'Muy débil',
      porcentaje: 20,
    },
    debil: {
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      label: 'Débil',
      porcentaje: 40,
    },
    media: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      label: 'Media',
      porcentaje: 60,
    },
    fuerte: {
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      label: 'Fuerte',
      porcentaje: 80,
    },
    muy_fuerte: {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      label: 'Muy fuerte',
      porcentaje: 100,
    },
  };

  const config = nivelesConfig[evaluacion?.nivel] || nivelesConfig.muy_debil;
  const requisitos = evaluacion?.requisitos || {};

  return (
    <div className="space-y-3 mt-2">
      {/* Barra de progreso */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Fortaleza:</span>
          <span className={`font-medium ${config.textColor}`}>
            {evaluando ? 'Evaluando...' : config.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${config.color}`}
            style={{
              width: `${evaluacion?.puntuacion || 0}%`,
              opacity: evaluando ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Requisitos:</p>
        <ul className="text-sm space-y-1">
          <li className={requisitos.longitud ? 'text-green-600' : 'text-gray-400'}>
            <span className="mr-2">{requisitos.longitud ? '✓' : '○'}</span>
            Mínimo 8 caracteres
          </li>
          <li className={requisitos.mayuscula ? 'text-green-600' : 'text-gray-400'}>
            <span className="mr-2">{requisitos.mayuscula ? '✓' : '○'}</span>
            Al menos una mayúscula
          </li>
          <li className={requisitos.minuscula ? 'text-green-600' : 'text-gray-400'}>
            <span className="mr-2">{requisitos.minuscula ? '✓' : '○'}</span>
            Al menos una minúscula
          </li>
          <li className={requisitos.numero ? 'text-green-600' : 'text-gray-400'}>
            <span className="mr-2">{requisitos.numero ? '✓' : '○'}</span>
            Al menos un número
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-2 italic">
          Los caracteres especiales son opcionales pero mejoran la seguridad
        </p>
      </div>

      {/* Sugerencias (si las hay) */}
      {evaluacion?.sugerencias && evaluacion.sugerencias.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-medium text-blue-700 mb-1">Sugerencias:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            {evaluacion.sugerencias.map((sugerencia, idx) => (
              <li key={idx}>• {sugerencia}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
