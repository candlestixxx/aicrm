'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Sparkles, Bell, HeartPulse, Link2, FileText, Search, RefreshCw,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Section({
  icon,
  title,
  children,
  onRefresh,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <div className="bg-surface border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {onRefresh && (
          <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AssistantPanel() {
  const { data: digest } = useSWR('/api/assistant?action=digest', fetcher, { refreshInterval: 60000 });
  const { data: nextBest, mutate: mNext } = useSWR('/api/assistant?action=next-best', fetcher);
  const { data: nudges, mutate: mNudges } = useSWR('/api/assistant?action=nudges', fetcher, { refreshInterval: 60000 });
  const { data: health, mutate: mHealth } = useSWR('/api/assistant?action=health', fetcher);
  const { data: matches, mutate: mMatches } = useSWR('/api/assistant?action=match', fetcher);

  const [cmaPropertyId, setCmaPropertyId] = useState('');
  const [cmaResult, setCmaResult] = useState('');
  const [enrichContactId, setEnrichContactId] = useState('');
  const [enrichResult, setEnrichResult] = useState('');
  const [busy, setBusy] = useState(false);

  const d = digest?.digest;

  const runCMA = async () => {
    if (!cmaPropertyId) return;
    setBusy(true);
    const res = await fetch(`/api/assistant?action=cma`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: cmaPropertyId }),
    });
    const data = await res.json();
    setCmaResult(data.result?.cma || 'No result');
    setBusy(false);
  };

  const runEnrich = async () => {
    if (!enrichContactId) return;
    setBusy(true);
    const res = await fetch(`/api/assistant?action=enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: enrichContactId }),
    });
    const data = await res.json();
    setEnrichResult(data.result?.enrichment || 'No result');
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
          <p className="text-sm text-gray-500">Your CRM&apos;s proactive intelligence layer</p>
        </div>
      </div>

      {/* Daily digest headline */}
      {d && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-5">
          <p className="text-sm text-purple-100 mb-1">📅 Today&apos;s digest — {d.date}</p>
          <p className="text-lg font-semibold">{d.headline}</p>
          <div className="flex gap-4 mt-3 text-sm">
            <span>{d.stats.leadCount} leads</span>
            <span>{d.stats.hotLeads} hot</span>
            <span>{d.stats.pendingTasks} tasks</span>
            <span>{d.stats.contactCount} contacts</span>
          </div>
        </div>
      )}

      {/* Next best actions */}
      <Section icon={<Sparkles className="w-4 h-4 text-purple-500" />} title="Next Best Actions" onRefresh={() => mNext()}>
        {nextBest?.recommendations?.length ? (
          <ul className="space-y-2">
            {nextBest.recommendations.slice(0, 8).map((r: { name: string; action: string; urgency: string }, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  r.urgency === 'high' ? 'bg-red-500' : r.urgency === 'medium' ? 'bg-amber-500' : 'bg-gray-300'
                }`} />
                <span>
                  <strong className="text-gray-900">{r.name}</strong>
                  <span className="text-gray-600"> — {r.action}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No recommendations yet.</p>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nudges */}
        <Section icon={<Bell className="w-4 h-4 text-amber-500" />} title="Nudges & Reminders" onRefresh={() => mNudges()}>
          {nudges?.nudges?.length ? (
            <ul className="space-y-2">
              {nudges.nudges.map((n: { message: string; urgency: string }, i: number) => (
                <li key={i} className={`text-sm p-2 rounded ${n.urgency === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {n.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">All caught up — no nudges needed.</p>
          )}
        </Section>

        {/* At-risk leads */}
        <Section icon={<HeartPulse className="w-4 h-4 text-red-500" />} title="Leads Going Cold" onRefresh={() => mHealth()}>
          {health?.atRisk?.length ? (
            <ul className="space-y-2">
              {health.atRisk.map((r: { name: string; reason: string }, i: number) => (
                <li key={i} className="text-sm p-2 bg-red-50 rounded">
                  <strong className="text-red-800">{r.name}</strong>
                  <span className="text-red-600"> — {r.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No leads at risk. Great job.</p>
          )}
        </Section>
      </div>

      {/* Property matches */}
      <Section icon={<Link2 className="w-4 h-4 text-blue-500" />} title="Lead ↔ Property Matches" onRefresh={() => mMatches()}>
        {matches?.matches?.length ? (
          <ul className="space-y-2">
            {matches.matches.slice(0, 10).map((m: { lead: string; property: string; reason: string }, i: number) => (
              <li key={i} className="text-sm">
                <strong className="text-gray-900">{m.lead}</strong>
                <span className="text-gray-500"> → </span>
                <span className="text-blue-700">{m.property}</span>
                <span className="text-xs text-gray-400"> ({m.reason})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No matches found yet. Add leads with budget/property-type and active listings.</p>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CMA generator */}
        <Section icon={<FileText className="w-4 h-4 text-green-500" />} title="CMA Generator">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Property ID"
              value={cmaPropertyId}
              onChange={(e) => setCmaPropertyId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button onClick={runCMA} disabled={busy} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
              Generate
            </button>
          </div>
          {cmaResult && <pre className="mt-3 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{cmaResult}</pre>}
        </Section>

        {/* Lead enrichment */}
        <Section icon={<Search className="w-4 h-4 text-indigo-500" />} title="AI Lead Enrichment">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contact ID"
              value={enrichContactId}
              onChange={(e) => setEnrichContactId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button onClick={runEnrich} disabled={busy} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              Enrich
            </button>
          </div>
          {enrichResult && <pre className="mt-3 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{enrichResult}</pre>}
        </Section>
      </div>
    </div>
  );
}
