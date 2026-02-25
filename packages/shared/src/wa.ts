export type WaMessageKind =
  | 'text'
  | 'image'
  | 'video'
  | 'sticker'
  | 'voice'
  | 'document'
  | 'link'
  | 'unknown';

export interface WaChatIdentity {
  displayName: string | null;
  waFingerprint: string;
}

export interface WaMessageLite {
  id: string;
  direction: 'in' | 'out' | 'unknown';
  kind: WaMessageKind;
  text?: string;
  caption?: string;
  timestampMs?: number;
}

export interface DomSnapshotFlags {
  degraded: boolean;
  parseFailures: number;
}

export interface DomSnapshot {
  isWaReady: boolean;
  composerFound: boolean;
  activeChat: WaChatIdentity | null;
  messages: WaMessageLite[];
  flags: DomSnapshotFlags;
  capturedAt: string;
}
