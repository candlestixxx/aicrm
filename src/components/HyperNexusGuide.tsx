'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { BookOpen, ExternalLink, Sparkles, Terminal, Zap, Globe, Code2, Server } from 'lucide-react';

const kernelFetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HyperNexusGuide() {
  const [open, setOpen] = useState(false);
  const { data: kernel } = useSWR<{
    connected: boolean;
    url: string;
    health?: { version?: string; uptimeSec?: number; service?: string };
  }>('/api/hypernexus/kernel', kernelFetcher, { refreshInterval: 30000 });

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-600">
            What is HyperNexus? (Guide)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {kernel && (
            <span
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                kernel.connected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Server className="w-3 h-3" />
              {kernel.connected
                ? `Kernel v${kernel.health?.version || '?'}`
                : 'Kernel offline'}
            </span>
          )}
          <span className="text-purple-500 text-sm">{open ? 'Hide' : 'Read'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 text-sm text-gray-700">
          {/* What it is */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-500" /> The AI heart of your CRM
            </h4>
            <p>
              HyperNexus is the orchestration layer built into this CRM. It translates
              plain-English into real database actions — no node-graph editors, no code.
              You type what you want; it happens.
            </p>
          </div>

          {/* Two ways to use */}
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-surface rounded-lg p-4 border border-purple-100">
              <h5 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                <Terminal className="w-4 h-4 text-purple-500" /> 1. Commands (you)
              </h5>
              <p className="text-xs text-gray-600">
                Use the console below to run commands yourself:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>• <code className="bg-gray-100 px-1 rounded">summarize my brokerage</code></li>
                <li>• <code className="bg-gray-100 px-1 rounded">create a task to call John</code></li>
                <li>• <code className="bg-gray-100 px-1 rounded">update lead [name] to hot</code></li>
                <li>• <code className="bg-gray-100 px-1 rounded">list contacts</code></li>
                <li>• <code className="bg-gray-100 px-1 rounded">list properties</code></li>
              </ul>
            </div>

            <div className="bg-surface rounded-lg p-4 border border-purple-100">
              <h5 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                <Zap className="w-4 h-4 text-purple-500" /> 2. Workflows (automatic)
              </h5>
              <p className="text-xs text-gray-600">
                Set up &quot;if this, then that&quot; automations below that run by
                themselves. Example:
              </p>
              <p className="mt-2 text-xs text-purple-700 bg-purple-50 rounded p-2">
                When a lead replies <strong>&quot;yes&quot;</strong> → mark them{' '}
                <strong>Hot</strong> and notify the broker.
              </p>
            </div>
          </div>

          {/* MCP */}
          <div className="bg-surface rounded-lg p-4 border border-blue-100">
            <h5 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
              <Globe className="w-4 h-4 text-blue-500" /> 3. Connect external AI agents (MCP)
            </h5>
            <p className="text-xs text-gray-600">
              HyperNexus speaks the{' '}
              <strong>Model Context Protocol (MCP)</strong> — the open standard that lets
              any AI agent (Claude Desktop, Cursor, custom agents) securely use your CRM
              as a set of tools. This is the &quot;agentic&quot; part: your CRM becomes a
              capability external AIs can call.
            </p>

            <div className="mt-3 bg-zinc-900 rounded-lg p-3 font-mono text-xs text-zinc-200 space-y-1">
              <p className="text-zinc-500"># MCP endpoint</p>
              <p>POST http://localhost:3001/api/mcp</p>
              <p className="text-zinc-500"># Auth header (set MCP_TOKEN in .env)</p>
              <p>Authorization: Bearer your-mcp-token</p>
            </div>

            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              Tools exposed: list_contacts, get_contact, create_contact, update_lead_stage,
              list_properties, create_task, list_tasks, summarize_brokerage, search_contacts,
              log_activity
            </p>
          </div>

          {/* External links */}
          <div className="bg-surface rounded-lg p-4 border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-2">Learn more (external)</h5>
            <div className="space-y-2">
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Model Context Protocol — official docs & spec
              </a>
              <a
                href="https://github.com/modelcontextprotocol"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                MCP GitHub — SDKs, servers, and client examples
              </a>
              <a
                href="https://modelcontextprotocol.io/clients"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                MCP clients — connect Claude Desktop, Cursor, and more
              </a>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Note: HyperNexus is the name of this CRM&apos;s built-in orchestration engine —
              it is not a separate downloadable product. The MCP standard above is the open
              protocol that lets external agents connect to it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
