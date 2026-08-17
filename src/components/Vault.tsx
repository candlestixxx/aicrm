'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Key, Link2, Lock, FileText, Box, Plus, Trash2, Eye, EyeOff,
  Copy, Check, X, ShieldCheck,
} from 'lucide-react';

interface Secret {
  id: string;
  category: string;
  label: string;
  metadata: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

interface SecretsResponse {
  secrets: Secret[];
  categories: { value: string; label: string; icon: string }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  api_key: <Key className="w-5 h-5" />,
  oauth: <Link2 className="w-5 h-5" />,
  password: <Lock className="w-5 h-5" />,
  note: <FileText className="w-5 h-5" />,
  other: <Box className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  api_key: 'text-blue-600 bg-blue-50 border-blue-200',
  oauth: 'text-purple-600 bg-purple-50 border-purple-200',
  password: 'text-red-600 bg-red-50 border-red-200',
  note: 'text-green-600 bg-green-50 border-green-200',
  other: 'text-gray-600 bg-gray-50 border-gray-200',
};

export default function Vault() {
  const { data, isLoading, mutate } = useSWR<SecretsResponse>('/api/secrets', fetcher);
  const [activeCategory, setActiveCategory] = useState('api_key');
  const [showAdd, setShowAdd] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    label: '', value: '', url: '', username: '', description: '',
  });

  const secrets = (data?.secrets ?? []).filter((s) => s.category === activeCategory);
  const categories = data?.categories ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: activeCategory,
          label: form.label,
          value: form.value,
          metadata: {
            url: form.url || undefined,
            username: form.username || undefined,
            description: form.description || undefined,
          },
        }),
      });
      setShowAdd(false);
      setForm({ label: '', value: '', url: '', username: '', description: '' });
      mutate();
    } catch (err) {
      console.error('Failed to add secret', err);
    }
  };

  const handleReveal = async (secret: Secret) => {
    if (revealed === secret.id) {
      setRevealed(null);
      setRevealedValue('');
      return;
    }
    try {
      const res = await fetch(`/api/secrets/${secret.id}`);
      const data = await res.json();
      setRevealed(secret.id);
      setRevealedValue(data.value);
    } catch (err) {
      console.error('Failed to reveal', err);
    }
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this secret permanently?')) return;
    try {
      await fetch(`/api/secrets/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Secure Vault</h2>
            <p className="text-xs text-gray-500">
              AES-256-GCM encrypted · keys, OAuth, passwords & notes · values never shown in lists
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Add Secret
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition ${
              activeCategory === cat.value
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-medium'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {CATEGORY_ICONS[cat.value]}
            {cat.label}
            <span className="text-xs text-gray-400">
              {(data?.secrets ?? []).filter((s) => s.category === cat.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">
                Add to {categories.find((c) => c.value === activeCategory)?.label}
              </h3>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Label (e.g., 'Google Gemini', 'Facebook Page', 'Gmail')"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
                autoFocus
              />
              <textarea
                placeholder="Secret value (key, token, password, or note)"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="URL (optional)"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Username (optional)"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                  Store Securely
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secret list */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading vault...</div>
      ) : secrets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          No secrets in this section. Click &quot;Add Secret&quot; to store one securely.
        </div>
      ) : (
        <div className="space-y-2">
          {secrets.map((secret) => (
            <div
              key={secret.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`p-2 rounded-lg border ${CATEGORY_COLORS[secret.category] || CATEGORY_COLORS.other}`}>
                  {CATEGORY_ICONS[secret.category]}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{secret.label}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {secret.metadata?.username && <span>{secret.metadata.username}</span>}
                    {secret.metadata?.url && <span className="truncate">{secret.metadata.url}</span>}
                    <span>· {new Date(secret.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {revealed === secret.id ? (
                    <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <code className="text-xs text-gray-700 break-all flex-1">
                        {revealedValue || '••••••••••••'}
                      </code>
                      <button
                        onClick={() => handleCopy(revealedValue)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">••••••••••••••••</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleReveal(secret)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title={revealed === secret.id ? 'Hide' : 'Reveal'}
                >
                  {revealed === secret.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(secret.id)}
                  className="p-2 text-gray-300 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
