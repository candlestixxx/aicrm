'use client';

import React from 'react';
import useSWR from 'swr';
import { Cpu, Zap, Globe } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EngineInfo {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
}

export default function EngineSelector() {
  const { data } = useSWR<{
    active: string;
    activeVersion: string;
    engines: EngineInfo[];
  }>('/api/ai/engines', fetcher);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-3">AI Engine (two brains, one interface)</h3>
      {!data ? (
        <p className="text-sm text-gray-400">Loading engines...</p>
      ) : (
        <div className="space-y-3">
          {data.engines.map((e) => (
            <div
              key={e.name}
              className={`p-3 rounded-lg border ${
                data.active === e.name
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {e.name === 'native' ? (
                  <Zap className="w-4 h-4 text-amber-500" />
                ) : e.name === 'controlplane' ? (
                  <Globe className="w-4 h-4 text-blue-500" />
                ) : (
                  <Cpu className="w-4 h-4 text-purple-500" />
                )}
                <span className="font-medium text-sm text-gray-900 capitalize">
                  {e.name}
                </span>
                <span className="text-xs text-gray-500">({e.version})</span>
                {data.active === e.name && (
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{e.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Capabilities: {e.capabilities.join(', ')}
              </p>
            </div>
          ))}
          <p className="text-xs text-gray-400">
            Switch the default by setting <code>AI_ENGINE=native|controlplane|hybrid</code> in{' '}
            <code>.env</code> — no code changes needed. This is the gradual path from the built-in
            brain to the external HyperNexus control plane.
          </p>
        </div>
      )}
    </div>
  );
}
