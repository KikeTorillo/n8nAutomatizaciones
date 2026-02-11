/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react';

export interface UILibraryRouterContext {
  navigate?: (to: string | number) => void;
  currentPath?: string;
}

const UILibraryContext = createContext<UILibraryRouterContext | null>(null);

export interface UILibraryProviderProps extends UILibraryRouterContext {
  children: ReactNode;
}

/**
 * Provider para inyectar dependencias de router en la UI Library.
 * Esto permite que la UI Library sea agnóstica del router usado.
 */
export function UILibraryProvider({
  navigate,
  currentPath,
  children,
}: UILibraryProviderProps) {
  return (
    <UILibraryContext.Provider value={{ navigate, currentPath }}>
      {children}
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
