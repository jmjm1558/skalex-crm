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
    host.style.zIndex = '2147483647';
    document.body.append(host);
  }

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  if (!shadowRoot.getElementById('skalex-crm-style')) {
    const style = document.createElement('style');
    style.id = 'skalex-crm-style';
    style.textContent = cssText;
    shadowRoot.append(style);
  }

  return shadowRoot;
}

function mount(): void {
  const shadowRoot = ensureShadowRoot();
  let root = shadowRoot.getElementById(ROOT_ID);

  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    shadowRoot.append(root);
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <InjectedApp />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
