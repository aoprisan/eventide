import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavContext, type Nav, type Route } from './nav.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { SetupScreen } from './screens/SetupScreen.js';
import { SessionScreen } from './screens/SessionScreen.js';
import { TonightScreen } from './screens/TonightScreen.js';
import { TonightRunScreen } from './screens/TonightRunScreen.js';
import { InsightsScreen } from './screens/InsightsScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';

export function App() {
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);

  const push = useCallback((route: Route) => {
    setStack((s) => [...s, route]);
    window.scrollTo?.(0, 0);
  }, []);
  const back = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);
  const home = useCallback(() => setStack([{ name: 'home' }]), []);

  // Wire the hardware/browser back button to our stack.
  useEffect(() => {
    history.pushState({ depth: stack.length }, '');
    const onPop = () => {
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [stack.length]);

  const route = stack[stack.length - 1];
  const nav: Nav = useMemo(
    () => ({ route, push, back, home, canGoBack: stack.length > 1 }),
    [route, push, back, home, stack.length],
  );

  return (
    <NavContext.Provider value={nav}>
      <div className="sky" />
      <div className="grain" />
      <Screen key={routeKey(route, stack.length)} route={route} />
    </NavContext.Provider>
  );
}

function routeKey(route: Route, depth: number): string {
  return `${route.name}-${depth}`;
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'setup':
      return <SetupScreen module={route.module} />;
    case 'session':
      return <SessionScreen spec={route.spec} title={route.title} />;
    case 'tonight':
      return <TonightScreen />;
    case 'tonight-run':
      return <TonightRunScreen ritual={route.ritual} />;
    case 'insights':
      return <InsightsScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}
