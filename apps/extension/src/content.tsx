import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import {
  DEFAULT_EXTENSION_OPTIONS,
  err,
  type BridgeMessage,
  type BridgeRequestMap,
  type BridgeResponseMap,
  type BridgeResult,
  type DomSnapshot,
  type ExtensionOptions
} from '@skalex/shared';

import cssText from './content.css?inline';
import { InjectedApp } from './injected/InjectedApp';
import { observeSnapshot, readSnapshot } from './wa/waAdapter';

const HOST_ID = 'skalex-crm-shadow-host';
const ROOT_ID = 'skalex-crm-root';
const WINDOW_MOUNT_GUARD = '__SKALEX_CRM_MOUNTED__';

function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function sendBridgeMessage<TType extends keyof BridgeRequestMap>(
  type: TType,
  payload: BridgeRequestMap[TType]
): Promise<BridgeResult<BridgeResponseMap[TType]>> {
  const message: BridgeMessage<TType> = { type, requestId: createRequestId(), payload };

  try {
    const response = (await chrome.runtime.sendMessage(message)) as BridgeResult<BridgeResponseMap[TType]>;
    return response ?? err('NO_RESPONSE', 'Background did not respond.');
  } catch {
    return err('RUNTIME_ERROR', 'Failed to contact background service worker.');
  }
}

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

function ContentRoot(): JSX.Element {
  const [options, setOptions] = useState<ExtensionOptions>(DEFAULT_EXTENSION_OPTIONS);
  const [snapshot, setSnapshot] = useState<DomSnapshot>(() =>
    readSnapshot({ maxMessages: DEFAULT_EXTENSION_OPTIONS.maxMessages })
  );

  useEffect(() => {
    let stopObserver: (() => void) | undefined;

    const start = async (): Promise<void> => {
      const result = await sendBridgeMessage('GET_OPTIONS', undefined);
      const resolved = result.ok ? result.data : DEFAULT_EXTENSION_OPTIONS;
      setOptions(resolved);
      setSnapshot(readSnapshot({ maxMessages: resolved.maxMessages }));

      stopObserver = observeSnapshot({
        maxMessages: resolved.maxMessages,
        onSnapshot: setSnapshot
      });
    };

    void start();

    return () => {
      stopObserver?.();
    };
  }, []);

  return <InjectedApp snapshot={snapshot} options={options} />;
}

function mount(): void {
  if ((window as Window & Record<string, unknown>)[WINDOW_MOUNT_GUARD]) return;
  if (document.getElementById(HOST_ID)) return;

  (window as Window & Record<string, unknown>)[WINDOW_MOUNT_GUARD] = true;

  const shadowRoot = ensureShadowRoot();
  let root = shadowRoot.getElementById(ROOT_ID);

  if (!root) {
    root = document.createElement('div');
    root.id = ROOT_ID;
    shadowRoot.append(root);
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ContentRoot />
    </React.StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
