import { z } from 'zod';

export const ExtensionOptionsSchema = z.object({
  backendBaseUrl: z.string().url(),
  maxMessages: z.number().int().min(5).max(50),
  debugMode: z.boolean()
});

export type ExtensionOptions = z.infer<typeof ExtensionOptionsSchema>;

export const DEFAULT_EXTENSION_OPTIONS: ExtensionOptions = {
  backendBaseUrl: 'http://localhost:3000',
  maxMessages: 20,
  debugMode: false
};
