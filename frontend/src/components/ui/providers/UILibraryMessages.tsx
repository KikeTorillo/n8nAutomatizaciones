/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { esMessages } from './messages/es';
import type { UILibraryMessages } from './messages/types';

const UIMessagesContext = createContext<UILibraryMessages>(esMessages);

export interface UILibraryMessagesProviderProps {
  messages?: Partial<UILibraryMessages>;
  children: ReactNode;
}

function deepMerge(
  base: UILibraryMessages,
  override: Partial<UILibraryMessages>
): UILibraryMessages {
  const result = { ...base } as Record<string, Record<string, string>>;
  for (const section of Object.keys(override) as (keyof UILibraryMessages)[]) {
    const overrideSection = override[section];
    if (overrideSection && typeof overrideSection === 'object') {
      result[section] = { ...result[section], ...overrideSection };
    }
  }
  return result as unknown as UILibraryMessages;
}

export function UILibraryMessagesProvider({
  messages,
  children,
}: UILibraryMessagesProviderProps) {
  const merged = useMemo(
    () => (messages ? deepMerge(esMessages, messages) : esMessages),
    [messages]
  );

  return (
    <UIMessagesContext.Provider value={merged}>
      {children}
    </UIMessagesContext.Provider>
  );
}

/**
 * Hook para acceder a los mensajes de la UI Library.
 * Retorna el preset español por defecto si no hay provider.
 */
export function useUIMessages(): UILibraryMessages {
  return useContext(UIMessagesContext);
}
