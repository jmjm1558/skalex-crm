import {
  DEFAULT_EXTENSION_OPTIONS,
  ExtensionOptionsSchema,
  err,
  ok,
  type BridgeMessage,
  type BridgeRequestMap,
  type BridgeResponseMap,
  type BridgeResult,
  type ExtensionOptions
} from '@skalex/shared';

const OPTIONS_STORAGE_KEY = 'extensionOptions';

function safeInfo(message: string, meta?: Record<string, unknown>): void {
  console.info(`[Skalex CRM] ${message}`, meta ?? {});
}

async function readStoredOptions(): Promise<ExtensionOptions> {
  const data = await chrome.storage.sync.get(OPTIONS_STORAGE_KEY);
  const stored = data[OPTIONS_STORAGE_KEY];
  const merged = {
    ...DEFAULT_EXTENSION_OPTIONS,
    ...(stored && typeof stored === 'object' ? (stored as Partial<ExtensionOptions>) : {})
  };

  const parsed = ExtensionOptionsSchema.safeParse(merged);
  if (!parsed.success) {
    return DEFAULT_EXTENSION_OPTIONS;
  }

  return parsed.data;
}

async function storeOptions(payload: Partial<ExtensionOptions>): Promise<BridgeResult<ExtensionOptions>> {
  const next = { ...(await readStoredOptions()), ...payload };
  const parsed = ExtensionOptionsSchema.safeParse(next);

  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid extension options payload.', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
  }

  await chrome.storage.sync.set({ [OPTIONS_STORAGE_KEY]: parsed.data });
  return ok(parsed.data);
}

async function handleApiFetch(endpoint: '/api/health', method: 'GET'): Promise<BridgeResult<{ status: number; body: unknown }>> {
  if (endpoint !== '/api/health' || method !== 'GET') {
    return err('UNSUPPORTED_API_FETCH', 'Only GET /api/health is available in this phase.');
  }

  const { backendBaseUrl } = await readStoredOptions();

  try {
    const response = await fetch(new URL(endpoint, backendBaseUrl).toString(), { method: 'GET' });
    let body: unknown = null;

    try {
      body = await response.json();
    } catch {
      body = { ok: response.ok };
    }

    return ok({ status: response.status, body });
  } catch {
    return err('API_UNREACHABLE', 'Unable to reach backend health endpoint.');
  }
}

async function routeMessage<TType extends keyof BridgeRequestMap>(
  message: BridgeMessage<TType>
): Promise<BridgeResult<BridgeResponseMap[TType]>> {
  switch (message.type) {
    case 'GET_OPTIONS':
      return ok((await readStoredOptions()) as BridgeResponseMap[TType]);
    case 'SET_OPTIONS':
      return (await storeOptions(message.payload as Partial<ExtensionOptions>)) as BridgeResult<BridgeResponseMap[TType]>;
    case 'API_FETCH': {
      const payload = message.payload as BridgeRequestMap['API_FETCH'];
      return (await handleApiFetch(payload.endpoint, payload.method)) as BridgeResult<BridgeResponseMap[TType]>;
    }
    case 'SNAPSHOT_UPDATE':
      return ok({ accepted: true } as BridgeResponseMap[TType]);
    default:
      return err('UNKNOWN_MESSAGE', 'Unsupported bridge message type.');
  }
}

chrome.runtime.onInstalled.addListener(() => {
  safeInfo('Extension installed.');
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const incoming = message as Partial<BridgeMessage<keyof BridgeRequestMap>>;

  if (!incoming?.type || !incoming?.requestId) {
    sendResponse(err('BAD_REQUEST', 'Malformed bridge message.'));
    return false;
  }

  void routeMessage(incoming as BridgeMessage<keyof BridgeRequestMap>)
    .then((result) => {
      if (incoming.type === 'SET_OPTIONS' || incoming.type === 'GET_OPTIONS') {
        safeInfo('Options request handled.', { type: incoming.type });
      }

      sendResponse(result);
    })
    .catch(() => {
      sendResponse(err('INTERNAL_ERROR', 'Unexpected background handler error.'));
    });

  return true;
});
