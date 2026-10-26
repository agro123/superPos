import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ConfigErrorScreen } from './app/pages/ConfigErrorScreen';
import { registerServiceWorker } from './app/pwa';
import { getFirebase } from './shared/infrastructure/firebase/app';
import './app/styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Falta el elemento #root');

let content = <App />;
try {
  getFirebase();
} catch (error) {
  content = <ConfigErrorScreen error={error} />;
}

registerServiceWorker();
createRoot(container).render(<StrictMode>{content}</StrictMode>);
