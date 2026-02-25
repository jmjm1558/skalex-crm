import type { DomSnapshot, WaChatIdentity, WaMessageKind, WaMessageLite } from '@skalex/shared';

const SNAPSHOT_DEBOUNCE_MS = 250;
const DEFAULT_MESSAGE_LIMIT = 20;
const CIRCUIT_BREAKER_THRESHOLD = 5;

interface ReadSnapshotOptions {
  maxMessages?: number;
  degraded?: boolean;
  parseFailures?: number;
}

interface ObserveSnapshotOptions {
  maxMessages?: number;
  onSnapshot: (snapshot: DomSnapshot) => void;
}

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
  const signals = [
    document.querySelector('div#app, div[role="application"]'),
    document.querySelector('#pane-side, #side, [data-testid="chat-list"]'),
    document.querySelector('#main, [data-testid="conversation-panel-body"]')
  ];

  return signals.every(Boolean);
}

function getActiveChatIdentity(): WaChatIdentity | null {
  const headerCandidates = [
    '[data-testid="conversation-info-header"] [dir="auto"]',
    '#main header [dir="auto"]',
    '#main header [title]'
  ];

  const displayName =
    headerCandidates
      .map((selector) => document.querySelector(selector)?.textContent?.trim() ?? '')
      .find(Boolean) ?? null;

  const idHint =
    document
      .querySelector('#main [data-id], #main [data-chat-id]')
      ?.getAttribute('data-id')
      ?.trim() ||
    document
      .querySelector('#main [data-id], #main [data-chat-id]')
      ?.getAttribute('data-chat-id')
      ?.trim() ||
    null;

  if (!displayName && !idHint) return null;

  return {
    displayName,
    waFingerprint: hashFingerprint([displayName ?? 'unknown', idHint ?? window.location.pathname].join('|'))
  };
}

function parseDirection(messageEl: Element): WaMessageLite['direction'] {
  const testId = messageEl.getAttribute('data-testid') ?? '';
  if (testId.includes('out')) return 'out';
  if (testId.includes('in')) return 'in';

  const className = messageEl.className;
  if (typeof className === 'string') {
    if (className.includes('message-out')) return 'out';
    if (className.includes('message-in')) return 'in';
  }

  if (messageEl.querySelector('[data-icon="msg-check"], [data-icon="msg-dblcheck"]')) return 'out';
  return 'unknown';
}

function parseTimestampMs(messageEl: Element): number | undefined {
  const prePlainText =
    messageEl.getAttribute('data-pre-plain-text') ??
    messageEl.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text') ??
    undefined;

  if (!prePlainText) return undefined;

  const match = prePlainText.match(/\[(.*?)\]/);
  if (!match?.[1]) return undefined;

  const stamp = match[1].replace(',', ' ').trim();
  const timeWithDate = stamp.match(/(\d{1,2}:\d{2})(?:\s+|,\s*)(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

  if (timeWithDate?.[1] && timeWithDate[2] && timeWithDate[3] && timeWithDate[4]) {
    const timeRaw = timeWithDate[1];
    const dayRaw = timeWithDate[2];
    const monthRaw = timeWithDate[3];
    const yearRaw = timeWithDate[4];
    const [hourRaw, minuteRaw] = timeRaw.split(':');
    const year = yearRaw.length === 2 ? Number(`20${yearRaw}`) : Number(yearRaw);
    const parsed = new Date(year, Number(monthRaw) - 1, Number(dayRaw), Number(hourRaw), Number(minuteRaw));
    const epoch = parsed.getTime();
    return Number.isFinite(epoch) ? epoch : undefined;
  }

  const timeOnly = stamp.match(/(\d{1,2}):(\d{2})/);
  if (!timeOnly?.[1] || !timeOnly[2]) return undefined;

  const now = new Date();
  now.setHours(Number(timeOnly[1]), Number(timeOnly[2]), 0, 0);
  const epoch = now.getTime();
  return Number.isFinite(epoch) ? epoch : undefined;
}

function extractTextCandidates(messageEl: Element): string[] {
  const nodes = messageEl.querySelectorAll(
    '[data-testid="msg-text"], .selectable-text span[dir], span.selectable-text, [data-testid="link-preview"] [dir="auto"]'
  );

  return Array.from(nodes)
    .map((node) => node.textContent?.trim() ?? '')
    .filter(Boolean);
}

function detectKind(messageEl: Element): WaMessageKind {
  if (messageEl.querySelector('[data-testid*="sticker" i], [aria-label*="sticker" i]')) return 'sticker';
  if (messageEl.querySelector('audio, [data-icon="audio-play"], [data-testid*="audio" i], [data-testid*="ptt" i]')) return 'voice';
  if (messageEl.querySelector('video, [data-testid*="video" i], [data-icon="media-play"]')) return 'video';
  if (messageEl.querySelector('[data-testid*="document" i], [data-icon="document"], [data-icon="doc"]')) return 'document';

  const anchor = messageEl.querySelector('a[href]');
  if (anchor) return 'link';

  const image = messageEl.querySelector('img');
  if (image && !messageEl.querySelector('[data-testid*="emoji" i]')) return 'image';

  const textCandidates = extractTextCandidates(messageEl);
  if (textCandidates.length > 0) return 'text';

  return 'unknown';
}

function pickText(kind: WaMessageKind, messageEl: Element): Pick<WaMessageLite, 'text' | 'caption'> {
  const texts = extractTextCandidates(messageEl);
  const first = texts[0];
  if (!first) return {};

  if (kind === 'text' || kind === 'link') {
    return { text: first };
  }

  if (kind === 'image' || kind === 'video' || kind === 'document') {
    return { caption: first };
  }

  return {};
}

function getMessageElements(): Element[] {
  const selectors = [
    '[data-testid="msg-container"]',
    '[data-testid="msg-container-in"]',
    '[data-testid="msg-container-out"]',
    '#main [data-pre-plain-text]'
  ].join(',');

  const candidates = Array.from(document.querySelectorAll(selectors));
  const unique = new Set<Element>();

  for (const candidate of candidates) {
    const container = candidate.closest('[data-testid^="msg-container"]') ?? candidate;
    if (isElementVisible(container)) unique.add(container);
  }

  return Array.from(unique);
}

function getVisibleMessages(limit = DEFAULT_MESSAGE_LIMIT): WaMessageLite[] {
  return getMessageElements()
    .slice(-limit)
    .map((messageEl, index) => {
      const kind = detectKind(messageEl);
      return {
        id: `${messageEl.getAttribute('data-id') ?? 'msg'}-${index}`,
        direction: parseDirection(messageEl),
        kind,
        ...pickText(kind, messageEl),
        timestampMs: parseTimestampMs(messageEl)
      };
    });
}

export function readSnapshot(options: ReadSnapshotOptions = {}): DomSnapshot {
  const safeLimit = Math.max(5, Math.min(50, options.maxMessages ?? DEFAULT_MESSAGE_LIMIT));

  return {
    isWaReady: detectWaReady(),
    composerFound: Boolean(document.querySelector('[contenteditable="true"][role="textbox"]')),
    activeChat: getActiveChatIdentity(),
    messages: getVisibleMessages(safeLimit),
    flags: {
      degraded: options.degraded ?? false,
      parseFailures: options.parseFailures ?? 0
    },
    capturedAt: new Date().toISOString()
  };
}

export function observeSnapshot({ maxMessages, onSnapshot }: ObserveSnapshotOptions): () => void {
  let debounceTimer: number | undefined;
  let parseFailures = 0;
  let degraded = false;

  const emit = (): void => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      if (degraded) {
        onSnapshot(readSnapshot({ maxMessages, degraded: true, parseFailures }));
        return;
      }

      try {
        onSnapshot(readSnapshot({ maxMessages, degraded: false, parseFailures }));
        parseFailures = 0;
      } catch {
        parseFailures += 1;
        if (parseFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          degraded = true;
          observer.disconnect();
        }
        onSnapshot(readSnapshot({ maxMessages, degraded, parseFailures }));
      }
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
