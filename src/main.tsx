import {createRoot} from 'react-dom/client';
import 'katex/dist/katex.min.css';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import BrowserCompatibilityGate from './components/BrowserCompatibilityGate';
import { ExtensionManager } from './wiki/core/ExtensionManager';

// Registra o Service Worker do aplicativo (Computador & Celular PWA)
registerSW({
  immediate: true,
  onOfflineReady() {
    // Aplicativo pronto para uso offline
  },
});

// Inicializa o barramento completo de extensões modulares (Wiki-alternative)
ExtensionManager.getInstance()
  .loadExtensionsFromGlob()
  .catch((err) => {
    console.error('[ExtensionManager] Falha ao carregar extensões dinâmicas:', err);
  });

createRoot(document.getElementById('root')!).render(
  <BrowserCompatibilityGate>
    <App />
  </BrowserCompatibilityGate>
);
