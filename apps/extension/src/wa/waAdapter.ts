import type { DomSnapshot, WaMessageLite } from '@skalex/shared';

const SNAPSHOT_DEBOUNCE_MS = 250;
const DEFAULT_MESSAGE_LIMIT = 20;

function hashFingerprint(value: string): string {
  let hash = 5381;
  for (const char of value) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }

  return `wa-${(hash >>> 0).toString(16)}`;
}

function isElementVisible(node: Element): boolean {
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function detectWaReady(): boolean {
  const appRoot = document.querySelector('div#app, div[role="application"]');
  const sidePane = document.querySelector('#side, [data-testid="chat-list"]');
  const mainPane = document.querySelector('#main, [data-testid="conversation-panel-body"]');

  return Boolean(appRoot && sidePane && mainPane);
}

function getActiveChatIdentity(): DomSnapshot['activeChat'] {
  const headerCandidates = [
    '[data-testid="conversation-info-header"] [dir="auto"]',
    '#main header [dir="auto"]',
    'header [title]'
  ];

  const displayName = headerCandidates
    .map((selector) => document.querySelector(selector)?.textContent?.trim() ?? '')
    .find(Boolean) ?? null;

  const hints = [
    displayName,
    window.location.pathname,
    document.querySelector('[data-testid="conversation-panel-wrapper"]')?.getAttribute('aria-label')
  ]
    .filter(Boolean)
    .join('|');

  return {
    displayName,
    waFingerprint: hashFingerprint(hints || 'unknown-chat')
  };
}

function parseDirection(messageEl: Element): WaMessageLite['direction'] {
  const attr = messageEl.getAttribute('data-testid') ?? '';
  if (attr.includes('out')) return 'out';
  if (attr.includes('in')) return 'in';

  if (messageEl.querySelector('[data-icon="msg-dblcheck"], [data-icon="msg-check"]')) {
    return 'out';
  }

  if (messageEl.querySelector('[data-icon="default-user"], [data-icon="down-context"]')) {
    return 'in';
  }

  return 'unknown';
}

function parseText(messageEl: Element): string {
  const textNode =
    messageEl.querySelector('[data-testid="msg-text"]') ??
    messageEl.querySelector('.selectable-text span') ??
    messageEl.querySelector('span[dir="ltr"], span[dir="auto"]');

  const text = textNode?.textContent?.trim();
  return text && text.length > 0 ? text : '[non-text]';
}

function parseTimestamp(messageEl: Element): string | undefined {
  const prePlainText = messageEl.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text');
  if (!prePlainText) return undefined;

  const match = prePlainText.match(/\[(.*?)\]/);
  return match?.[1];
}

function getMessageElements(): Element[] {
  const candidates = Array.from(
    document.querySelectorAll(
      [
        '[data-testid="msg-container"]',
        '[data-testid="msg-container-in"]',
        '[data-testid="msg-container-out"]',
        '#main [data-pre-plain-text]'
      ].join(',')
    )
  );

  const unique = new Set<Element>();
  for (const candidate of candidates) {
    const container = candidate.closest('[data-testid^="msg-container"]') ?? candidate;
    if (isElementVisible(container)) {
      unique.add(container);
    }
  }

  return Array.from(unique);
}

function getVisibleMessages(limit = DEFAULT_MESSAGE_LIMIT): WaMessageLite[] {
  const elements = getMessageElements();

  return elements.slice(-limit).map((messageEl, index) => ({
    id: `${messageEl.getAttribute('data-id') ?? 'msg'}-${index}`,
    direction: parseDirection(messageEl),
    text: parseText(messageEl),
    timestamp: parseTimestamp(messageEl)
  }));
}

export function readSnapshot(): DomSnapshot {
  return {
    isWaReady: detectWaReady(),
    composerFound: Boolean(document.querySelector('[contenteditable="true"][role="textbox"]')),
    activeChat: getActiveChatIdentity(),
    messages: getVisibleMessages(),
    capturedAt: new Date().toISOString()
  };
}

export function observeSnapshot(onSnapshot: (snapshot: DomSnapshot) => void): () => void {
  let debounceTimer: number | undefined;

  const emit = (): void => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      onSnapshot(readSnapshot());
    }, SNAPSHOT_DEBOUNCE_MS);
  };

  const observer = new MutationObserver(() => {
    emit();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });

  emit();

  return () => {
    observer.disconnect();
    window.clearTimeout(debounceTimer);
  };
}
