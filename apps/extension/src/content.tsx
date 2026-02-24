import React from 'react';
import ReactDOM from 'react-dom/client';

import cssText from './content.css?inline';
import { InjectedApp } from './injected/InjectedApp';

const HOST_ID = 'skalex-crm-shadow-host';
const ROOT_ID = 'skalex-crm-root';

function ensureShadowRoot(): ShadowRoot {
  let host = document.getElementById(HOST_ID);
  
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.right = '0';
    // Se utiliza el z-index máximo posible para asegurar que el CRM quede sobre cualquier otro elemento
    host.style.zIndex = '2147483647'; 
    document.body.append(host);
  }

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  // Inyectar los estilos dentro del Shadow DOM para que no afecten a la web huésped
  if (!shadowRoot.getElementById('skalex-crm-style')) {
    const style = document.createElement('style');
    style.id = 'skalex-crm-style';
    style.textContent = cssText;
    shadowRoot.append(style);
  }

  return shadowRoot;
}

function mount(): void {
  // 1. Candado global en la ventana (evita ejecución si el script corre 2 veces en memoria)
  if ((window as any).__SKALEX_CRM_MOUNTED__) {
    console.warn("SkaleX CRM ya está montado en la ventana.");
    return;
  }

  // 2. Candado del DOM (evita inyección si el contenedor ya existe en el HTML)
  if (document.getElementById(HOST_ID)) {
    console.warn("El host de SkaleX CRM ya existe en el DOM.");
    return;
  }

  // 3. Si pasamos los candados, marcamos la aplicación como montada
  (window as any).__SKALEX_CRM_MOUNTED__ = true;

  // 4. Aseguramos el Shadow Root y el contenedor de React
  const shadowRoot = ensureShadowRoot();
  let root = shadowRoot.getElementById(ROOT_ID);

  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    shadowRoot.append(root);
  }

  // 5. Renderizamos la aplicación inyectada
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <InjectedApp />
    </React.StrictMode>
  );
}

// Inicialización: Esperar a que el DOM esté listo o ejecutar inmediatamente si ya cargó
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}