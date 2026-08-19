'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Users, Play, Scale, MessageSquare, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SwarmConsole() {
  const { data, mutate } = useSWR<{ data?: { missionId?: string; status?: string }[] }>(
    '/api/hypernexus/swarm',
    fetcher,
    { refreshInterval: 30000 }
  );
  const [prompt, setPrompt] = useState('');
  const [action, setAction] = useState<'start' | 'debate' | 'consensus'>('start');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const missions = data?.data || [];

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const url =
        action === 'start'
          ? '/api/hypernexus/swarm?action=start'
          : `/api/hypernexus/swarm?action=${action}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
      mutate();
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-900">HyperNexus Swarm Orchestration</h3>
      </div>

      <p className="text-sm text-gray-600">
        Run multi-agent operations through the HyperNexus control plane — start a
        swarm mission, execute a multi-agent debate, or seek consensus across models.
      </p>

      <form onSubmit={handleRun} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAction('start')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${
              action === 'start'
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Play className="w-4 h-4" /> Start Mission
          </button>
          <button
            type="button"
            onClick={() => setAction('debate')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${
              action === 'debate'
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Debate
          </button>
          <button
            type="button"
            onClick={() => setAction('consensus')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${
              action === 'consensus'
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Scale className="w-4 h-4" /> Consensus
          </button>
        </div>

        {action !== 'start' && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Prompt for the swarm (e.g., 'Should we counter at $450k or $460k?')"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={3}
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {loading ? 'Running...' : `Run ${action}`}
        </button>
      </form>

      {result && (
        <div className="bg-zinc-900 rounded-lg p-3 font-mono text-xs text-green-300 overflow-auto max-h-64 whitespace-pre-wrap">
          {result}
        </div>
      )}

      {missions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            Missions ({missions.length})
          </p>
          {missions.map((m, i) => (
            <div key={i} className="bg-surface border border-gray-200 rounded-lg p-3 text-sm">
              <span className="font-medium text-gray-900">{m.missionId}</span>
              <span className="ml-2 text-xs text-gray-500">{m.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
