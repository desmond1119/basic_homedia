import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './core/store/store';
import { initSentry } from './core/config/sentry';
import { pluginManager } from './core/services/PluginManager';
import './i18n';
import './index.css';

initSentry();

(async () => {
  try {
    await pluginManager.loadAll();
  } catch (error) {
    console.error('Failed to load plugins:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
})();
