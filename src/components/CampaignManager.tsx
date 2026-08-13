'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Megaphone, Mail, MessageSquare, Trash2, Play, Pause } from 'lucide-react';

interface CampaignStep {
  id: string;
  name: string;
  order: number;
  delayHours: number;
  channel: string;
  subject: string | null;
  body: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: string;
  channel: string;
  status: string;
  steps: CampaignStep[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CampaignManager() {
  const { data, isLoading, mutate } = useSWR<{ campaigns: Campaign[] }>(
    '/api/campaigns',
    fetcher
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('drip');
  const [channel, setChannel] = useState('email');

  const campaigns = data?.campaigns ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, channel }),
      });
      setName('');
      setShowForm(false);
      mutate();
    } catch (err) {
      console.error('Failed to create campaign', err);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: campaign.status === 'active' ? 'paused' : 'active',
          startDate: campaign.status !== 'active' ? new Date().toISOString() : undefined,
        }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update campaign', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to delete campaign', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-5 h-5" /> Campaigns
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <div className="flex gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="drip">Drip</option>
                <option value="blast">Blast</option>
                <option value="nurture">Nurture</option>
                <option value="event">Event</option>
              </select>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="both">Email + SMS</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No campaigns yet. Create a drip campaign to nurture leads automatically.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {campaign.type} · {campaign.channel}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    campaign.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>

              {campaign.description && (
                <p className="mt-2 text-sm text-gray-600">{campaign.description}</p>
              )}

              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-gray-500">
                  Steps ({campaign.steps.length})
                </p>
                {campaign.steps.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No steps yet. Add steps to define the drip sequence.
                  </p>
                ) : (
                  campaign.steps.slice(0, 3).map((step) => (
                    <div key={step.id} className="text-xs text-gray-600 flex items-center gap-1">
                      {step.channel === 'sms' ? (
                        <MessageSquare className="w-3 h-3" />
                      ) : (
                        <Mail className="w-3 h-3" />
                      )}
                      <span className="truncate">
                        {step.order + 1}. {step.name}
                      </span>
                      <span className="text-gray-400">(+{step.delayHours}h)</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleToggleStatus(campaign)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {campaign.status === 'active' ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
