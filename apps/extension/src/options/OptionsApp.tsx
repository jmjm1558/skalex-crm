import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

import {
  DEFAULT_EXTENSION_OPTIONS,
  err,
  type BridgeMessage,
  type BridgeRequestMap,
  type BridgeResponseMap,
  type BridgeResult,
  type ExtensionOptions
} from '@skalex/shared';

import '../index.css';

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

function normalizeForm(form: ExtensionOptions): ExtensionOptions {
  return {
    backendBaseUrl: form.backendBaseUrl.trim(),
    maxMessages: Math.max(5, Math.min(50, Number(form.maxMessages) || DEFAULT_EXTENSION_OPTIONS.maxMessages)),
    debugMode: Boolean(form.debugMode)
  };
}

function OptionsApp(): JSX.Element {
  const [form, setForm] = useState<ExtensionOptions>(DEFAULT_EXTENSION_OPTIONS);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    void sendBridgeMessage('GET_OPTIONS', undefined).then((result) => {
      if (result.ok) {
        setForm(result.data);
      }
    });
  }, []);

  const save = async (): Promise<void> => {
    const payload = normalizeForm(form);
    const result = await sendBridgeMessage('SET_OPTIONS', payload);

    if (result.ok) {
      setForm(result.data);
      setStatus('Opciones guardadas.');
      return;
    }

    setStatus(`Error: ${result.error.message}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-semibold">Skalex CRM Options</h1>
      <p className="mt-2 text-sm text-slate-300">Configuración local de captura de snapshot (sin envío de chats).</p>

      <section className="mt-6 space-y-4 rounded border border-slate-700 bg-slate-900 p-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">backendBaseUrl</span>
          <input
            className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
            value={form.backendBaseUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, backendBaseUrl: event.target.value }))}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">maxMessages (5-50)</span>
          <input
            type="number"
            min={5}
            max={50}
            className="w-full rounded border border-slate-600 bg-slate-950 px-3 py-2"
            value={form.maxMessages}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                maxMessages: Number(event.target.value)
              }))
            }
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.debugMode}
            onChange={(event) => setForm((prev) => ({ ...prev, debugMode: event.target.checked }))}
          />
          debugMode
        </label>

        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            void save();
          }}
        >
          Guardar
        </button>

        {status && <p className="text-xs text-slate-300">{status}</p>}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<OptionsApp />);
