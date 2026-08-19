'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Terminal } from 'lucide-react';

interface CommandResult {
  success: boolean;
  intent?: string;
  action?: string;
  message: string;
  data?: unknown;
  usedLLM?: boolean;
}

interface LogEntry {
  id: string;
  role: 'user' | 'system';
  text: string;
  intent?: string;
}

const EXAMPLE_COMMANDS = [
  'summarize my brokerage',
  'list contacts',
  'create a task to follow up with the Johnson offer',
  'update lead new to hot',
  'send email to contact saying hello',
];

export default function HyperNexusConsole() {
  const [command, setCommand] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.trim();
    setCommand('');
    setLoading(true);

    setLog((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: cmd },
    ]);

    try {
      const res = await fetch('/api/hypernexus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const result: CommandResult = await res.json();

      setLog((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          role: 'system',
          text: result.message,
          intent: result.intent,
        },
      ]);
    } catch {
      setLog((prev) => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          role: 'system',
          text: 'Error: failed to reach HyperNexus.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-900">HyperNexus Console</h2>
      </div>

      <p className="text-sm text-gray-600">
        Type natural-language commands to control your CRM. HyperNexus translates
        your intent into database actions.
      </p>

      {/* Examples */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            onClick={() => setCommand(cmd)}
            className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full hover:bg-purple-100"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Log */}
      <div className="bg-zinc-950 rounded-xl p-4 min-h-[300px] max-h-[400px] overflow-y-auto font-mono text-sm space-y-3 border border-zinc-800">
        {log.length === 0 ? (
          <div className="text-zinc-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">HyperNexus ready. Try a command below.</span>
          </div>
        ) : (
          log.map((entry) => (
            <div key={entry.id}>
              {entry.role === 'user' ? (
                <div className="text-emerald-300 font-semibold">
                  <span className="text-cyan-400">$ </span>
                  {entry.text}
                </div>
              ) : (
                <div className="text-white">
                  <span className="text-fuchsia-400 font-semibold">
                    {entry.intent ? `[${entry.intent}] ` : ''}
                  </span>
                  <span className="whitespace-pre-wrap">{entry.text}</span>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="text-purple-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> processing...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., 'create a task to call John tomorrow'"
          className="flex-1 px-4 py-2.5 bg-surface text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Run
        </button>
      </form>
    </div>
  );
}
