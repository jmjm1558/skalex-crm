import { useEffect, useMemo, useState } from 'react';

import type { DomSnapshot } from '@skalex/shared';

import { observeSnapshot, readSnapshot } from '../wa/waAdapter';

type TabKey = 'overview' | 'pipeline' | 'tags' | 'templates' | 'ai' | 'queue';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'tags', label: 'Tags' },
  { key: 'templates', label: 'Templates' },
  { key: 'ai', label: 'AI' },
  { key: 'queue', label: 'Queue' }
];

function Placeholder({ title }: { title: string }): JSX.Element {
  return <p className="text-sm text-slate-300">{title} is planned for a future phase.</p>;
}

export function InjectedApp(): JSX.Element {
  const [tab, setTab] = useState<TabKey>('overview');
  const [snapshot, setSnapshot] = useState<DomSnapshot>(() => readSnapshot());

  useEffect(() => observeSnapshot(setSnapshot), []);

  const messageCount = useMemo(() => snapshot.messages.length, [snapshot.messages.length]);

  return (
    <aside className="fixed right-0 top-0 z-[2147483647] flex h-screen w-[380px] flex-col border-l border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
      <header className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-lg font-semibold">Skalex CRM</h2>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-700 px-3 py-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`rounded px-2 py-1 text-xs ${
              tab === item.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
            }`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="flex-1 overflow-y-auto p-4">
        {tab === 'overview' && (
          <div className="space-y-3 text-sm">
            <div className="rounded border border-slate-700 bg-slate-900 p-3">
              <p>
                <span className="font-semibold">WA Ready:</span>{' '}
                {snapshot.isWaReady ? 'true' : 'false'}
              </p>
              <p>
                <span className="font-semibold">Active chat:</span>{' '}
                {snapshot.activeChat.displayName ?? 'Unknown'}
              </p>
              <p className="break-all">
                <span className="font-semibold">Fingerprint:</span>{' '}
                {snapshot.activeChat.waFingerprint}
              </p>
              <p>
                <span className="font-semibold">composerFound:</span>{' '}
                {snapshot.composerFound ? 'true' : 'false'}
              </p>
              <p>
                <span className="font-semibold">Messages captured:</span> {messageCount}
              </p>
            </div>

            <div className="space-y-2">
              {snapshot.messages.map((message) => (
                <article key={message.id} className="rounded border border-slate-800 bg-slate-900 p-2">
                  <p className="text-xs text-slate-400">
                    [{message.direction}] {message.timestamp ?? 'time n/a'}
                  </p>
                  <p className="text-sm text-slate-200">{message.text}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === 'pipeline' && <Placeholder title="Pipeline" />}
        {tab === 'tags' && <Placeholder title="Tags" />}
        {tab === 'templates' && <Placeholder title="Templates" />}
        {tab === 'ai' && <Placeholder title="AI" />}
        {tab === 'queue' && <Placeholder title="Queue" />}
      </section>
    </aside>
  );
}
