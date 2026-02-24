import { CRMEventType } from '@skalex/shared';

export function App(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-xl p-6">
      <h1 className="text-2xl font-bold">WhatsApp Web CRM Extension</h1>
      <p className="mt-3 text-slate-300">MV3 + Vite + React + TypeScript + Tailwind scaffold.</p>
      <p className="mt-4 rounded bg-slate-800 p-3 text-sm text-slate-200">
        Shared type loaded from package: <strong>{CRMEventType.CONTACT_SYNCED}</strong>
      </p>
    </main>
  );
}
