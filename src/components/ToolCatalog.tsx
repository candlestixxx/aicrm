'use client';

import React, { useState } from 'react';
import { Search, Wrench, ExternalLink, Loader2 } from 'lucide-react';

interface ToolResult {
  name?: string;
  description?: string;
  server?: string;
  [key: string]: unknown;
}

export default function ToolCatalog() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ToolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(
        `/api/hypernexus/tools?query=${encodeURIComponent(query)}&limit=30`
      );
      const data = await res.json();
      const hits = (data.results || data.data || []) as ToolResult[];
      setResults(hits);
      if (hits.length === 0) {
        setError(
          'No tools found. The full catalog (26,000+ tools) requires the HyperNexus TypeScript backend to be running and populated.'
        );
      }
    } catch {
      setError('Failed to query the HyperNexus tool catalog.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-gray-900">HyperNexus Tool Catalog</h3>
      </div>

      <p className="text-sm text-gray-600">
        Search the HyperNexus control plane&apos;s MCP tool catalog. When the full
        backend is running, this exposes 26,000+ tools across 38+ AI clients.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools (e.g., email, browser, memory, code)..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((tool, i) => (
            <div
              key={i}
              className="bg-surface border border-gray-200 rounded-lg p-3 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-gray-900">
                  {tool.name || tool.server || 'unnamed'}
                </p>
                {tool.server && (
                  <span className="text-xs text-gray-400">{tool.server}</span>
                )}
              </div>
              {tool.description && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {tool.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ExternalLink className="w-3 h-3" />
        Catalog source: HyperNexus kernel via /api/mcp/tools/search
      </p>
    </div>
  );
}
