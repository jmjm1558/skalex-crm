import type { ExtensionOptions } from './options';
import type { DomSnapshot } from './wa';

export interface BridgeError {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface BridgeSuccess<TData> {
  ok: true;
  data: TData;
}

export interface BridgeFailure {
  ok: false;
  error: BridgeError;
}

export type BridgeResult<TData> = BridgeSuccess<TData> | BridgeFailure;

export function ok<TData>(data: TData): BridgeSuccess<TData> {
  return { ok: true, data };
}

export function err(code: string, message: string, meta?: Record<string, unknown>): BridgeFailure {
  return {
    ok: false,
    error: { code, message, meta }
  };
}

export interface BridgeRequestMap {
  GET_OPTIONS: undefined;
  SET_OPTIONS: Partial<ExtensionOptions>;
  API_FETCH: {
    endpoint: '/api/health';
    method: 'GET';
  };
  SNAPSHOT_UPDATE: DomSnapshot;
}

export interface BridgeResponseMap {
  GET_OPTIONS: ExtensionOptions;
  SET_OPTIONS: ExtensionOptions;
  API_FETCH: {
    status: number;
    body: unknown;
  };
  SNAPSHOT_UPDATE: { accepted: true };
}

export interface BridgeMessage<TType extends keyof BridgeRequestMap> {
  type: TType;
  requestId: string;
  payload: BridgeRequestMap[TType];
}
