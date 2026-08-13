'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowLeft, Phone, Mail, MapPin, Tag, Calendar, Clock,
  Pencil, Plus, MessageSquare,
} from 'lucide-react';

interface ContactDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  source: string | null;
  tags: string | string[];
  notes: string | null;
  isLead: boolean;
  createdAt: string;
  lead?: {
    id: string;
    status: string;
    score: number;
    budgetMin: number | null;
    budgetMax: number | null;
    propertyType: string | null;
    timeline: string | null;
    stage?: { id: string; name: string; color: string } | null;
    pipeline?: { id: string; name: string } | null;
  } | null;
  activities: { id: string; type: string; description: string; createdAt: string }[];
  communications: { id: string; channel: string; direction: string; body: string; sentAt: string }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  hot: 'bg-red-100 text-red-700',
  cold: 'bg-slate-100 text-slate-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-amber-100 text-amber-700',
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<ContactDetail>(
    id ? `/api/contacts/${id}` : null,
    fetcher
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', notes: '',
  });
  const [newActivity, setNewActivity] = useState('');

  if (isLoading || !data) {
    return (
      <div className="p-8 text-center text-gray-400">Loading contact...</div>
    );
  }

  const tags: string[] = Array.isArray(data.tags)
    ? (data.tags as string[])
    : JSON.parse(data.tags || '[]');

  const handleStartEdit = () => {
    setForm({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || '',
      phone: data.phone || '',
      notes: data.notes || '',
    });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setEditing(false);
      mutate();
    } catch (err) {
      console.error('Failed to update contact', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) return;
    try {
      await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: data.notes ? `${data.notes}\n${newActivity}` : newActivity }),
      });
      setNewActivity('');
      mutate();
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!data.lead) return;
    try {
      await fetch(`/api/leads/${data.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-blue-700">
                {data.firstName[0]}{data.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {data.firstName} {data.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {data.isLead && data.lead ? (
                  <>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[data.lead.status] || STATUS_COLORS.new}`}>
                      {data.lead.status.replace('_', ' ')}
                    </span>
                    {data.lead.stage && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: data.lead.stage.color + '20', color: data.lead.stage.color }}>
                        {data.lead.stage.name}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">Contact</span>
                )}
                {data.source && (
                  <span className="text-xs text-gray-400">via {data.source}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>

        {/* Quick status actions */}
        {data.lead && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {['new', 'active', 'hot', 'cold', 'closed_won', 'closed_lost'].map((s) => (
              <button
                key={s}
                onClick={() => handleUpdateStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  data.lead?.status === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Edit Contact</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {data.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${data.email}`} className="hover:text-blue-600">{data.email}</a>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${data.phone}`} className="hover:text-blue-600">{data.phone}</a>
                </div>
              )}
              {(data.address || data.city) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {[data.address, data.city, data.state, data.zip].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Created {new Date(data.createdAt).toLocaleDateString()}
              </div>
              {tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lead details */}
          {data.lead && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Lead Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Budget</p>
                  <p className="text-gray-900 font-medium">
                    {data.lead.budgetMin || data.lead.budgetMax
                      ? `${data.lead.budgetMin ? '$' + data.lead.budgetMin.toLocaleString() : ''}${data.lead.budgetMin && data.lead.budgetMax ? ' – ' : ''}${data.lead.budgetMax ? '$' + data.lead.budgetMax.toLocaleString() : ''}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Property Type</p>
                  <p className="text-gray-900 font-medium">{data.lead.propertyType || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Timeline</p>
                  <p className="text-gray-900 font-medium">{data.lead.timeline || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Lead Score</p>
                  <p className="text-gray-900 font-medium">{data.lead.score}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a note..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
            <div className="space-y-3">
              {data.activities.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                data.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-400">
                        {activity.type} · {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: communications */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Communications
            </h2>
            {data.communications.length === 0 ? (
              <p className="text-sm text-gray-400">No communications yet.</p>
            ) : (
              <div className="space-y-3">
                {data.communications.map((comm) => (
                  <div key={comm.id} className="border-l-2 border-gray-200 pl-3">
                    <p className="text-xs text-gray-400">
                      {comm.channel} · {comm.direction} · {new Date(comm.sentAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{comm.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
