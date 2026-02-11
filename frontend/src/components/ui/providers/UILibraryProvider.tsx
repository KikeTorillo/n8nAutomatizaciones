/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';
import {
  UILibraryMessagesProvider,
  type UILibraryMessagesProviderProps,
} from './UILibraryMessages';
import type { UILibraryMessages } from './messages/types';

export interface UILibraryRouterContext {
  navigate?: (to: string | number) => void;
  currentPath?: string;
}

const UILibraryContext = createContext<UILibraryRouterContext | null>(null);

export interface UILibraryProviderProps extends UILibraryRouterContext {
  messages?: UILibraryMessagesProviderProps['messages'];
  children: ReactNode;
}

/**
 * Provider para inyectar dependencias de router y mensajes en la UI Library.
 * Esto permite que la UI Library sea agnóstica del router e idioma usados.
 */
export function UILibraryProvider({
  navigate,
  currentPath,
  messages,
  children,
}: UILibraryProviderProps) {
  return (
    <UILibraryContext.Provider value={{ navigate, currentPath }}>
      <UILibraryMessagesProvider messages={messages}>
        {children}
      </UILibraryMessagesProvider>
    </UILibraryContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de router inyectado.
 * Retorna null si no hay provider (la UI Library funciona sin él).
 */
export function useUILibraryRouter(): UILibraryRouterContext | null {
  return useContext(UILibraryContext);
}

export type { UILibraryMessages };
