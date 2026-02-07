/**
 * ====================================================================
 * useInvitacionTema
 * ====================================================================
 * Computa el tema con defaults desde INVITACION_TEMA_DEFAULT.
 *
 * Extraído de InvitacionEditorContext para reducir complejidad.
 *
 * @since 2026-02-07
 */

import { useMemo } from 'react';
import { INVITACION_TEMA_DEFAULT } from '../../constants';

/**
 * @param {Object|null} plantilla - evento?.plantilla o plantilla?.tema
 * @returns {Object} Tema con defaults aplicados
 */
export function useInvitacionTema(plantilla) {
  return useMemo(
    () => ({
      ...INVITACION_TEMA_DEFAULT,
      ...(plantilla || {}),
    }),
    [plantilla]
  );
}
