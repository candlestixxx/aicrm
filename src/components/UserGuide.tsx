'use client';

import React, { useState } from 'react';
import {
  BookOpen, Sparkles, Zap, Globe, Play, CheckCircle2, Loader2, Terminal,
} from 'lucide-react';

type SectionKey = 'hypernexus' | 'assistant' | 'workflows' | 'controlplane';

interface DemoResult {
  title: string;
  output: string;
  success: boolean;
}

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hypernexus', label: 'HyperNexus (Commands)', icon: <Terminal className="w-4 h-4" /> },
  { key: 'assistant', label: 'AI Assistant', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'workflows', label: 'Workflows', icon: <Zap className="w-4 h-4" /> },
  { key: 'controlplane', label: 'Control Plane', icon: <Globe className="w-4 h-4" /> },
];

export default function UserGuide() {
  const [active, setActive] = useState<SectionKey>('hypernexus');
  const [demo, setDemo] = useState<DemoResult | null>(null);
  const [running, setRunning] = useState(false);

  const runDemo = async (fn: () => Promise<DemoResult>) => {
    setRunning(true);
    setDemo(null);
    try {
      setDemo(await fn());
    } catch (e) {
      setDemo({
        title: 'Demo failed',
        output: e instanceof Error ? e.message : 'Unknown error',
        success: false,
      });
    } finally {
      setRunning(false);
    }
  };

  const demos: Record<SectionKey, () => Promise<DemoResult>> = {
    hypernexus: async () => {
      const res = await fetch('/api/hypernexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'summarize my brokerage' }),
      });
      const data = await res.json();
      return { title: 'Demo: "summarize my brokerage"', output: JSON.stringify(data, null, 2), success: data.success };
    },
    assistant: async () => {
      const res = await fetch('/api/assistant?action=digest');
      const data = await res.json();
      return { title: 'Demo: Daily Digest', output: JSON.stringify(data.digest, null, 2), success: !!data.digest };
    },
    workflows: async () => {
      const res = await fetch('/api/hypernexus/workflows');
      const data = await res.json();
      return {
        title: `Demo: Your workflows (${data.workflows?.length ?? 0} total)`,
        output: JSON.stringify(data.workflows?.slice(0, 3), null, 2),
        success: true,
      };
    },
    controlplane: async () => {
      const res = await fetch('/api/hypernexus/kernel');
      const data = await res.json();
      return {
        title: 'Demo: HyperNexus Control Plane status',
        output: JSON.stringify(data, null, 2),
        success: data.connected,
      };
    },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Guide & Demo</h2>
          <p className="text-sm text-gray-500">Learn how each AI module works — with live demonstrations</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => { setActive(s.key); setDemo(null); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
              active === s.key
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 bg-surface text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-surface border border-gray-200 rounded-xl p-6 space-y-5">
        {active === 'hypernexus' && (
          <>
            <h3 className="font-semibold text-gray-900 text-lg">HyperNexus — the command brain</h3>
            <p className="text-sm text-gray-700">
              <strong>What it is:</strong> Type plain English, and HyperNexus translates it into real CRM
              actions. No forms, no code — just tell it what you want.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">How to use it (3 steps):</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Open the <strong>HyperNexus</strong> tab in the sidebar.</li>
                <li>Type a command (or click one of the example chips).</li>
                <li>Press <strong>Run</strong> — watch it execute against your real data.</li>
              </ol>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-900 mb-2">Try these commands:</p>
              <ul className="space-y-1 text-gray-700">
                <li>• <code className="bg-gray-200 px-1 rounded">summarize my brokerage</code> — your stats</li>
                <li>• <code className="bg-gray-200 px-1 rounded">create a task to call John tomorrow</code></li>
                <li>• <code className="bg-gray-200 px-1 rounded">update lead [name] to hot</code></li>
                <li>• <code className="bg-gray-200 px-1 rounded">list contacts</code> / <code className="bg-gray-200 px-1 rounded">list properties</code></li>
                <li>• <code className="bg-gray-200 px-1 rounded">draft an email about a second showing</code> (uses AI)</li>
                <li>• <code className="bg-gray-200 px-1 rounded">advise should I counter at $450k or $460k</code> (AI negotiation)</li>
              </ul>
            </div>
          </>
        )}

        {active === 'assistant' && (
          <>
            <h3 className="font-semibold text-gray-900 text-lg">AI Assistant — your proactive brain</h3>
            <p className="text-sm text-gray-700">
              <strong>What it is:</strong> A dashboard that works for you even when you&apos;re not looking —
              it prioritizes leads, spots cooling deals, and gives you a daily digest.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">How to use it:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Open the <strong>AI Assistant</strong> tab (top of sidebar).</li>
                <li>Read today&apos;s <strong>digest</strong> headline at the top.</li>
                <li>Act on <strong>Next Best Actions</strong> (who to call first).</li>
                <li>Check <strong>Leads Going Cold</strong> before it&apos;s too late.</li>
                <li>Use <strong>CMA Generator</strong> and <strong>Lead Enrichment</strong> for AI research.</li>
              </ol>
            </div>
            <p className="text-sm text-gray-700">
              <strong>Why it helps humans:</strong> it removes the mental load of &quot;who should I call
              today?&quot; — the AI figures that out for you every morning.
            </p>
          </>
        )}

        {active === 'workflows' && (
          <>
            <h3 className="font-semibold text-gray-900 text-lg">Workflows — your autopilot</h3>
            <p className="text-sm text-gray-700">
              <strong>What it is:</strong> &quot;If this happens, then do these steps automatically.&quot; Runs
              24/7 without you.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">How to build one:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Go to <strong>HyperNexus</strong> tab → <strong>Automation Workflows</strong>.</li>
                <li>Click <strong>New Workflow</strong>.</li>
                <li>Pick a <strong>trigger</strong> (e.g., &quot;Communication Received&quot;).</li>
                <li>Set a <strong>condition</strong> (e.g., body contains &quot;yes&quot;).</li>
                <li>Add one or more <strong>steps</strong> (update stage → AI draft → create task).</li>
                <li>Click <strong>Create Workflow</strong> — done, it&apos;s live.</li>
              </ol>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-purple-600 mb-1">Example &quot;do it all&quot; workflow:</p>
              <p className="text-purple-700">
                When a lead replies &quot;yes&quot; → mark them <strong>Hot</strong> → AI drafts a follow-up email
                → create a task to schedule the second showing.
              </p>
            </div>
          </>
        )}

        {active === 'controlplane' && (
          <>
            <h3 className="font-semibold text-gray-900 text-lg">Control Plane — the external brain</h3>
            <p className="text-sm text-gray-700">
              <strong>What it is:</strong> The optional connection to the external{' '}
              <strong>HyperNexus control plane</strong> (a separate product from GitHub) — it adds swarm
              orchestration and (eventually) a 26,000-tool catalog.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium text-gray-900">What it does today:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li><strong>Swarm</strong> — run multi-agent debates/consensus (DeepSeek-powered)</li>
                <li><strong>Memory</strong> — mirrors your workflow events</li>
                <li><strong>Dashboard</strong> — its own web UI (embedded)</li>
                <li><strong>Tool catalog</strong> — 26k tools (currently empty, needs ingestion)</li>
              </ul>
            </div>
            <p className="text-sm text-gray-700">
              <strong>How it&apos;s wired:</strong> your CRM has <em>two brains</em> — the built-in
              <strong> Native</strong> engine (default) and this <strong>Control Plane</strong> engine.
              Switch between them with <code className="bg-gray-200 px-1 rounded">AI_ENGINE</code> in{' '}
              <code className="bg-gray-200 px-1 rounded">.env</code>. See <strong>Settings → AI Engine</strong>.
            </p>
          </>
        )}

        {/* Demo button */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => runDemo(demos[active])}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running demo...' : 'Run live demonstration'}
          </button>

          {demo && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={`w-4 h-4 ${demo.success ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium text-gray-900">{demo.title}</span>
              </div>
              <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs overflow-auto max-h-80 whitespace-pre-wrap border border-zinc-800">
                {demo.output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
