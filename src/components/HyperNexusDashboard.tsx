'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { LayoutDashboard, ExternalLink, Server, RefreshCw } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * Embeds the HyperNexus web dashboard (apps/web) via iframe.
 * The dashboard runs on its own port (default 7779); if it's not running,
 * we show a fallback with the kernel status and instructions.
 */
export default function HyperNexusDashboard() {
  const dashboardUrl =
    process.env.NEXT_PUBLIC_HYPERNEXUS_DASHBOARD_URL || 'http://127.0.0.1:7779';

  const { data: kernel, mutate } = useSWR<{
    connected: boolean;
    url: string;
    health?: { version?: string; uptimeSec?: number };
  }>('/api/hypernexus/kernel', fetcher, { refreshInterval: 15000 });

  const [iframeFailed, setIframeFailed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">HyperNexus Dashboard</h3>
        </div>
        <div className="flex items-center gap-2">
          {kernel?.connected && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
              <Server className="w-3 h-3" />
              Kernel v{kernel.health?.version || '?'}
            </span>
          )}
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Open in new tab
          </a>
          <button
            onClick={() => {
              setIframeFailed(false);
              mutate();
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Reload"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {iframeFailed ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Server className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">Dashboard not reachable</p>
          <p className="text-sm text-gray-500 mt-1">
            The HyperNexus web dashboard runs on{' '}
            <code className="bg-gray-100 px-1 rounded">{dashboardUrl}</code>.
          </p>
          <div className="mt-4 text-left bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-200 max-w-md mx-auto">
            <p className="text-gray-500"># Start the dashboard (in the HyperNexus submodule)</p>
            <p>cd workspace/HyperNexus</p>
            <p>pnpm install</p>
            <p>pnpm dev:web</p>
          </div>
          <button
            onClick={() => setIframeFailed(false)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <iframe
            src={dashboardUrl}
            title="HyperNexus Dashboard"
            className="w-full h-[70vh]"
            onError={() => setIframeFailed(true)}
          />
        </div>
      )}

      <p className="text-xs text-gray-400">
        Note: the dashboard is the HyperNexus submodule&apos;s Next.js app (apps/web).
        If it isn&apos;t running, the kernel status above still works independently.
      </p>
    </div>
  );
}
