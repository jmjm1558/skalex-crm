import React from 'react';
import ReactDOM from 'react-dom/client';

import cssText from './content.css?inline';
import { InjectedApp } from './injected/InjectedApp';

const HOST_ID = 'skalex-crm-shadow-host';
const ROOT_ID = 'skalex-crm-root';
const STYLE_ID = 'skalex-crm-style';
const MOUNT_ATTR = 'data-skalex-crm-mounted';

function ensureHost(): HTMLDivElement {
  let host = document.getElementById(HOST_ID) as HTMLDivElement | null;

  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.append(host);
  }

  // Re-aplicar estilos siempre (idempotente)
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.right = '0';
  host.style.zIndex = '2147483647';

  return host;
}

function ensureShadowRoot(host: HTMLElement): ShadowRoot {
  return host.shadowRoot ?? host.attachShadow({ mode: 'open' });
}

function ensureStyle(shadowRoot: ShadowRoot): void {
  if (!shadowRoot.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = cssText;
    shadowRoot.append(style);
  }
}

function ensureRoot(shadowRoot: ShadowRoot): HTMLDivElement {
  let root = shadowRoot.getElementById(ROOT_ID) as HTMLDivElement | null;
  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    shadowRoot.append(root);
  }
  return root;
}

function mount(): void {
  // Guard mínimo: si no hay body todavía, reintenta
  if (!document.body) {
    setTimeout(mount, 50);
    return;
  }

  const host = ensureHost();
  const shadowRoot = ensureShadowRoot(host);
  ensureStyle(shadowRoot);
  const root = ensureRoot(shadowRoot);

  // Idempotencia: si ya montamos, no dupliques panel
  if (root.getAttribute(MOUNT_ATTR) === '1') return;
  root.setAttribute(MOUNT_ATTR, '1');

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