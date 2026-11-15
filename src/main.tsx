import {createRoot} from 'react-dom/client';
import 'katex/dist/katex.min.css';
import App from './App.tsx';
import './index.css';
import BrowserCompatibilityGate from './components/BrowserCompatibilityGate';
import { ExtensionManager } from './wiki/core/ExtensionManager';

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
