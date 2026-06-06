import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts so the PWA stays fully offline.
import '@fontsource-variable/fraunces';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/500.css';
import '@fontsource/hanken-grotesk/600.css';

import './styles/global.css';
import { App } from './App.js';
import { EngineProvider } from './engine/EngineContext.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EngineProvider>
      <App />
    </EngineProvider>
  </StrictMode>,
);
