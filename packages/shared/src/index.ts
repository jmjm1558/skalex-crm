import { z } from 'zod';

export enum CRMEventType {
  CONTACT_SYNCED = 'CONTACT_SYNCED',
  MESSAGE_DRAFTED = 'MESSAGE_DRAFTED'
}

export interface ContactDTO {
  id: string;
  displayName: string;
  phone: string;
}

export const ContactSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  phone: z.string().min(6)
});

export interface WaChatIdentity {
  displayName: string | null;
  waFingerprint: string;
}

export interface WaMessageLite {
  id: string;
  direction: 'in' | 'out' | 'unknown';
  text: string;
  timestamp?: string;
}

export interface DomSnapshot {
  isWaReady: boolean;
  composerFound: boolean;
  activeChat: WaChatIdentity;
  messages: WaMessageLite[];
  capturedAt: string;
}
