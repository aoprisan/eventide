import { createContext, useContext } from 'react';
import type { Ritual, SessionSpec } from '@eventide/engine';

export type Route =
  | { name: 'home' }
  | { name: 'setup'; module: 'breath' | 'candle' | 'meditation' }
  | { name: 'session'; spec: SessionSpec; title: string }
  | { name: 'tonight' }
  | { name: 'tonight-run'; ritual: Ritual }
  | { name: 'insights' }
  | { name: 'settings' };

export interface Nav {
  route: Route;
  push: (route: Route) => void;
  back: () => void;
  home: () => void;
  canGoBack: boolean;
}

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav must be used within NavContext');
  return nav;
}
