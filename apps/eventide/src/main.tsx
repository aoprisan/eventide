import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts so the PWA stays fully offline.
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/albert-sans';

import './styles/global.css';
import { App } from './App.js';
import { EngineProvider } from './engine/EngineContext.js';
import { PwaProvider } from './pwa/PwaContext.js';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaProvider>
      <EngineProvider>
        <App />
      </EngineProvider>
    </PwaProvider>
  </StrictMode>,
);
