'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, RefreshCw, History, Building2 } from 'lucide-react';
import { LISTING_STATUS_META, listingStatusMeta } from '@/lib/listing-status';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LogEntry {
  id: string;
  address: string;
  mlsNumber: string | null;
  previousStatus: string | null;
  newStatus: string;
  source: string;
  createdAt: string;
}

interface Listing {
  id: string;
  address: string;
  city: string;
  mlsNumber: string | null;
  status: string;
}

export default function ListingStatusPanel() {
  const { data, isLoading, mutate } = useSWR<{
    log: LogEntry[];
    totalListings: number;
    listings: Listing[];
    byStatus: { status: string; count: number }[];
  }>('/api/listings/sync', fetcher);

  const [listingId, setListingId] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const listings = data?.listings ?? [];
  const log = data?.log ?? [];

  async function applyManual() {
    if (!listingId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/listings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: listingId, status: newStatus, source: 'manual' }),
      });
      const result = await res.json();
      setMessage(result.message || 'Updated');
      setListingId('');
      mutate();
    } catch {
      setMessage('Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function syncAll() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/listings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true }),
      });
      const result = await res.json();
      setMessage(`Checked ${result.checked ?? 0} listing(s) · ${result.changed ?? 0} changed`);
      mutate();
    } catch {
      setMessage('Sync failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" /> Listing Status Sync
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Live MLS/Realcomp status for every address — updates leads and campaigns in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={syncAll}
          disabled={busy || isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync all listings
        </button>
      </div>

      {message && (
        <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm">{message}</div>
      )}

      {/* Status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Total listings</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalListings ?? 0}</p>
        </div>
        {(data?.byStatus ?? []).map((s) => {
          const meta = listingStatusMeta(s.status);
          return (
            <div key={s.status} className="bg-surface border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <p className="text-sm text-gray-500 truncate">{meta.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
            </div>
          );
        })}
      </div>

      {/* Manual status correction */}
      <div className="bg-surface border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Manual status update</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select a listing…</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.address}{l.mlsNumber ? ` · MLS ${l.mlsNumber}` : ''} ({l.status})
              </option>
            ))}
          </select>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="px-3 py-2 bg-surface text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {LISTING_STATUS_META.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyManual}
            disabled={busy || !listingId}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Apply
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          This is the same action your provider webhook triggers automatically — useful for
          corrections and manual entry.
        </p>
      </div>

      {/* Recent changes log */}
      <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Recent status changes</h3>
        </div>
        {log.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">
            No status changes yet. They&apos;ll appear here in real time as listings update.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {log.map((entry) => (
              <li key={entry.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{entry.address}</p>
                  <p className="text-xs text-gray-500">
                    {entry.previousStatus ?? '—'} →{' '}
                    <span style={{ color: listingStatusMeta(entry.newStatus).color }}>
                      {listingStatusMeta(entry.newStatus).label}
                    </span>{' '}
                    · via {entry.source}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
