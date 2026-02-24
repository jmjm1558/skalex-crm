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
