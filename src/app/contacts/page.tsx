'use client';
// AICRM contacts list page — main entry to the contacts module.
// The detail view lives at /contacts/[id]. This page lists all contacts with
// search, quick-create, and navigation to detail.

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Users, Plus, Search, Phone, Mail, MapPin, Tag, ArrowRight, Loader2,
} from 'lucide-react';

interface ContactRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  tags: string | string[];
  isLead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ContactsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const { data, error, mutate } = useSWR<ContactRow[]>('/api/contacts', fetcher);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter((c) =>
      `${c.firstName} ${c.lastName} ${c.email ?? ''} ${c.phone ?? ''} ${c.city ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [data, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ firstName: '', lastName: '', email: '', phone: '' });
        mutate();
      }
    } finally {
      setCreating(false);
    }
  }

  function parseTags(tags: string | string[]): string[] {
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return tags ? [tags] : []; }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Contacts
          {data && <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length})</span>}
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-4 rounded-lg border p-4 grid grid-cols-2 gap-3">
          <input
            placeholder="First name *"
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="Last name *"
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-md text-sm border hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search contacts by name, email, phone, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-md border text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">Failed to load contacts.</p>}
      {!data && !error && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading contacts...
        </div>
      )}

      {filtered.length === 0 && data && (
        <p className="text-sm text-muted-foreground py-8 text-center">No contacts found.</p>
      )}

      <div className="divide-y rounded-lg border">
        {filtered.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/contacts/${c.id}`)}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {c.firstName[0]}{c.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.firstName} {c.lastName}</span>
                {c.isLead && (
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">Lead</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.city}, {c.state}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {parseTags(c.tags).slice(0, 2).map((t) => (
                <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Tag className="w-2.5 h-2.5" /> {t}
                </span>
              ))}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
