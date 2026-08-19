'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Phone, Mail, RefreshCw } from 'lucide-react';

interface KanbanLead {
  id: string;
  status: string;
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
}

interface KanbanStage {
  id: string;
  name: string;
  color: string;
  order: number;
  leads: KanbanLead[];
}

interface KanbanResponse {
  pipeline: { id: string; name: string } | null;
  stages: KanbanStage[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PipelineBoard() {
  const { data, isLoading, mutate } = useSWR<KanbanResponse>(
    '/api/pipelines/board',
    fetcher,
    { refreshInterval: 30000 }
  );

  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <div className="bg-surface rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        Loading pipeline...
      </div>
    );
  }

  const { stages, pipeline } = data;

  if (!pipeline || stages.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        No pipeline configured. Create one in Settings.
      </div>
    );
  }

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;

    try {
      await fetch(`/api/leads/${draggedLead}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      });
      setDraggedLead(null);
      mutate();
    } catch (err) {
      console.error('Failed to move lead', err);
      setDraggedLead(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {pipeline.name}
        </h2>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72 bg-gray-50 rounded-xl border border-gray-200"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage.id)}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-semibold text-sm text-gray-800">
                  {stage.name}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">
                {stage.leads.length}
              </span>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {stage.leads.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-6">
                  No leads
                </div>
              ) : (
                stage.leads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedLead(lead.id)}
                    onDragEnd={() => setDraggedLead(null)}
                    className={`bg-surface rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab hover:shadow-md transition ${
                      draggedLead === lead.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {lead.contact.firstName} {lead.contact.lastName}
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                      {lead.contact.email && (
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{lead.contact.email}</span>
                        </div>
                      )}
                      {lead.contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {lead.contact.phone}
                        </div>
                      )}
                    </div>
                    {(lead.budgetMin || lead.budgetMax) && (
                      <div className="mt-2 text-xs font-medium text-green-700">
                        {lead.budgetMin && `$${lead.budgetMin.toLocaleString()}`}
                        {lead.budgetMin && lead.budgetMax && ' – '}
                        {lead.budgetMax && `$${lead.budgetMax.toLocaleString()}`}
                      </div>
                    )}
                    {lead.timeline && (
                      <div className="mt-1 text-xs text-blue-600">
                        {lead.timeline}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Drag and drop leads between stages to update their pipeline status.
      </p>
    </div>
  );
}
